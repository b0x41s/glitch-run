'use strict';
(() => {
  const game = window.CL;
  const state = game.state;
  const status = document.querySelector('#status');
  const hint = document.querySelector('#hint');
  const run = document.querySelector('#run');
  const toolButtons = [...document.querySelectorAll('[data-tool]')];
  let lastTime = performance.now();

  function ensureBall() {
    let ball = state.pieces.find(item => item.type === 'ball');
    if (!ball) {
      game.addPiece('ball', 115, 105);
      ball = state.pieces.find(item => item.type === 'ball');
      state.selected = null;
    }
    if (!Number.isFinite(ball.x) || !Number.isFinite(ball.y)) {
      Object.assign(ball, { x: 115, y: 105, vx: 0, vy: 0, r: game.BALL_R });
    }
    ball.r = game.BALL_R;
    return ball;
  }

  function updateTools() {
    toolButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tool === state.selectedTool)));
  }

  function setMode(mode) {
    state.mode = mode;
    state.selectedTool = null;
    updateTools();
    if (mode === 'run') {
      ensureBall();
      state.snapshot = game.clone(state.pieces);
      state.won = false;
      run.textContent = 'Stop';
      status.textContent = 'Simulatie actief';
      hint.textContent = 'De machine draait. Tik op Stop om terug te bouwen.';
    } else {
      ensureBall();
      run.textContent = 'Start';
      status.textContent = state.won ? 'Doel gehaald!' : 'Bouwmodus';
      hint.textContent = 'Kies een onderdeel, tik om het te plaatsen, sleep om het te verplaatsen.';
    }
  }

  function pointerPosition(event) {
    const rect = game.canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * game.W / rect.width, y: (event.clientY - rect.top) * game.H / rect.height };
  }

  game.canvas.addEventListener('pointerdown', event => {
    if (state.mode !== 'build') return;
    event.preventDefault();
    const point = pointerPosition(event);
    if (state.selectedTool) {
      game.addPiece(state.selectedTool, point.x, point.y);
      state.selectedTool = null;
      updateTools();
      return;
    }
    state.selected = game.hitTest(point.x, point.y);
    if (state.selected) {
      state.dragging = state.selected;
      state.dragOffset = { x: point.x - state.selected.x, y: point.y - state.selected.y };
      game.canvas.setPointerCapture?.(event.pointerId);
    }
  });

  game.canvas.addEventListener('pointermove', event => {
    if (state.mode !== 'build' || !state.dragging) return;
    event.preventDefault();
    const point = pointerPosition(event);
    state.dragging.x = Math.max(30, Math.min(game.W - 30, point.x - state.dragOffset.x));
    state.dragging.y = Math.max(30, Math.min(game.H - 30, point.y - state.dragOffset.y));
    if (state.dragging.type === 'ball') {
      state.dragging.vx = 0;
      state.dragging.vy = 0;
    }
  });

  function stopDragging(event) {
    if (state.dragging) game.canvas.releasePointerCapture?.(event.pointerId);
    state.dragging = null;
  }
  game.canvas.addEventListener('pointerup', stopDragging);
  game.canvas.addEventListener('pointercancel', stopDragging);
  game.canvas.addEventListener('contextmenu', event => event.preventDefault());

  toolButtons.forEach(button => button.addEventListener('click', () => {
    if (state.mode !== 'build') return;
    state.selectedTool = state.selectedTool === button.dataset.tool ? null : button.dataset.tool;
    state.selected = null;
    updateTools();
    hint.textContent = state.selectedTool ? `Tik op het speelveld om ${button.textContent.toLowerCase()} te plaatsen.` : 'Kies een onderdeel, tik om het te plaatsen, sleep om het te verplaatsen.';
  }));

  document.querySelector('#rotate').addEventListener('click', () => {
    if (state.mode === 'build' && state.selected && 'angle' in state.selected) state.selected.angle += Math.PI / 12;
  });

  document.querySelector('#delete').addEventListener('click', () => {
    if (state.mode !== 'build' || !state.selected) return;
    const removedBall = state.selected.type === 'ball';
    state.pieces = state.pieces.filter(item => item !== state.selected);
    state.selected = null;
    if (removedBall) {
      ensureBall();
      hint.textContent = 'Er moet altijd één bal aanwezig zijn, daarom is de bal teruggezet bij START.';
    }
  });

  document.querySelector('#reset').addEventListener('click', () => {
    game.resetLevel();
    ensureBall();
    setMode('build');
  });

  document.querySelector('#clear').addEventListener('click', () => {
    game.clearBoard();
    ensureBall();
    setMode('build');
  });

  run.addEventListener('click', () => {
    if (state.mode === 'build') {
      ensureBall();
      state.selected = null;
      setMode('run');
    } else {
      state.pieces = game.clone(state.snapshot);
      state.selected = null;
      ensureBall();
      setMode('build');
    }
  });

  function loop(time) {
    const delta = Math.min(0.033, (time - lastTime) / 1000);
    lastTime = time;
    ensureBall();
    if (state.mode === 'run') {
      for (let substep = 0; substep < 3; substep += 1) game.step(delta / 3);
      if (state.won) {
        status.textContent = 'Doel gehaald!';
        hint.textContent = 'Mooi, de machine werkt. Tik op Stop om verder te bouwen.';
      }
    }
    game.draw(time);
    requestAnimationFrame(loop);
  }

  ensureBall();
  requestAnimationFrame(loop);
})();