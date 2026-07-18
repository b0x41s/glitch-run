'use strict';
(() => {
  const W = 1000;
  const H = 620;
  const BALL_R = 18;
  const goal = { x: 892, y: 486, w: 72, h: 72 };
  const uid = () => Math.random().toString(36).slice(2);
  const clone = list => list.map(item => ({ ...item }));

  function initialPieces() {
    return [
      { id: uid(), type: 'ball', x: 100, y: 82, vx: 0, vy: 0, r: BALL_R },
      { id: uid(), type: 'ramp', x: 245, y: 210, angle: 0.28, length: 245 },
      { id: uid(), type: 'ramp', x: 505, y: 360, angle: 0.18, length: 220 },
      { id: uid(), type: 'bumper', x: 585, y: 480, r: 31 },
      { id: uid(), type: 'fan', x: 685, y: 495, angle: 0, length: 175, width: 88 }
    ];
  }

  const state = {
    pieces: initialPieces(),
    snapshot: [],
    mode: 'build',
    selectedTool: null,
    selected: null,
    dragging: null,
    dragOffset: { x: 0, y: 0 },
    won: false
  };
  state.snapshot = clone(state.pieces);

  function distanceToSegment(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = px - x1;
    const wy = py - y1;
    const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy || 1)));
    const cx = x1 + t * vx;
    const cy = y1 + t * vy;
    return { distance: Math.hypot(px - cx, py - cy), cx, cy };
  }

  function hitTest(x, y) {
    for (let index = state.pieces.length - 1; index >= 0; index -= 1) {
      const item = state.pieces[index];
      if ((item.type === 'ball' || item.type === 'bumper') && Math.hypot(x - item.x, y - item.y) < item.r + 17) return item;
      if (item.type === 'fan' && Math.hypot(x - item.x, y - item.y) < 55) return item;
      if (item.type === 'ramp') {
        const halfX = Math.cos(item.angle) * item.length / 2;
        const halfY = Math.sin(item.angle) * item.length / 2;
        if (distanceToSegment(x, y, item.x - halfX, item.y - halfY, item.x + halfX, item.y + halfY).distance < 25) return item;
      }
    }
    return null;
  }

  function addPiece(type, x, y) {
    let item;
    if (type === 'ball') {
      state.pieces = state.pieces.filter(piece => piece.type !== 'ball');
      item = { id: uid(), type, x, y, vx: 0, vy: 0, r: BALL_R };
    } else if (type === 'ramp') {
      item = { id: uid(), type, x, y, angle: 0, length: 190 };
    } else if (type === 'bumper') {
      item = { id: uid(), type, x, y, r: 30 };
    } else {
      item = { id: uid(), type, x, y, angle: 0, length: 175, width: 88 };
    }
    state.pieces.push(item);
    state.selected = item;
  }

  function collideRamp(ball, ramp) {
    const halfX = Math.cos(ramp.angle) * ramp.length / 2;
    const halfY = Math.sin(ramp.angle) * ramp.length / 2;
    const hit = distanceToSegment(ball.x, ball.y, ramp.x - halfX, ramp.y - halfY, ramp.x + halfX, ramp.y + halfY);
    if (hit.distance >= ball.r + 4) return;

    let nx = ball.x - hit.cx;
    let ny = ball.y - hit.cy;
    let distance = Math.hypot(nx, ny);
    if (distance < 0.001) {
      nx = -Math.sin(ramp.angle);
      ny = Math.cos(ramp.angle);
      distance = 1;
    }
    nx /= distance;
    ny /= distance;

    const penetration = ball.r + 4 - hit.distance;
    ball.x += nx * penetration;
    ball.y += ny * penetration;
    const normalVelocity = ball.vx * nx + ball.vy * ny;
    if (normalVelocity < 0) {
      ball.vx -= 1.28 * normalVelocity * nx;
      ball.vy -= 1.28 * normalVelocity * ny;
    }
  }

  function collideBumper(ball, bumper) {
    const dx = ball.x - bumper.x;
    const dy = ball.y - bumper.y;
    const distance = Math.hypot(dx, dy);
    const minimum = ball.r + bumper.r;
    if (distance >= minimum || distance < 0.001) return;

    const nx = dx / distance;
    const ny = dy / distance;
    ball.x += nx * (minimum - distance);
    ball.y += ny * (minimum - distance);
    const normalVelocity = ball.vx * nx + ball.vy * ny;
    if (normalVelocity < 0) {
      ball.vx -= 1.75 * normalVelocity * nx;
      ball.vy -= 1.75 * normalVelocity * ny;
      ball.vx += nx * 75;
      ball.vy += ny * 75;
    }
  }

  function applyFan(ball, fan, delta) {
    const cosine = Math.cos(-fan.angle);
    const sine = Math.sin(-fan.angle);
    const dx = ball.x - fan.x;
    const dy = ball.y - fan.y;
    const localX = dx * cosine - dy * sine;
    const localY = dx * sine + dy * cosine;
    if (localX >= 0 && localX <= fan.length && Math.abs(localY) < fan.width / 2) {
      const force = 760 * (1 - localX / fan.length * 0.65);
      ball.vx += Math.cos(fan.angle) * force * delta;
      ball.vy += Math.sin(fan.angle) * force * delta;
    }
  }

  function step(delta) {
    const balls = state.pieces.filter(item => item.type === 'ball');
    const ramps = state.pieces.filter(item => item.type === 'ramp');
    const bumpers = state.pieces.filter(item => item.type === 'bumper');
    const fans = state.pieces.filter(item => item.type === 'fan');

    balls.forEach(ball => {
      ball.vy += 860 * delta;
      ball.vx *= Math.pow(0.997, delta * 60);
      fans.forEach(fan => applyFan(ball, fan, delta));
      ball.x += ball.vx * delta;
      ball.y += ball.vy * delta;
      ramps.forEach(ramp => collideRamp(ball, ramp));
      bumpers.forEach(bumper => collideBumper(ball, bumper));

      if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx) * 0.55; }
      if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx) * 0.55; }
      if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy) * 0.4; }
      if (ball.y > H - 28 - ball.r) {
        ball.y = H - 28 - ball.r;
        ball.vy = -Math.abs(ball.vy) * 0.2;
        ball.vx *= 0.988;
        if (Math.abs(ball.vy) < 8) ball.vy = 0;
      }

      const insideGoal = ball.x + ball.r > goal.x && ball.x - ball.r < goal.x + goal.w && ball.y + ball.r > goal.y && ball.y - ball.r < goal.y + goal.h;
      if (insideGoal) state.won = true;
    });
  }

  function resetLevel() {
    state.pieces = initialPieces();
    state.snapshot = clone(state.pieces);
    state.selected = null;
    state.won = false;
  }

  function clearBoard() {
    state.pieces = [{ id: uid(), type: 'ball', x: 105, y: 85, vx: 0, vy: 0, r: BALL_R }];
    state.snapshot = clone(state.pieces);
    state.selected = null;
    state.won = false;
  }

  window.CL = { W, H, BALL_R, goal, state, clone, hitTest, addPiece, step, resetLevel, clearBoard };
})();
