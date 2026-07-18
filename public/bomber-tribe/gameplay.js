'use strict';

function updatePlayer(player, dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has('arrowleft') || keys.has('a') || touchDirections.has('left')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d') || touchDirections.has('right')) dx += 1;
  if (keys.has('arrowup') || keys.has('w') || touchDirections.has('up')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s') || touchDirections.has('down')) dy += 1;

  if (dx || dy) {
    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;
    if (dx !== 0) player.facing = Math.sign(dx);
    moveEntity(player, dx * player.speed * dt, dy * player.speed * dt);
  }
}

function updateBot(bot, dt) {
  bot.thinkTimer -= dt;
  const tx = Math.floor(bot.x);
  const ty = Math.floor(bot.y);
  const targetReached = bot.target && Math.hypot(bot.x - (bot.target.x + 0.5), bot.y - (bot.target.y + 0.5)) < 0.09;

  if (bot.thinkTimer <= 0 || !bot.target || targetReached || isCellBlocked(bot.target.x, bot.target.y, bot)) {
    bot.thinkTimer = randomRange(roundDifficulty.thinkMin, roundDifficulty.thinkMax);
    bot.target = chooseBotTarget(bot, tx, ty);
  }

  if (bot.target) {
    const targetX = bot.target.x + 0.5;
    const targetY = bot.target.y + 0.5;
    let dx = targetX - bot.x;
    let dy = targetY - bot.y;
    const length = Math.hypot(dx, dy);
    if (length > 0.02) {
      dx /= length;
      dy /= length;
      if (dx !== 0) bot.facing = Math.sign(dx);
      moveEntity(bot, dx * bot.speed * dt, dy * bot.speed * dt);
    }
  }

  const adjacentCrate = neighbors(tx, ty).some(([x, y]) => board[y]?.[x] === TILE_CRATE);
  const player = entities[0];
  const nearPlayer = player.alive && Math.abs(Math.floor(player.x) - tx) + Math.abs(Math.floor(player.y) - ty) <= 2;
  const trappedOpponent = entities.some(other => other.alive && other.id !== bot.id && Math.hypot(other.x - bot.x, other.y - bot.y) < 1.7);

  if (bot.bombCooldown <= 0 && bot.activeBombs < bot.maxBombs && !bombAt(tx, ty)) {
    const threatened = isCellThreatened(tx, ty, 1.2);
    if (!threatened && (adjacentCrate || nearPlayer || trappedOpponent) && Math.random() < roundDifficulty.aggression) {
      placeBomb(bot);
      bot.bombCooldown = 0.75;
      const escape = safeNeighbors(tx, ty, bot, true);
      if (escape.length) bot.target = escape[Math.floor(Math.random() * escape.length)];
    }
  }
}

function chooseBotTarget(bot, tx, ty) {
  const currentThreat = isCellThreatened(tx, ty, 2.6);
  let options = safeNeighbors(tx, ty, bot, currentThreat);
  if (!options.length) return { x: tx, y: ty };

  if (currentThreat) {
    const safest = options.filter(cell => !isCellThreatened(cell.x, cell.y, 2.6));
    if (safest.length) options = safest;
    options.sort((a, b) => cellSafetyScore(b.x, b.y) - cellSafetyScore(a.x, a.y));
    return options[0];
  }

  const player = entities[0];
  if (player.alive && Math.random() < 0.68) {
    const ptx = Math.floor(player.x);
    const pty = Math.floor(player.y);
    options.sort((a, b) =>
      (Math.abs(a.x - ptx) + Math.abs(a.y - pty)) -
      (Math.abs(b.x - ptx) + Math.abs(b.y - pty))
    );
    return options[0];
  }

  return options[Math.floor(Math.random() * options.length)];
}

function safeNeighbors(tx, ty, entity, urgent = false) {
  const result = [];
  for (const [x, y] of neighbors(tx, ty)) {
    if (isCellBlocked(x, y, entity)) continue;
    if (!urgent && isCellThreatened(x, y, 0.8)) continue;
    result.push({ x, y });
  }
  if (!isCellBlocked(tx, ty, entity)) result.push({ x: tx, y: ty });
  return result;
}

function cellSafetyScore(tx, ty) {
  let scoreValue = 0;
  for (const [x, y] of neighbors(tx, ty)) {
    if (board[y]?.[x] === TILE_FLOOR && !bombAt(x, y)) scoreValue += 1;
  }
  if (!isCellThreatened(tx, ty, 2.5)) scoreValue += 4;
  return scoreValue + Math.random() * 0.2;
}

function neighbors(x, y) {
  return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
}

function moveEntity(entity, dx, dy) {
  const nextX = entity.x + dx;
  if (!collides(entity, nextX, entity.y)) entity.x = nextX;
  const nextY = entity.y + dy;
  if (!collides(entity, entity.x, nextY)) entity.y = nextY;

  for (const bomb of bombs) {
    if (bomb.passIds.has(entity.id)) {
      const bx = bomb.x + 0.5;
      const by = bomb.y + 0.5;
      if (Math.hypot(entity.x - bx, entity.y - by) > 0.76) bomb.passIds.delete(entity.id);
    }
  }
}

function collides(entity, x, y) {
  const radius = entity.radius;
  const minX = Math.floor(x - radius);
  const maxX = Math.floor(x + radius);
  const minY = Math.floor(y - radius);
  const maxY = Math.floor(y + radius);

  for (let ty = minY; ty <= maxY; ty++) {
    for (let tx = minX; tx <= maxX; tx++) {
      if (board[ty]?.[tx] === TILE_WALL || board[ty]?.[tx] === TILE_CRATE) {
        if (circleRectCollision(x, y, radius, tx, ty, 1, 1)) return true;
      }
    }
  }

  for (const bomb of bombs) {
    if (bomb.passIds.has(entity.id)) continue;
    if (circleRectCollision(x, y, radius, bomb.x + 0.08, bomb.y + 0.08, 0.84, 0.84)) return true;
  }
  return false;
}

function circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

function isCellBlocked(x, y, entity = null) {
  if (board[y]?.[x] !== TILE_FLOOR) return true;
  const bomb = bombAt(x, y);
  return Boolean(bomb && (!entity || !bomb.passIds.has(entity.id)));
}

function placeBomb(entity) {
  if (state !== 'playing' || paused || !entity.alive || entity.activeBombs >= entity.maxBombs) return;
  const x = Math.floor(entity.x);
  const y = Math.floor(entity.y);
  if (bombAt(x, y) || board[y]?.[x] !== TILE_FLOOR) return;
  bombs.push({
    x, y,
    timer: 2.05,
    range: entity.flame,
    owner: entity,
    passIds: new Set([entity.id]),
    pulse: Math.random() * Math.PI * 2
  });
  entity.activeBombs += 1;
  tone(250, 0.05, 'square', 0.018, 190);
}

function updateBombs(dt) {
  for (const bomb of bombs) {
    bomb.timer -= dt;
    bomb.pulse += dt * 8;
  }
  const exploding = bombs.filter(bomb => bomb.timer <= 0);
  for (const bomb of exploding) detonateBomb(bomb);
}

function detonateBomb(bomb) {
  const index = bombs.indexOf(bomb);
  if (index === -1) return;
  bombs.splice(index, 1);
  bomb.owner.activeBombs = Math.max(0, bomb.owner.activeBombs - 1);

  const cells = getBlastCells(bomb, true);
  explosions.push({ cells, timer: 0.48, age: 0, owner: bomb.owner });
  explosionSound();

  for (const cell of cells) {
    const key = `${cell.x},${cell.y}`;
    if (cell.crate) {
      board[cell.y][cell.x] = TILE_FLOOR;
      if (bomb.owner.human) score += 100;
      if (Math.random() < 0.27) {
        const roll = Math.random();
        powerups.set(key, roll < 0.42 ? 'bomb' : roll < 0.78 ? 'flame' : 'speed');
      }
    }

    const chained = bombAt(cell.x, cell.y);
    if (chained) chained.timer = Math.min(chained.timer, 0.025);
    createExplosionParticles(cell.x + 0.5, cell.y + 0.5);
  }
}

function getBlastCells(bomb, includeCrates = true) {
  const cells = [{ x: bomb.x, y: bomb.y, crate: false }];
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dy] of directions) {
    for (let step = 1; step <= bomb.range; step++) {
      const x = bomb.x + dx * step;
      const y = bomb.y + dy * step;
      const tile = board[y]?.[x];
      if (tile === undefined || tile === TILE_WALL) break;
      if (tile === TILE_CRATE) {
        if (includeCrates) cells.push({ x, y, crate: true });
        break;
      }
      cells.push({ x, y, crate: false });
    }
  }
  return cells;
}

function updateExplosions(dt) {
  for (const explosion of explosions) {
    explosion.timer -= dt;
    explosion.age += dt;
    for (const entity of entities) {
      if (!entity.alive || entity.invulnerable > 0) continue;
      const tx = Math.floor(entity.x);
      const ty = Math.floor(entity.y);
      if (explosion.cells.some(cell => cell.x === tx && cell.y === ty)) {
        entity.alive = false;
        if (entity.human) {
          endGame(false);
        } else {
          if (explosion.owner.human) score += 500;
          explosion.owner.kills += 1;
          tone(420, 0.09, 'square', 0.025, 180);
        }
      }
    }
  }
  explosions = explosions.filter(explosion => explosion.timer > 0);
}

function isCellThreatened(tx, ty, horizon = 2.5) {
  if (explosions.some(explosion => explosion.cells.some(cell => cell.x === tx && cell.y === ty))) return true;
  for (const bomb of bombs) {
    if (bomb.timer > horizon) continue;
    if (getBlastCells(bomb, true).some(cell => cell.x === tx && cell.y === ty)) return true;
  }
  return false;
}

function bombAt(x, y) {
  return bombs.find(bomb => bomb.x === x && bomb.y === y);
}

function collectPowerup(entity) {
  const tx = Math.floor(entity.x);
  const ty = Math.floor(entity.y);
  const key = `${tx},${ty}`;
  const type = powerups.get(key);
  if (!type) return;
  powerups.delete(key);
  if (type === 'bomb') entity.maxBombs = Math.min(5, entity.maxBombs + 1);
  if (type === 'flame') entity.flame = Math.min(6, entity.flame + 1);
  if (type === 'speed') {
    entity.speedLevel = Math.min(4, entity.speedLevel + 1);
    entity.speed = Math.min(4.75, entity.speed + 0.28);
  }
  if (entity.human) score += 150;
  tone(type === 'bomb' ? 460 : type === 'flame' ? 620 : 780, 0.12, 'square', 0.025, 920);
  showBanner(type === 'bomb' ? '+1 bom' : type === 'flame' ? '+1 bereik' : '+ snelheid', 0.8);
}

function createExplosionParticles(x, y) {
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomRange(1.4, 4.4);
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: randomRange(0.22, 0.55),
      maxLife: 0.55,
      size: randomRange(0.05, 0.13)
    });
  }
}

function updateParticles(dt) {
  for (const particle of particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.94;
    particle.vy *= 0.94;
  }
  particles = particles.filter(particle => particle.life > 0);
}
