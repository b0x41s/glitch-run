'use strict';

// Bomber Tribe v1.3.0, veiligere bot-AI met routeplanning.
const BOMBER_ROUND_TIME = 150;
const originalBomberStartGame = startGame;
const originalBomberPlaceBomb = placeBomb;
const originalChooseBotTarget = chooseBotTarget;

startGame = function startVersionedRound() {
  originalBomberStartGame();
  timeLeft = BOMBER_ROUND_TIME;

  for (const bot of entities.slice(1)) {
    bot.aiBombTimer = randomRange(2.0, 3.2);
    bot.aiRepathTimer = 0;
    bot.escapeBomb = null;
    bot.escapePath = [];
  }

  updateUI();
};

placeBomb = function placeTrackableBomb(entity) {
  if (!entity) return null;
  const x = Math.floor(entity.x);
  const y = Math.floor(entity.y);
  const before = entity.activeBombs;
  originalBomberPlaceBomb(entity);
  const bomb = entity.activeBombs > before ? bombAt(x, y) || null : null;

  // Bots krijgen iets meer tijd om hun vooraf berekende route uit te voeren.
  if (bomb && !entity.human) bomb.timer = 2.45;
  return bomb;
};

updateBot = function updateSaferBot(bot, dt) {
  if (!Array.isArray(bot.escapePath)) bot.escapePath = [];
  if (!Number.isFinite(bot.aiBombTimer)) bot.aiBombTimer = randomRange(2.0, 3.2);
  if (!Number.isFinite(bot.aiRepathTimer)) bot.aiRepathTimer = 0;
  if (!Object.prototype.hasOwnProperty.call(bot, 'escapeBomb')) bot.escapeBomb = null;

  bot.thinkTimer -= dt;
  bot.aiBombTimer -= dt;
  bot.aiRepathTimer -= dt;

  let tx = Math.floor(bot.x);
  let ty = Math.floor(bot.y);

  if (bot.escapeBomb && !bombs.includes(bot.escapeBomb)) {
    bot.escapeBomb = null;
    bot.escapePath = [];
    bot.target = null;
    bot.bombCooldown = Math.max(bot.bombCooldown, 0.8);
    bot.aiBombTimer = Math.max(bot.aiBombTimer, randomRange(1.4, 2.2));
  }

  if (bot.target && distanceToTile(bot, bot.target) < 0.1) {
    if (bot.escapePath.length && sameTile(bot.escapePath[0], bot.target)) bot.escapePath.shift();
    bot.target = null;
  }

  if (bot.target && isCellBlocked(bot.target.x, bot.target.y, bot)) {
    bot.escapePath = [];
    bot.target = null;
  }

  const dangerHere = cellDangerTime(tx, ty);
  const threatened = dangerHere <= 2.75;
  const ownBlast = bot.escapeBomb ? getBlastCells(bot.escapeBomb, true) : [];
  const outsideOwnBlast = !bot.escapeBomb || !ownBlast.some(cell => cell.x === tx && cell.y === ty);
  const waitingSafely = Boolean(
    bot.escapeBomb &&
    outsideOwnBlast &&
    dangerHere > 2.75 &&
    countOpenExits(tx, ty, bot) > 0
  );

  if (waitingSafely) {
    bot.escapePath = [];
    bot.target = null;
  } else if ((threatened || bot.escapeBomb) && (!bot.escapePath.length || bot.aiRepathTimer <= 0)) {
    bot.aiRepathTimer = 0.1;
    bot.escapePath = findSafeRoute(bot, tx, ty, bot.escapeBomb);
    bot.target = bot.escapePath[0] || null;
  } else if (!bot.target && bot.thinkTimer <= 0) {
    bot.thinkTimer = randomRange(roundDifficulty.thinkMin, roundDifficulty.thinkMax);
    bot.target = chooseSaferRoamTarget(bot, tx, ty);
  }

  moveBotToTarget(bot, dt);

  tx = Math.floor(bot.x);
  ty = Math.floor(bot.y);
  const centered = Math.hypot(bot.x - tx - 0.5, bot.y - ty - 0.5) < 0.16;

  if (!centered || bot.escapeBomb || bot.aiBombTimer > 0 || bot.bombCooldown > 0) return;
  if (bot.activeBombs >= bot.maxBombs || bombAt(tx, ty) || cellDangerTime(tx, ty) <= 3.0) return;

  bot.aiBombTimer = randomRange(1.3, 2.2);
  const adjacentCrate = neighbors(tx, ty).some(([x, y]) => board[y]?.[x] === TILE_CRATE);
  const opponentInLine = entities.some(other =>
    other.alive && other.id !== bot.id && entityInBlastLine(tx, ty, bot.flame, other)
  );

  if (!adjacentCrate && !opponentInLine) return;
  if (Math.random() >= roundDifficulty.aggression * 0.42) return;

  const virtualBomb = {
    x: tx,
    y: ty,
    timer: 2.45,
    range: bot.flame,
    owner: bot,
    passIds: new Set([bot.id])
  };

  const route = findSafeRoute(bot, tx, ty, virtualBomb, true);
  if (!route.length || !routeIsComfortablySafe(bot, route, virtualBomb)) return;

  const bomb = placeBomb(bot);
  if (!bomb) return;

  bot.escapeBomb = bomb;
  bot.escapePath = route;
  bot.target = route[0];
  bot.aiRepathTimer = 0.08;
  bot.bombCooldown = 1.5;
};

function chooseSaferRoamTarget(bot, tx, ty) {
  const options = safeNeighbors(tx, ty, bot, false)
    .filter(cell => cellDangerTime(cell.x, cell.y) > 2.9)
    .sort((a, b) => cellSafetyScore(b.x, b.y) - cellSafetyScore(a.x, a.y));

  if (!options.length) return originalChooseBotTarget(bot, tx, ty);
  return options[Math.floor(Math.random() * Math.min(2, options.length))];
}

function moveBotToTarget(bot, dt) {
  if (!bot.target) return;
  let dx = bot.target.x + 0.5 - bot.x;
  let dy = bot.target.y + 0.5 - bot.y;

  if (Math.abs(dx) < 0.035) dx = 0;
  if (Math.abs(dy) < 0.035) dy = 0;

  // Beweeg op één as tegelijk, zodat bots niet aan hoeken blijven haken.
  if (dx && dy) {
    if (Math.abs(dx) > Math.abs(dy)) dy = 0;
    else dx = 0;
  }

  const length = Math.hypot(dx, dy) || 1;
  dx /= length;
  dy /= length;
  if (dx) bot.facing = Math.sign(dx);
  moveEntity(bot, dx * bot.speed * dt, dy * bot.speed * dt);
}

function findSafeRoute(bot, startX, startY, extraBomb = null, newBomb = false) {
  const fuse = extraBomb?.timer ?? cellDangerTime(startX, startY);
  const maxDepth = newBomb ? 9 : 11;
  const queue = [{ x: startX, y: startY, path: [], elapsed: 0 }];
  const visited = new Set([`${startX},${startY}`]);
  let fallback = [];
  let fallbackScore = -Infinity;

  while (queue.length) {
    const node = queue.shift();
    const outsideBlast = !extraBomb || !getBlastCells(extraBomb, true).some(cell => cell.x === node.x && cell.y === node.y);
    const danger = cellDangerTime(node.x, node.y, extraBomb);
    const exits = countPlanningExits(node.x, node.y, bot, startX, startY, extraBomb);
    const travelMargin = fuse - node.elapsed;
    const score = (outsideBlast ? 20 : 0) + Math.min(8, danger) + exits * 2 + travelMargin;

    const safeArrival = danger > node.elapsed + 1.15;
    const comfortableExit = exits >= 2 || node.path.length >= 3;
    if (node.path.length && outsideBlast && safeArrival && comfortableExit && travelMargin > 0.55) {
      return node.path;
    }

    if (node.path.length && outsideBlast && safeArrival && score > fallbackScore) {
      fallback = node.path;
      fallbackScore = score;
    }

    if (node.path.length >= maxDepth) continue;

    for (const [nx, ny] of neighbors(node.x, node.y)) {
      const key = `${nx},${ny}`;
      if (visited.has(key) || !planningCellOpen(nx, ny, bot, startX, startY, extraBomb)) continue;

      const elapsed = node.elapsed + 1 / Math.max(1, bot.speed);
      if (elapsed >= fuse - 0.35 || dangerousOnArrival(nx, ny, elapsed, extraBomb)) continue;

      visited.add(key);
      queue.push({
        x: nx,
        y: ny,
        elapsed,
        path: [...node.path, { x: nx, y: ny }]
      });
    }
  }

  return newBomb ? [] : fallback;
}

function routeIsComfortablySafe(bot, route, bomb) {
  if (!route.length) return false;
  const blast = getBlastCells(bomb, true);
  let elapsed = 0;

  for (const cell of route) {
    elapsed += 1 / Math.max(1, bot.speed);
    if (dangerousOnArrival(cell.x, cell.y, elapsed, bomb)) return false;
  }

  const destination = route[route.length - 1];
  const outsideBlast = !blast.some(cell => cell.x === destination.x && cell.y === destination.y);
  return outsideBlast && elapsed < bomb.timer - 0.55 && countPlanningExits(destination.x, destination.y, bot, bomb.x, bomb.y, bomb) > 0;
}

function cellDangerTime(tx, ty, extraBomb = null) {
  if (explosions.some(explosion => explosion.cells.some(cell => cell.x === tx && cell.y === ty))) return 0;
  let earliest = Infinity;
  const allBombs = extraBomb && !bombs.includes(extraBomb) ? [...bombs, extraBomb] : bombs;

  for (const bomb of allBombs) {
    if (getBlastCells(bomb, true).some(cell => cell.x === tx && cell.y === ty)) {
      earliest = Math.min(earliest, bomb.timer);
    }
  }

  return earliest;
}

function dangerousOnArrival(tx, ty, arrival, extraBomb = null) {
  const allBombs = extraBomb && !bombs.includes(extraBomb) ? [...bombs, extraBomb] : bombs;
  return allBombs.some(bomb =>
    getBlastCells(bomb, true).some(cell => cell.x === tx && cell.y === ty) &&
    arrival >= bomb.timer - 0.35 &&
    arrival <= bomb.timer + 0.65
  );
}

function planningCellOpen(x, y, bot, startX, startY, extraBomb) {
  if (board[y]?.[x] !== TILE_FLOOR) return false;
  const existing = bombAt(x, y);
  if (existing && !existing.passIds.has(bot.id)) return false;
  if (extraBomb && x === extraBomb.x && y === extraBomb.y) return x === startX && y === startY;
  return true;
}

function countPlanningExits(x, y, bot, startX, startY, extraBomb) {
  return neighbors(x, y).filter(([nx, ny]) =>
    planningCellOpen(nx, ny, bot, startX, startY, extraBomb)
  ).length;
}

function countOpenExits(x, y, bot) {
  return neighbors(x, y).filter(([nx, ny]) => !isCellBlocked(nx, ny, bot)).length;
}

function entityInBlastLine(tx, ty, range, entity) {
  const ex = Math.floor(entity.x);
  const ey = Math.floor(entity.y);
  if (ex !== tx && ey !== ty) return false;

  const distance = Math.abs(ex - tx) + Math.abs(ey - ty);
  if (!distance || distance > range) return false;

  const dx = Math.sign(ex - tx);
  const dy = Math.sign(ey - ty);
  for (let step = 1; step <= distance; step++) {
    const tile = board[ty + dy * step]?.[tx + dx * step];
    if (tile === TILE_WALL || tile === TILE_CRATE) return false;
  }
  return true;
}

function distanceToTile(entity, tile) {
  return Math.hypot(entity.x - tile.x - 0.5, entity.y - tile.y - 0.5);
}

function sameTile(a, b) {
  return Boolean(a && b && a.x === b.x && a.y === b.y);
}
