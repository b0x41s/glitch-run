'use strict';

// Bomber Tribe v1.4.1, actievere bots die alleen met een vluchtroute bombarderen.
characters[1].name = 'Laurens';
characters[2].name = 'Lisette';
characters[3].name = 'Tamara';

const previousBalancedStartGame = startGame;

startGame = function startBalancedRound() {
  previousBalancedStartGame();

  for (const bot of entities.slice(1)) {
    bot.aiBombTimer = randomRange(0.75, 1.35);
    bot.aiRepathTimer = 0;
    bot.escapeBomb = null;
    bot.escapePath = [];
    bot.target = null;
  }

  updateUI();
};

updateBot = function updateActiveSafeBot(bot, dt) {
  if (!Array.isArray(bot.escapePath)) bot.escapePath = [];
  if (!Number.isFinite(bot.aiBombTimer)) bot.aiBombTimer = randomRange(0.75, 1.35);
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
    bot.aiBombTimer = Math.max(bot.aiBombTimer, randomRange(0.55, 0.95));
  }

  if (bot.target && distanceToTile(bot, bot.target) < 0.1) {
    if (bot.escapePath.length && sameTile(bot.escapePath[0], bot.target)) {
      bot.escapePath.shift();
    }
    bot.target = bot.escapePath[0] || null;
  }

  if (bot.target && isCellBlocked(bot.target.x, bot.target.y, bot)) {
    bot.escapePath = [];
    bot.target = null;
    bot.aiRepathTimer = 0;
  }

  const dangerHere = cellDangerTime(tx, ty);
  const threatened = dangerHere <= 2.9;
  const ownBlast = bot.escapeBomb ? getBlastCells(bot.escapeBomb, true) : [];
  const outsideOwnBlast = !bot.escapeBomb || !ownBlast.some(cell => cell.x === tx && cell.y === ty);

  if (bot.escapeBomb && outsideOwnBlast && dangerHere > 2.9) {
    bot.escapePath = [];
    bot.target = null;
  } else if ((threatened || bot.escapeBomb) && (!bot.target || bot.aiRepathTimer <= 0)) {
    bot.aiRepathTimer = 0.08;
    bot.escapePath = findSafeRoute(bot, tx, ty, bot.escapeBomb);
    bot.target = bot.escapePath[0] || null;
  } else if (!bot.target && bot.thinkTimer <= 0) {
    bot.thinkTimer = randomRange(roundDifficulty.thinkMin, roundDifficulty.thinkMax);
    bot.target = chooseActiveRoamTarget(bot, tx, ty);
  }

  moveBotToTarget(bot, dt);

  tx = Math.floor(bot.x);
  ty = Math.floor(bot.y);
  const centered = Math.hypot(bot.x - tx - 0.5, bot.y - ty - 0.5) < 0.18;

  if (!centered || bot.escapeBomb || bot.aiBombTimer > 0 || bot.bombCooldown > 0) return;
  if (bot.activeBombs >= bot.maxBombs || bombAt(tx, ty) || cellDangerTime(tx, ty) <= 2.9) return;

  const adjacentCrate = neighbors(tx, ty).some(([x, y]) => board[y]?.[x] === TILE_CRATE);
  const opponentInLine = entities.some(other =>
    other.alive && other.id !== bot.id && entityInBlastLine(tx, ty, bot.flame, other)
  );
  const nearbyOpponent = entities.some(other =>
    other.alive && other.id !== bot.id &&
    Math.abs(Math.floor(other.x) - tx) + Math.abs(Math.floor(other.y) - ty) <= 2
  );

  bot.aiBombTimer = randomRange(0.45, 0.85);
  if (!adjacentCrate && !opponentInLine && !nearbyOpponent) return;

  const difficulty = difficultySelect.value;
  const bombChance = difficulty === 'easy' ? 0.58 : difficulty === 'hard' ? 0.9 : 0.78;
  const tacticalBonus = opponentInLine ? 0.08 : nearbyOpponent ? 0.04 : 0;
  if (Math.random() >= Math.min(0.96, bombChance + tacticalBonus)) return;

  const virtualBomb = {
    x: tx,
    y: ty,
    timer: 2.7,
    range: bot.flame,
    owner: bot,
    passIds: new Set([bot.id])
  };

  const route = findBombEscapeRoute(bot, tx, ty, virtualBomb);
  if (!route.length) return;

  const bomb = placeBomb(bot);
  if (!bomb) return;
  bomb.timer = 2.7;

  bot.escapeBomb = bomb;
  bot.escapePath = route;
  bot.target = route[0];
  bot.aiRepathTimer = 0.05;
  bot.bombCooldown = 0.9;
};

function chooseActiveRoamTarget(bot, tx, ty) {
  let options = safeNeighbors(tx, ty, bot, false)
    .filter(cell => cellDangerTime(cell.x, cell.y) > 2.7);

  if (!options.length) return originalChooseBotTarget(bot, tx, ty);

  const powerupOptions = options.filter(cell => powerups.has(`${cell.x},${cell.y}`));
  if (powerupOptions.length) return powerupOptions[0];

  const player = entities[0];
  if (player?.alive && Math.random() < 0.72) {
    const ptx = Math.floor(player.x);
    const pty = Math.floor(player.y);
    options.sort((a, b) =>
      (Math.abs(a.x - ptx) + Math.abs(a.y - pty)) -
      (Math.abs(b.x - ptx) + Math.abs(b.y - pty))
    );
    return options[0];
  }

  options.sort((a, b) => cellSafetyScore(b.x, b.y) - cellSafetyScore(a.x, a.y));
  return options[Math.floor(Math.random() * Math.min(2, options.length))];
}

function findBombEscapeRoute(bot, startX, startY, bomb) {
  const blastKeys = new Set(getBlastCells(bomb, true).map(cell => `${cell.x},${cell.y}`));
  const queue = [{ x: startX, y: startY, path: [], elapsed: 0 }];
  const visited = new Set([`${startX},${startY}`]);

  while (queue.length) {
    const node = queue.shift();
    const outsideBlast = !blastKeys.has(`${node.x},${node.y}`);
    const exits = countPlanningExits(node.x, node.y, bot, startX, startY, bomb);

    if (
      node.path.length &&
      outsideBlast &&
      exits > 0 &&
      node.elapsed < bomb.timer - 0.3 &&
      !dangerousOnArrival(node.x, node.y, node.elapsed, bomb)
    ) {
      return node.path;
    }

    if (node.path.length >= 8) continue;

    for (const [nx, ny] of neighbors(node.x, node.y)) {
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (!planningCellOpen(nx, ny, bot, startX, startY, bomb)) continue;

      const elapsed = node.elapsed + 1 / Math.max(1, bot.speed);
      if (elapsed >= bomb.timer - 0.22) continue;
      if (dangerousOnArrival(nx, ny, elapsed, bomb)) continue;

      visited.add(key);
      queue.push({
        x: nx,
        y: ny,
        elapsed,
        path: [...node.path, { x: nx, y: ny }]
      });
    }
  }

  return [];
}
