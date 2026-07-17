const nativeFetch = window.fetch.bind(window);
let mainSourcePatched = false;

window.fetch = async (...args) => {
  const response = await nativeFetch(...args);
  const requestedUrl = String(args[0] instanceof Request ? args[0].url : args[0]);

  if (!mainSourcePatched && requestedUrl.includes('/src/main.js')) {
    mainSourcePatched = true;
    window.fetch = nativeFetch;

    const source = await response.text();
    const patchedSource = source.replace(
      'this.musicGain.gain.value = 0.22;',
      'this.musicGain.gain.value = 0;'
    );

    return new Response(patchedSource, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }

  return response;
};

const themeData = 'data:audio/mpeg;base64,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';

const themeMusic = new Audio(themeData);
themeMusic.loop = true;
themeMusic.preload = 'auto';
themeMusic.playsInline = true;
themeMusic.volume = 0;
window.glitchThemeMusic = themeMusic;

const soundButton = document.querySelector('#sound-toggle');
const hud = document.querySelector('#hud');
const pauseScreen = document.querySelector('#pause-screen');
const gameOverScreen = document.querySelector('#game-over-screen');

let activated = false;
let fadeFrame = 0;

function soundEnabled() {
  if (!soundButton) return true;
  return soundButton.getAttribute('aria-pressed') !== 'false'
    && !soundButton.textContent.toLowerCase().includes('uit');
}

function desiredVolume() {
  if (!soundEnabled() || document.hidden) return 0;
  if (!pauseScreen?.classList.contains('hidden')) return 0.045;
  if (!gameOverScreen?.classList.contains('hidden')) return 0.06;
  if (!hud?.classList.contains('hidden')) return 0.13;
  return 0.08;
}

function fadeTo(target, duration = 500) {
  cancelAnimationFrame(fadeFrame);
  const startVolume = themeMusic.volume;
  const startedAt = performance.now();

  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    themeMusic.volume = startVolume + (target - startVolume) * eased;
    if (progress < 1) fadeFrame = requestAnimationFrame(step);
  };

  fadeFrame = requestAnimationFrame(step);
}

async function startTheme() {
  activated = true;
  if (!soundEnabled()) return;

  try {
    await themeMusic.play();
    fadeTo(desiredVolume(), 700);
  } catch (error) {
    console.warn('Glitch Run soundtrack kon nog niet starten.', error);
  }
}

function syncTheme() {
  if (!activated) return;
  const target = desiredVolume();

  if (target > 0) {
    if (themeMusic.paused) themeMusic.play().catch(() => {});
    fadeTo(target);
    return;
  }

  fadeTo(0, 220);
}

window.addEventListener('pointerdown', startTheme, { passive: true });
window.addEventListener('keydown', startTheme);
document.addEventListener('visibilitychange', syncTheme);
soundButton?.addEventListener('click', () => window.setTimeout(syncTheme, 0));

const stateObserver = new MutationObserver(syncTheme);
for (const element of [soundButton, hud, pauseScreen, gameOverScreen]) {
  if (!element) continue;
  stateObserver.observe(element, {
    attributes: true,
    attributeFilter: ['class', 'aria-pressed'],
    childList: true,
    subtree: true
  });
}
