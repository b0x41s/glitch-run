const arcadeMenu = document.querySelector('#arcade-menu');
const playGlitchRun = document.querySelector('[data-arcade-game="glitch-run"]');
const openArcadeMenu = document.querySelector('#open-arcade-menu');
const pauseButton = document.querySelector('#pause-button');
const arcadeGrid = document.querySelector('.arcade-game-grid');

function addMetroViceCard() {
  if (!arcadeGrid || arcadeGrid.querySelector('[data-arcade-game="metro-vice"]')) return;

  arcadeGrid.insertAdjacentHTML('beforeend', `
    <a class="arcade-game-card glitch-run metro-vice" data-arcade-game="metro-vice" href="./metro-vice-96/">
      <span class="arcade-card-visual" aria-hidden="true"></span>
      <span class="arcade-card-content">
        <span class="arcade-card-meta">
          <span>Top-down racer</span>
          <span>Singleplayer</span>
          <span>Mobiel</span>
        </span>
        <h2>Metro Vice 96</h2>
        <p>Haal pakketten op, lever ze af, ontwijk verkeer en schud de politie van je af.</p>
        <span class="arcade-card-action">Start Metro Vice 96 <b aria-hidden="true">→</b></span>
      </span>
    </a>
  `);
}

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

addMetroViceCard();
playGlitchRun?.addEventListener('click', showGlitchRun);
openArcadeMenu?.addEventListener('click', showArcadeMenu);

if (location.hash === '#glitch-run') {
  showGlitchRun();
} else {
  showArcadeMenu();
}
