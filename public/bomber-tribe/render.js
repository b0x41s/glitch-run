'use strict';

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawBoard();
  drawPowerups();
  drawBombs();
  drawExplosions();
  drawEntities();
  drawParticles();
  drawVignette();

  if (paused && state === 'playing') {
    ctx.fillStyle = 'rgba(7, 14, 20, 0.68)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f7f6f6';
    ctx.font = '800 34px Satoshi, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GEPAUZEERD', canvas.width / 2, canvas.height / 2);
    ctx.font = '500 15px Satoshi, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(216,219,226,0.7)';
    ctx.fillText('Druk op P om verder te gaan', canvas.width / 2, canvas.height / 2 + 30);
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#0c1822');
  gradient.addColorStop(1, '#081119');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBoard() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const px = x * TILE;
      const py = y * TILE;
      const tile = board[y]?.[x] ?? TILE_WALL;

      if (tile === TILE_FLOOR) {
        ctx.fillStyle = (x + y) % 2 ? '#101f29' : '#0f1c26';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = 'rgba(216,219,226,0.025)';
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      } else if (tile === TILE_WALL) {
        drawRoundedRect(px + 4, py + 4, TILE - 8, TILE - 8, 11, '#35204a');
        const wallGradient = ctx.createLinearGradient(px, py, px + TILE, py + TILE);
        wallGradient.addColorStop(0, 'rgba(158,66,231,0.7)');
        wallGradient.addColorStop(1, 'rgba(67,39,88,0.85)');
        ctx.fillStyle = wallGradient;
        roundedRectPath(px + 6, py + 6, TILE - 12, TILE - 12, 9);
        ctx.fill();
        ctx.strokeStyle = 'rgba(247,246,246,0.08)';
        ctx.stroke();
        ctx.fillStyle = 'rgba(247,246,246,0.06)';
        drawRoundedRect(px + 11, py + 10, TILE - 22, 5, 3, 'rgba(247,246,246,0.08)');
      } else if (tile === TILE_CRATE) {
        drawRoundedRect(px + 5, py + 5, TILE - 10, TILE - 10, 10, '#17392a');
        ctx.strokeStyle = 'rgba(57,224,114,0.42)';
        ctx.lineWidth = 2;
        roundedRectPath(px + 7, py + 7, TILE - 14, TILE - 14, 8);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(216,219,226,0.14)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px + 13, py + 13);
        ctx.lineTo(px + TILE - 13, py + TILE - 13);
        ctx.moveTo(px + TILE - 13, py + 13);
        ctx.lineTo(px + 13, py + TILE - 13);
        ctx.stroke();
      }
    }
  }
}

function drawPowerups() {
  for (const [key, type] of powerups) {
    const [x, y] = key.split(',').map(Number);
    const cx = x * TILE + TILE / 2;
    const cy = y * TILE + TILE / 2;
    ctx.save();
    ctx.shadowColor = type === 'flame' ? '#ff9f43' : type === 'bomb' ? '#9e42e7' : '#39e072';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#f7f6f6';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.font = '18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type === 'bomb' ? '💣' : type === 'flame' ? '🔥' : '⚡', cx, cy + 1);
  }
}

function drawBombs() {
  for (const bomb of bombs) {
    const cx = (bomb.x + 0.5) * TILE;
    const cy = (bomb.y + 0.54) * TILE;
    const pulse = 1 + Math.sin(bomb.pulse) * 0.055;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = bomb.timer < 0.65 ? '#ff5e70' : '#9e42e7';
    ctx.shadowBlur = bomb.timer < 0.65 ? 20 : 10;
    ctx.fillStyle = '#090d11';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#202a32';
    ctx.beginPath();
    ctx.arc(-5, -6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8dbe2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(5, -12);
    ctx.quadraticCurveTo(10, -21, 17, -14);
    ctx.stroke();
    ctx.fillStyle = bomb.timer < 0.65 ? '#ff5e70' : '#39e072';
    ctx.beginPath();
    ctx.arc(18, -14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawExplosions() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const explosion of explosions) {
    const intensity = Math.min(1, explosion.timer * 5);
    for (const cell of explosion.cells) {
      const cx = (cell.x + 0.5) * TILE;
      const cy = (cell.y + 0.5) * TILE;
      const radius = 17 + Math.sin(explosion.age * 26) * 4;
      const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius + 10);
      gradient.addColorStop(0, `rgba(247,246,246,${0.92 * intensity})`);
      gradient.addColorStop(0.25, `rgba(57,224,114,${0.85 * intensity})`);
      gradient.addColorStop(0.62, `rgba(158,66,231,${0.58 * intensity})`);
      gradient.addColorStop(1, 'rgba(158,66,231,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawEntities() {
  const drawOrder = entities.filter(entity => entity.alive).sort((a, b) => a.y - b.y);
  for (const entity of drawOrder) {
    const px = entity.x * TILE;
    const py = entity.y * TILE;
    const bob = Math.sin(entity.bob) * 1.5;
    const radius = 18;
    ctx.save();
    ctx.translate(px, py + bob);
    ctx.globalAlpha = entity.invulnerable > 0 && Math.floor(entity.invulnerable * 12) % 2 ? 0.45 : 1;
    ctx.shadowColor = entity.human ? '#39e072' : '#9e42e7';
    ctx.shadowBlur = entity.human ? 18 : 10;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = entity.human ? '#39e072' : '#9e42e7';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.clip();
    const image = imageCache[entity.characterIndex];
    if (image.complete && image.naturalWidth) {
      const sw = image.naturalWidth * 0.78;
      const sh = image.naturalHeight * 0.73;
      const sx = (image.naturalWidth - sw) / 2;
      const sy = image.naturalHeight * 0.02;
      ctx.drawImage(image, sx, sy, sw, sh, -radius, -radius, radius * 2, radius * 2);
    } else {
      ctx.fillStyle = '#14202b';
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    }
    ctx.restore();

    ctx.save();
    ctx.font = '800 9px Satoshi, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nameWidth = ctx.measureText(entity.human ? 'JIJ' : entity.name.toUpperCase()).width + 12;
    drawRoundedRect(px - nameWidth / 2, py + 22, nameWidth, 15, 7, entity.human ? 'rgba(57,224,114,0.9)' : 'rgba(13,24,33,0.88)');
    ctx.fillStyle = entity.human ? '#06120b' : '#f7f6f6';
    ctx.fillText(entity.human ? 'JIJ' : entity.name.toUpperCase(), px, py + 29.5);
    ctx.restore();
  }
}

function drawParticles() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const particle of particles) {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = `rgba(57,224,114,${alpha})`;
    ctx.beginPath();
    ctx.arc(particle.x * TILE, particle.y * TILE, particle.size * TILE, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawVignette() {
  const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.22, canvas.width / 2, canvas.height / 2, canvas.width * 0.72);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawRoundedRect(x, y, width, height, radius, fillStyle) {
  ctx.fillStyle = fillStyle;
  roundedRectPath(x, y, width, height, radius);
  ctx.fill();
}

function roundedRectPath(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
