'use strict';
(function () {
  var game = window.CL;
  var canvas = document.querySelector('#game');
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (!game || !canvas || !ctx) return;

  var colors = {
    bg: '#091219', grid: 'rgba(216,219,226,.05)', text: '#d8dbe2',
    white: '#f7f6f6', green: '#39e072', purple: '#9e42e7',
    fan: '#57a8ff', bumper: '#ffbf5a'
  };

  function safeDraw(drawer) {
    try { drawer(); } catch (error) {
      if (window.console && console.warn) console.warn('Contraption draw fallback:', error);
    }
  }

  function roundedRectPath(x, y, width, height, radius) {
    var r = Math.max(0, Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2));
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
    for (var gx = 0; gx <= game.W; gx += 50) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, game.H); ctx.stroke();
    }
    for (var gy = 0; gy <= game.H; gy += 50) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(game.W, gy); ctx.stroke();
    }
  }

  function drawGoal() {
    var goal = game.goal;
    ctx.save();
    ctx.fillStyle = 'rgba(158,66,231,.16)';
    ctx.strokeStyle = colors.purple;
    ctx.lineWidth = 4;
    if (ctx.setLineDash) ctx.setLineDash([10, 8]);
    ctx.beginPath();
    roundedRectPath(goal.x, goal.y, goal.w, goal.h, 14);
    ctx.fill(); ctx.stroke();
    if (ctx.setLineDash) ctx.setLineDash([]);
    ctx.fillStyle = colors.white;
    ctx.font = '700 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('DOEL', goal.x + goal.w / 2, goal.y - 13);
    ctx.restore();
  }

  function drawBall(item, time) {
    ctx.save();
    if (game.state.mode === 'build') {
      var pulse = 38 + Math.sin(time * 0.005) * 5;
      ctx.strokeStyle = 'rgba(57,224,114,.48)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(item.x, item.y, pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = colors.white;
      ctx.font = '900 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('START', item.x, item.y - 46);
    }

    ctx.fillStyle = colors.green;
    try {
      var gradient = ctx.createRadialGradient(item.x - 7, item.y - 9, 2, item.x, item.y, item.r);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(.25, '#a8ffc4');
      gradient.addColorStop(.62, colors.green);
      gradient.addColorStop(1, '#0f6b31');
      ctx.fillStyle = gradient;
    } catch (error) {}

    ctx.shadowColor = 'rgba(57,224,114,.8)';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = colors.white;
    ctx.lineWidth = item === game.state.selected ? 7 : 5;
    ctx.beginPath(); ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawRamp(item) {
    var halfX = Math.cos(item.angle) * item.length / 2;
    var halfY = Math.sin(item.angle) * item.length / 2;
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
    ctx.beginPath(); ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(13,24,33,.55)';
    ctx.beginPath(); ctx.arc(item.x, item.y, item.r * .42, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawFan(item, time) {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.angle);

    var gradient = ctx.createLinearGradient(35, 0, item.length, 0);
    gradient.addColorStop(0, 'rgba(87,168,255,.18)');
    gradient.addColorStop(1, 'rgba(87,168,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(35, -item.width / 2, item.length - 35, item.width);

    ctx.strokeStyle = 'rgba(87,168,255,.65)';
    ctx.lineWidth = 3;
    var phase = game.state.mode === 'run' ? (time * .12) % 38 : 0;
    for (var arrowX = 55 + phase; arrowX < item.length; arrowX += 38) {
      ctx.beginPath();
      ctx.moveTo(arrowX - 14, 0); ctx.lineTo(arrowX + 9, 0);
      ctx.lineTo(arrowX + 1, -7); ctx.moveTo(arrowX + 9, 0); ctx.lineTo(arrowX + 1, 7);
      ctx.stroke();
    }

    ctx.fillStyle = item === game.state.selected ? colors.green : colors.fan;
    ctx.strokeStyle = colors.white;
    ctx.lineWidth = 3;
    ctx.beginPath(); roundedRectPath(-34, -34, 68, 68, 14); ctx.fill(); ctx.stroke();

    if (game.state.mode === 'run') ctx.rotate(time * .008);
    ctx.fillStyle = 'rgba(13,24,33,.76)';
    for (var blade = 0; blade < 4; blade += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-7, -5); ctx.lineTo(0, -30); ctx.lineTo(9, -8); ctx.lineTo(4, 0); ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = colors.white;
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawFloor() {
    ctx.fillStyle = 'rgba(216,219,226,.08)';
    ctx.fillRect(0, game.H - 28, game.W, 28);
    ctx.strokeStyle = 'rgba(216,219,226,.3)';
    ctx.beginPath(); ctx.moveTo(0, game.H - 28); ctx.lineTo(game.W, game.H - 28); ctx.stroke();
  }

  function draw(time) {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, game.W, game.H);
    safeDraw(drawGrid);
    safeDraw(drawGoal);

    var balls = game.state.pieces.filter(function (item) { return item.type === 'ball'; });
    var ramps = game.state.pieces.filter(function (item) { return item.type === 'ramp'; });
    var bumpers = game.state.pieces.filter(function (item) { return item.type === 'bumper'; });
    var fans = game.state.pieces.filter(function (item) { return item.type === 'fan'; });

    balls.forEach(function (item) { safeDraw(function () { drawBall(item, time); }); });
    ramps.forEach(function (item) { safeDraw(function () { drawRamp(item); }); });
    bumpers.forEach(function (item) { safeDraw(function () { drawBumper(item); }); });
    fans.forEach(function (item) { safeDraw(function () { drawFan(item, time); }); });
    safeDraw(drawFloor);
  }

  game.canvas = canvas;
  game.draw = draw;
})();