'use strict';

// Bomber Tribe v1.4.0, actievere bots die alleen met een vluchtroute bombarderen.
characters[1].name = 'Laurens';
characters[2].name = 'Lisette';
characters[3].name = 'Tamara';

const previousBalancedStartGame = startGame;

startGame = function startBalancedRound() {
  previousBalancedStartGame();

  for (const bot of entities.slice(1)) {
    bot.aiBombTimer = randomRange(0.9, 1.6);
    bot.aiRepathTimer = 0;
    bot.escapeBomb = null;
    bot.escapePath = [];
    bot.target = null;
  }

  updateUI();
};

updateBot = function updateActiveSafeBot(bot, dt) {
  if (!Array.isArray(bot.escapePath)) bot.escapePath = [];
  if (!Number.isFinite(bot.aiBombTimer)) bot.aiBombTimer = randomRange(0.9, 1.6);
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
    bot.bombCooldown = Math.max(bot.bombCooldown, 0.55);
    bot.aiBombTimer = Math.max(bot.aiBombTimer, randomRange(0.75, 1.25));
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

  bot.aiBombTimer = randomRange(0.6, 1.05);
  if (!adjacentCrate && !opponentInLine && !nearbyOpponent) return;

  const difficulty = difficultySelect.value;
  const bombChance = difficulty === 'easy' ? 0.48 : difficulty === 'hard' ? 0.82 : 0.68;
  const tacticalBonus = opponentInLine ? 0.12 : nearbyOpponent ? 0.06 : 0;
  if (Math.random() >= Math.min(0.92, bombChance + tacticalBonus)) return;

  const virtualBomb = {
    x: tx,
    y: ty,
    timer: 2.65,
    range: bot.flame,
    owner: bot,
    passIds: new Set([bot.id])
  };

  const route = findSafeRoute(bot, tx, ty, virtualBomb, true);
  if (!route.length || !routeEndsSafely(bot, route, virtualBomb)) return;

  const bomb = placeBomb(bot);
  if (!bomb) return;
  bomb.timer = 2.65;

  bot.escapeBomb = bomb;
  bot.escapePath = route;
  bot.target = route[0];
  bot.aiRepathTimer = 0.06;
  bot.bombCooldown = 1.0;
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

function routeEndsSafely(bot, route, bomb) {
  const blast = getBlastCells(bomb, true);
  let elapsed = 0;

  for (const cell of route) {
    elapsed += 1 / Math.max(1, bot.speed);
    if (dangerousOnArrival(cell.x, cell.y, elapsed, bomb)) return false;
  }

  const destination = route[route.length - 1];
  const outsideBlast = !blast.some(cell => cell.x === destination.x && cell.y === destination.y);
  const hasExit = countPlanningExits(destination.x, destination.y, bot, bomb.x, bomb.y, bomb) > 0;

  return outsideBlast && hasExit && elapsed < bomb.timer - 0.28;
}
