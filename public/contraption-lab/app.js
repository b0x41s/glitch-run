'use strict';
(function () {
  var game = window.CL;
  if (!game || !game.state || !game.canvas || !game.draw) return;

  var state = game.state;
  var status = document.querySelector('#status');
  var hint = document.querySelector('#hint');
  var run = document.querySelector('#run');
  var toolButtons = Array.prototype.slice.call(document.querySelectorAll('[data-tool]'));
  var lastTime = performance.now();

  function ensureBall() {
    var ball = null;
    for (var index = 0; index < state.pieces.length; index += 1) {
      if (state.pieces[index].type === 'ball') { ball = state.pieces[index]; break; }
    }
    if (!ball) {
      game.addPiece('ball', 125, 115);
      ball = state.pieces[state.pieces.length - 1];
      state.selected = null;
    }
    if (!isFinite(ball.x) || !isFinite(ball.y)) {
      ball.x = 125; ball.y = 115; ball.vx = 0; ball.vy = 0;
    }
    ball.r = 24;
    return ball;
  }

  function updateTools() {
    toolButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.tool === state.selectedTool));
    });
  }

  function setMode(mode) {
    state.mode = mode;
    state.selectedTool = null;
    updateTools();
    ensureBall();
    if (mode === 'run') {
      state.snapshot = game.clone(state.pieces);
      state.won = false;
      run.textContent = 'Stop';
      status.textContent = 'Simulatie actief';
      hint.textContent = 'De machine draait. Tik op Stop om terug te bouwen.';
    } else {
      run.textContent = 'Start';
      status.textContent = state.won ? 'Doel gehaald!' : 'Bouwmodus';
      hint.textContent = 'Kies een onderdeel, tik om het te plaatsen, sleep om het te verplaatsen.';
    }
  }

  function pointerPosition(event) {
    var rect = game.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * game.W / rect.width,
      y: (event.clientY - rect.top) * game.H / rect.height
    };
  }

  game.canvas.addEventListener('pointerdown', function (event) {
    if (state.mode !== 'build') return;
    event.preventDefault();
    var point = pointerPosition(event);
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
      if (game.canvas.setPointerCapture) game.canvas.setPointerCapture(event.pointerId);
    }
  });

  game.canvas.addEventListener('pointermove', function (event) {
    if (state.mode !== 'build' || !state.dragging) return;
    event.preventDefault();
    var point = pointerPosition(event);
    state.dragging.x = Math.max(30, Math.min(game.W - 30, point.x - state.dragOffset.x));
    state.dragging.y = Math.max(30, Math.min(game.H - 30, point.y - state.dragOffset.y));
    if (state.dragging.type === 'ball') { state.dragging.vx = 0; state.dragging.vy = 0; }
  });

  function stopDragging(event) {
    if (state.dragging && game.canvas.releasePointerCapture) {
      try { game.canvas.releasePointerCapture(event.pointerId); } catch (error) {}
    }
    state.dragging = null;
  }
  game.canvas.addEventListener('pointerup', stopDragging);
  game.canvas.addEventListener('pointercancel', stopDragging);
  game.canvas.addEventListener('contextmenu', function (event) { event.preventDefault(); });

  toolButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      if (state.mode !== 'build') return;
      state.selectedTool = state.selectedTool === button.dataset.tool ? null : button.dataset.tool;
      state.selected = null;
      updateTools();
      hint.textContent = state.selectedTool
        ? 'Tik op het speelveld om ' + button.textContent.toLowerCase() + ' te plaatsen.'
        : 'Kies een onderdeel, tik om het te plaatsen, sleep om het te verplaatsen.';
    });
  });

  document.querySelector('#rotate').addEventListener('click', function () {
    if (state.mode === 'build' && state.selected && 'angle' in state.selected) state.selected.angle += Math.PI / 12;
  });

  document.querySelector('#delete').addEventListener('click', function () {
    if (state.mode !== 'build' || !state.selected) return;
    var removedBall = state.selected.type === 'ball';
    state.pieces = state.pieces.filter(function (item) { return item !== state.selected; });
    state.selected = null;
    if (removedBall) {
      ensureBall();
      hint.textContent = 'Er moet altijd één bal aanwezig zijn, daarom is de bal teruggezet bij START.';
    }
  });

  document.querySelector('#reset').addEventListener('click', function () {
    game.resetLevel(); ensureBall(); setMode('build');
  });

  document.querySelector('#clear').addEventListener('click', function () {
    game.clearBoard(); ensureBall(); setMode('build');
  });

  run.addEventListener('click', function () {
    if (state.mode === 'build') {
      ensureBall(); state.selected = null; setMode('run');
    } else {
      state.pieces = game.clone(state.snapshot); state.selected = null; ensureBall(); setMode('build');
    }
  });

  function loop(time) {
    var delta = Math.min(.033, (time - lastTime) / 1000);
    lastTime = time;
    ensureBall();
    if (state.mode === 'run') {
      for (var substep = 0; substep < 3; substep += 1) game.step(delta / 3);
      if (state.won) {
        status.textContent = 'Doel gehaald!';
        hint.textContent = 'Mooi, de machine werkt. Tik op Stop om verder te bouwen.';
      }
    }
    try { game.draw(time); } catch (error) {
      status.textContent = 'Render hersteld';
      if (window.console && console.error) console.error(error);
    }
    requestAnimationFrame(loop);
  }

  ensureBall();
  game.draw(performance.now());
  requestAnimationFrame(loop);
})();