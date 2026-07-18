const arcadeMenu = document.querySelector('#arcade-menu');
const playGlitchRun = document.querySelector('[data-arcade-game="glitch-run"]');
const openArcadeMenu = document.querySelector('#open-arcade-menu');
const pauseButton = document.querySelector('#pause-button');

function showArcadeMenu() {
  if (!arcadeMenu) return;

  const gameIsRunning = document.querySelector('#selection-screen')?.classList.contains('closed');
  const pauseScreenIsOpen = !document.querySelector('#pause-screen')?.classList.contains('hidden');

  if (gameIsRunning && !pauseScreenIsOpen && pauseButton && !pauseButton.classList.contains('hidden')) {
    pauseButton.click();
  }

  arcadeMenu.classList.remove('closed');
  arcadeMenu.setAttribute('aria-hidden', 'false');
  document.title = 'Tex Arcade';
  history.replaceState(null, '', `${location.pathname}${location.search}`);
}

function showGlitchRun() {
  if (!arcadeMenu) return;
  arcadeMenu.classList.add('closed');
  arcadeMenu.setAttribute('aria-hidden', 'true');
  document.title = 'Glitch Run, Tex Arcade';
  history.replaceState(null, '', `${location.pathname}${location.search}#glitch-run`);
}

playGlitchRun?.addEventListener('click', showGlitchRun);
openArcadeMenu?.addEventListener('click', showArcadeMenu);

if (location.hash === '#glitch-run') {
  showGlitchRun();
} else {
  showArcadeMenu();
}
