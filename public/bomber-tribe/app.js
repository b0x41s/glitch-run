'use strict';

function updateUI() {
  const player = entities[0];
  const highscore = persisted.highscores[selectedCharacter] || 0;
  ui.score.textContent = score.toLocaleString('nl-NL');
  ui.coins.textContent = persisted.coins.toLocaleString('nl-NL');
  ui.highscore.textContent = highscore.toLocaleString('nl-NL');
  ui.time.textContent = formatTime(timeLeft);
  if (player) {
    ui.bombs.textContent = player.maxBombs;
    ui.flame.textContent = player.flame;
    ui.speed.textContent = player.speedLevel;
  }
}

function updateSelectedCharacterUI() {
  const character = characters[selectedCharacter];
  ui.portrait.src = character.image;
  ui.name.textContent = character.name;
  selectedHighscore.textContent = (persisted.highscores[selectedCharacter] || 0).toLocaleString('nl-NL');
  updateUI();
}

function showBanner(text, duration = 1) {
  statusBanner.textContent = text;
  statusBanner.classList.remove('hidden');
  bannerTimer = duration;
}

function togglePause() {
  if (state !== 'playing') return;
  paused = !paused;
  pauseButton.textContent = paused ? '▶' : 'Ⅱ';
  showBanner(paused ? 'Gepauzeerd' : 'Verder', 0.8);
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function randomRange(min, max) { return min + Math.random() * (max - min); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function loop(now) {
  const dt = Math.min(0.035, (now - lastTime) / 1000 || 0);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

characterGrid.addEventListener('click', event => {
  const card = event.target.closest('.character-card');
  if (!card) return;
  selectedCharacter = Number(card.dataset.character);
  document.querySelectorAll('.character-card').forEach((item, index) => {
    const selected = index === selectedCharacter;
    item.classList.toggle('selected', selected);
    item.setAttribute('aria-checked', String(selected));
  });
  updateSelectedCharacterUI();
  tone(520 + selectedCharacter * 45, 0.07, 'square', 0.018);
});

startButton.addEventListener('click', startGame);
retryButton.addEventListener('click', restartGame);
selectButton.addEventListener('click', () => {
  endOverlay.classList.remove('open');
  startOverlay.classList.add('open');
  state = 'menu';
  updateSelectedCharacterUI();
});
pauseButton.addEventListener('click', togglePause);
soundButton.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? '🔊' : '🔇';
  if (soundEnabled) tone(620, 0.08, 'square', 0.02);
});
mobileBombButton.addEventListener('pointerdown', event => {
  event.preventDefault();
  if (entities[0]) placeBomb(entities[0]);
});

window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd', 'p'].includes(key)) event.preventDefault();
  keys.add(key);
  if ((event.code === 'Space' || key === ' ') && !event.repeat && entities[0]) placeBomb(entities[0]);
  if (key === 'p' && !event.repeat) togglePause();
}, { passive: false });

window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));

const touchFirstDevice = window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

function clearActiveControls() {
  keys.clear();
  touchDirections.clear();
}

window.addEventListener('blur', () => {
  clearActiveControls();

  // iOS Safari geeft tijdens normale aanrakingen soms een blur-event.
  // Op touch-apparaten pauzeren we daarom alleen als de pagina echt verborgen is.
  if (!touchFirstDevice && state === 'playing' && !paused) togglePause();
});

document.addEventListener('visibilitychange', () => {
  clearActiveControls();
  if (document.hidden && state === 'playing' && !paused) togglePause();
});

document.querySelectorAll('.dpad button').forEach(button => {
  const direction = button.dataset.direction;
  const start = event => {
    event.preventDefault();
    touchDirections.add(direction);
    button.setPointerCapture?.(event.pointerId);
  };
  const stop = event => {
    event.preventDefault();
    touchDirections.delete(direction);
  };
  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('pointerleave', stop);
});

updateSelectedCharacterUI();
updateUI();
requestAnimationFrame(loop);