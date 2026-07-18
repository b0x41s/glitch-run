'use strict';

// Langere rondes en een veiligere bot-AI.
const BOMBER_ROUND_TIME = 300;
const originalBomberStartGame = startGame;
const originalBomberPlaceBomb = placeBomb;
const originalChooseBotTarget = chooseBotTarget;

startGame = function startLongerRound() {
  originalBomberStartGame();
  timeLeft = BOMBER_ROUND_TIME;
  updateUI();
};

placeBomb = function placeTrackableBomb(entity) {
  if (!entity) return null;
  const x = Math.floor(entity.x);
  const y = Math.floor(entity.y);
  const before = entity.activeBombs;
  originalBomberPlaceBomb(entity);
  return entity.activeBombs > before ? bombAt(x, y) || null : null;
};

updateBot = function updateSaferBot(bot, dt) {
  if (!Array.isArray(bot.escapePath)) bot.escapePath = [];
  if (!Number.isFinite(bot.aiBombTimer)) bot.aiBombTimer = randomRange(0.7, 1.3);
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
    bot.bombCooldown = Math.max(bot.bombCooldown, 0.45);
  }

  if (bot.target && distanceToTile(bot, bot.target) < 0.1) {
    if (bot.escapePath.length && sameTile(bot.escapePath[0], bot.target)) bot.escapePath.shift();
    bot.target = null;
  }

  if (bot.target && isCellBlocked(bot.target.x, bot.target.y, bot)) {
    bot.escapePath = [];
    bot.target = null;
  }

  const threatened = cellDangerTime(tx, ty) <= 2.35;
  const outsideOwnBlast = !bot.escapeBomb || !getBlastCells(bot.escapeBomb, true).some(cell => cell.x === tx && cell.y === ty);
  const waitingSafely = Boolean(bot.escapeBomb && outsideOwnBlast && cellDangerTime(tx, ty) > 2.5);

  if (waitingSafely) {
    bot.escapePath = [];
    bot.target = null;
  } else if ((threatened || bot.escapeBomb) && (!bot.escapePath.length || bot.aiRepathTimer <= 0)) {
    bot.aiRepathTimer = 0.14;
    bot.escapePath = findSafeRoute(bot, tx, ty, bot.escapeBomb);
    bot.target = bot.escapePath[0] || null;
  } else if (!bot.target && bot.thinkTimer <= 0) {
    bot.thinkTimer = randomRange(roundDifficulty.thinkMin, roundDifficulty.thinkMax);
    bot.target = originalChooseBotTarget(bot, tx, ty);
  }

  moveBotToTarget(bot, dt);

  tx = Math.floor(bot.x);
  ty = Math.floor(bot.y);
  const centered = Math.hypot(bot.x - tx - 0.5, bot.y - ty - 0.5) < 0.2;
  if (!centered || bot.escapeBomb || bot.aiBombTimer > 0 || bot.bombCooldown > 0) return;
  if (bot.activeBombs >= bot.maxBombs || bombAt(tx, ty) || cellDangerTime(tx, ty) <= 2.5) return;

  bot.aiBombTimer = randomRange(0.55, 0.95);
  const adjacentCrate = neighbors(tx, ty).some(([x, y]) => board[y]?.[x] === TILE_CRATE);
  const opponentInLine = entities.some(other => other.alive && other.id !== bot.id && entityInBlastLine(tx, ty, bot.flame, other));
  if (!adjacentCrate && !opponentInLine) return;
  if (Math.random() >= roundDifficulty.aggression) return;

  const virtualBomb = { x: tx, y: ty, timer: 2.05, range: bot.flame, owner: bot, passIds: new Set([bot.id]) };
  const route = findSafeRoute(bot, tx, ty, virtualBomb, true);
  if (!route.length) return;

  const bomb = placeBomb(bot);
  if (!bomb) return;
  bot.escapeBomb = bomb;
  bot.escapePath = route;
  bot.target = route[0];
  bot.aiRepathTimer = 0.12;
  bot.bombCooldown = 1.25;
};

function moveBotToTarget(bot, dt) {
  if (!bot.target) return;
  let dx = bot.target.x + 0.5 - bot.x;
  let dy = bot.target.y + 0.5 - bot.y;
  if (Math.abs(dx) < 0.035) dx = 0;
  if (Math.abs(dy) < 0.035) dy = 0;
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
  const timer = extraBomb?.timer ?? cellDangerTime(startX, startY);
  const maxDepth = newBomb ? Math.max(3, Math.min(7, Math.floor((timer - 0.35) * bot.speed))) : 9;
  const queue = [{ x: startX, y: startY, path: [], elapsed: 0 }];
  const visited = new Set([`${startX},${startY}`]);
  let fallback = [];
  let fallbackScore = -Infinity;

  while (queue.length) {
    const node = queue.shift();
    const outsideBlast = !extraBomb || !getBlastCells(extraBomb, true).some(cell => cell.x === node.x && cell.y === node.y);
    const danger = cellDangerTime(node.x, node.y, extraBomb);
    const exits = neighbors(node.x, node.y).filter(([x, y]) => !isCellBlocked(x, y, bot)).length;
    const score = (outsideBlast ? 10 : 0) + Math.min(6, danger) + exits - node.elapsed;

    if (node.path.length && outsideBlast && danger > node.elapsed + 1.05 && exits) return node.path;
    if (node.path.length && score > fallbackScore) {
      fallback = node.path;
      fallbackScore = score;
    }
    if (node.path.length >= maxDepth) continue;

    for (const [nx, ny] of neighbors(node.x, node.y)) {
      const key = `${nx},${ny}`;
      if (visited.has(key) || !planningCellOpen(nx, ny, bot, startX, startY, extraBomb)) continue;
      const elapsed = node.elapsed + 1 / Math.max(1, bot.speed);
      if (dangerousOnArrival(nx, ny, elapsed, extraBomb)) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny, elapsed, path: [...node.path, { x: nx, y: ny }] });
    }
  }
  return newBomb ? [] : fallback;
}

function cellDangerTime(tx, ty, extraBomb = null) {
  if (explosions.some(explosion => explosion.cells.some(cell => cell.x === tx && cell.y === ty))) return 0;
  let earliest = Infinity;
  const allBombs = extraBomb && !bombs.includes(extraBomb) ? [...bombs, extraBomb] : bombs;
  for (const bomb of allBombs) {
    if (getBlastCells(bomb, true).some(cell => cell.x === tx && cell.y === ty)) earliest = Math.min(earliest, bomb.timer);
  }
  return earliest;
}

function dangerousOnArrival(tx, ty, arrival, extraBomb = null) {
  const allBombs = extraBomb && !bombs.includes(extraBomb) ? [...bombs, extraBomb] : bombs;
  return allBombs.some(bomb =>
    getBlastCells(bomb, true).some(cell => cell.x === tx && cell.y === ty) &&
    arrival >= bomb.timer - 0.2 && arrival <= bomb.timer + 0.55
  );
}

function planningCellOpen(x, y, bot, startX, startY, extraBomb) {
  if (board[y]?.[x] !== TILE_FLOOR) return false;
  const existing = bombAt(x, y);
  if (existing && !existing.passIds.has(bot.id)) return false;
  if (extraBomb && x === extraBomb.x && y === extraBomb.y) return x === startX && y === startY;
  return true;
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
