const pagePath = window.location.pathname.endsWith('/')
  ? window.location.pathname
  : window.location.pathname.replace(/\/[^/]*$/, '/');

const themeMusic = new Audio(
  `${window.location.origin}${pagePath}public/audio/glitch-run-theme.mp3?v=1`
);

themeMusic.loop = true;
themeMusic.preload = 'auto';
themeMusic.playsInline = true;
themeMusic.volume = 0;

const soundButton = document.querySelector('#sound-toggle');
const selectionScreen = document.querySelector('#selection-screen');
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
  if (!selectionScreen?.classList.contains('closed')) return 0.065;
  if (!pauseScreen?.classList.contains('hidden')) return 0.045;
  if (!gameOverScreen?.classList.contains('hidden')) return 0.055;
  return 0.105;
}

function fadeTo(target, duration = 650) {
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
  if (!activated) activated = true;
  if (!soundEnabled()) return;

  try {
    await themeMusic.play();
    fadeTo(desiredVolume(), 950);
  } catch {
    // Een volgende klik of toetsdruk probeert het opnieuw.
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

  fadeTo(0, 260);
}

window.addEventListener('pointerdown', startTheme, { passive: true });
window.addEventListener('keydown', startTheme);
document.addEventListener('visibilitychange', syncTheme);

soundButton?.addEventListener('click', () => window.setTimeout(syncTheme, 0));

const stateObserver = new MutationObserver(syncTheme);
for (const element of [soundButton, selectionScreen, pauseScreen, gameOverScreen]) {
  if (!element) continue;
  stateObserver.observe(element, {
    attributes: true,
    attributeFilter: ['class', 'aria-pressed'],
    childList: true,
    subtree: true
  });
}
