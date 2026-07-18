'use strict';
(() => {
  const game = window.CL;
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const colors = { bg:'#091219', grid:'rgba(216,219,226,.05)', text:'#d8dbe2', white:'#f7f6f6', green:'#39e072', purple:'#9e42e7', fan:'#57a8ff', bumper:'#ffbf5a' };

  function roundedRectPath(x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2));
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function drawGrid() {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= game.W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, game.H); ctx.stroke(); }
    for (let y = 0; y <= game.H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(game.W, y); ctx.stroke(); }
  }

  function drawGoal() {
    const goal = game.goal;
    ctx.save();
    ctx.fillStyle = 'rgba(158,66,231,.16)';
    ctx.strokeStyle = colors.purple;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    roundedRectPath(goal.x, goal.y, goal.w, goal.h, 14);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = colors.white;
    ctx.font = '700 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('DOEL', goal.x + goal.w / 2, goal.y - 13);
    ctx.restore();
  }

  function drawRamp(item) {
    const halfX = Math.cos(item.angle) * item.length / 2;
    const halfY = Math.sin(item.angle) * item.length / 2;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = item === game.state.selected ? colors.green : colors.text;
    ctx.lineWidth = item === game.state.selected ? 15 : 11;
    ctx.beginPath();
    ctx.moveTo(item.x - halfX, item.y - halfY);
    ctx.lineTo(item.x + halfX, item.y + halfY);
    ctx.stroke();
    ctx.restore();
  }

  function drawBumper(item) {
    ctx.save();
    ctx.fillStyle = item === game.state.selected ? colors.green : colors.bumper;
    ctx.strokeStyle = colors.white;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(13,24,33,.55)';
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFan(item, time) {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.angle);
    const gradient = ctx.createLinearGradient(35, 0, item.length, 0);
    gradient.addColorStop(0, 'rgba(87,168,255,.18)');
    gradient.addColorStop(1, 'rgba(87,168,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(35, -item.width / 2, item.length - 35, item.width);

    ctx.strokeStyle = 'rgba(87,168,255,.65)';
    ctx.lineWidth = 3;
    const phase = game.state.mode === 'run' ? (time * 0.12) % 38 : 0;
    for (let arrowX = 55 + phase; arrowX < item.length; arrowX += 38) {
      ctx.beginPath();
      ctx.moveTo(arrowX - 14, 0);
      ctx.lineTo(arrowX + 9, 0);
      ctx.lineTo(arrowX + 1, -7);
      ctx.moveTo(arrowX + 9, 0);
      ctx.lineTo(arrowX + 1, 7);
      ctx.stroke();
    }

    ctx.fillStyle = item === game.state.selected ? colors.green : colors.fan;
    ctx.strokeStyle = colors.white;
    ctx.lineWidth = 3;
    ctx.beginPath();
    roundedRectPath(-34, -34, 68, 68, 14);
    ctx.fill();
    ctx.stroke();
    if (game.state.mode === 'run') ctx.rotate(time * 0.008);
    for (let index = 0; index < 4; index += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = 'rgba(13,24,33,.72)';
      ctx.beginPath();
      ctx.ellipse(0, -15, 8, 19, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBall(item, time) {
    ctx.save();
    if (game.state.mode === 'build') {
      const pulse = 32 + Math.sin(time * 0.005) * 4;
      ctx.strokeStyle = 'rgba(57,224,114,.32)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(item.x, item.y, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(57,224,114,.8)';
      ctx.font = '800 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('START', item.x, item.y - 38);
    }
    const gradient = ctx.createRadialGradient(item.x - 6, item.y - 8, 3, item.x, item.y, item.r);
    gradient.addColorStop(0, '#e2ffeb');
    gradient.addColorStop(0.28, '#75f49e');
    gradient.addColorStop(0.62, colors.green);
    gradient.addColorStop(1, '#137b3a');
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(57,224,114,.55)';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = colors.white;
    ctx.lineWidth = item === game.state.selected ? 6 : 4;
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function draw(time) {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, game.W, game.H);
    drawGrid();
    drawGoal();
    game.state.pieces.filter(item => item.type === 'ramp').forEach(drawRamp);
    game.state.pieces.filter(item => item.type === 'bumper').forEach(drawBumper);
    game.state.pieces.filter(item => item.type === 'fan').forEach(item => drawFan(item, time));
    ctx.fillStyle = 'rgba(216,219,226,.08)';
    ctx.fillRect(0, game.H - 28, game.W, 28);
    ctx.strokeStyle = 'rgba(216,219,226,.3)';
    ctx.beginPath();
    ctx.moveTo(0, game.H - 28);
    ctx.lineTo(game.W, game.H - 28);
    ctx.stroke();
    game.state.pieces.filter(item => item.type === 'ball').forEach(item => drawBall(item, time));
  }

  game.canvas = canvas;
  game.draw = draw;
})();