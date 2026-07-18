'use strict';


const COLS = 13;
const ROWS = 11;
const TILE = 48;
const ROUND_TIME = 150;

const TILE_FLOOR = 0;
const TILE_WALL = 1;
const TILE_CRATE = 2;

const characters = [
  { name: 'Casper', image: '', source: 'assets/characters/casper.b64' },
  { name: 'Milo', image: '', source: 'assets/characters/finn.b64' },
  { name: 'Lina', image: '', source: 'assets/characters/mila.b64' },
  { name: 'Nova', image: '', source: 'assets/characters/zoe.b64' },
  { name: 'Bas', image: '', source: 'assets/characters/bas.b64' }
];

const difficulties = {
  easy: { botSpeed: 2.25, thinkMin: 0.26, thinkMax: 0.48, aggression: 0.12, crateDensity: 0.58 },
  normal: { botSpeed: 2.75, thinkMin: 0.18, thinkMax: 0.34, aggression: 0.22, crateDensity: 0.66 },
  hard: { botSpeed: 3.2, thinkMin: 0.11, thinkMax: 0.24, aggression: 0.36, crateDensity: 0.72 }
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');
const statusBanner = document.getElementById('statusBanner');
const characterGrid = document.getElementById('characterGrid');
const difficultySelect = document.getElementById('difficultySelect');
const selectedHighscore = document.getElementById('selectedHighscore');
const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const selectButton = document.getElementById('selectButton');
const pauseButton = document.getElementById('pauseButton');
const soundButton = document.getElementById('soundButton');
const mobileBombButton = document.getElementById('mobileBombButton');

const ui = {
  portrait: document.getElementById('hudPortrait'),
  name: document.getElementById('hudName'),
  score: document.getElementById('scoreValue'),
  coins: document.getElementById('coinsValue'),
  time: document.getElementById('timeValue'),
  highscore: document.getElementById('highscoreValue'),
  bombs: document.getElementById('bombValue'),
  flame: document.getElementById('flameValue'),
  speed: document.getElementById('speedValue'),
  resultIcon: document.getElementById('resultIcon'),
  resultTitle: document.getElementById('resultTitle'),
  resultText: document.getElementById('resultText'),
  resultScore: document.getElementById('resultScore')
};

const imageCache = characters.map(() => new Image());

async function loadCharacterImages() {
  startButton.disabled = true;
  try {
    await Promise.all(characters.map(async (character, index) => {
      const response = await fetch(character.source, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Character ${index + 1} kon niet worden geladen`);
      const encoded = (await response.text()).trim();
      character.image = `data:image/jpeg;base64,${encoded}`;
      imageCache[index].src = character.image;
      document.querySelectorAll(`[data-character-image="${index}"]`).forEach(image => {
        image.src = character.image;
      });
    }));
    startButton.textContent = 'Start het spel';
    startButton.disabled = false;
    updateSelectedCharacterUI();
  } catch (error) {
    console.error(error);
    startButton.textContent = 'Laden mislukt, vernieuw de pagina';
  }
}

loadCharacterImages();

let selectedCharacter = 0;
let board = [];
let entities = [];
let bombs = [];
let explosions = [];
let powerups = new Map();
let particles = [];
let state = 'menu';
let paused = false;
let soundEnabled = true;
let score = 0;
let timeLeft = ROUND_TIME;
let lastTime = performance.now();
let bannerTimer = 0;
let roundDifficulty = difficulties.normal;
let audioContext = null;
let persisted = loadPersisted();
let keys = new Set();
const touchDirections = new Set();

function loadPersisted() {
  try {
    const parsed = JSON.parse(localStorage.getItem('bomberTribeState') || '{}');
    return {
      coins: Number(parsed.coins) || 0,
      highscores: Array.isArray(parsed.highscores) ? parsed.highscores.slice(0, 5) : [0, 0, 0, 0, 0],
      wins: Number(parsed.wins) || 0
    };
  } catch {
    return { coins: 0, highscores: [0, 0, 0, 0, 0], wins: 0 };
  }
}

function savePersisted() {
  localStorage.setItem('bomberTribeState', JSON.stringify(persisted));
}

function ensureAudio() {
  if (!soundEnabled) return null;
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioContext = new AudioCtx();
  }
  if (audioContext?.state === 'suspended') audioContext.resume();
  return audioContext;
}

function tone(frequency, duration = 0.08, type = 'sine', volume = 0.035, slideTo = null) {
  const audio = ensureAudio();
  if (!audio) return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function explosionSound() {
  const audio = ensureAudio();
  if (!audio) return;
  tone(130, 0.16, 'sawtooth', 0.04, 45);
  tone(80, 0.22, 'square', 0.025, 35);
}

function createBoard() {
  board = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => {
      if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) return TILE_WALL;
      if (x % 2 === 0 && y % 2 === 0) return TILE_WALL;
      return TILE_FLOOR;
    })
  );

  const safeCells = new Set();
  const spawnTiles = [
    [1, 1], [COLS - 2, ROWS - 2], [COLS - 2, 1], [1, ROWS - 2]
  ];
  for (const [sx, sy] of spawnTiles) {
    [[sx, sy], [sx + 1, sy], [sx - 1, sy], [sx, sy + 1], [sx, sy - 1]].forEach(([x, y]) => safeCells.add(`${x},${y}`));
  }

  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      if (board[y][x] !== TILE_FLOOR || safeCells.has(`${x},${y}`)) continue;
      if (Math.random() < roundDifficulty.crateDensity) board[y][x] = TILE_CRATE;
    }
  }
}

function makeEntity(id, characterIndex, tx, ty, human = false) {
  return {
    id,
    characterIndex,
    name: characters[characterIndex].name,
    x: tx + 0.5,
    y: ty + 0.5,
    alive: true,
    human,
    radius: 0.3,
    speed: human ? 3.25 : roundDifficulty.botSpeed,
    speedLevel: 1,
    maxBombs: 1,
    activeBombs: 0,
    flame: 2,
    target: null,
    thinkTimer: Math.random() * 0.2,
    bombCooldown: 0,
    facing: 1,
    bob: Math.random() * Math.PI * 2,
    invulnerable: 0.8,
    kills: 0
  };
}

function startGame() {
  ensureAudio();
  roundDifficulty = difficulties[difficultySelect.value] || difficulties.normal;
  createBoard();
  bombs = [];
  explosions = [];
  powerups = new Map();
  particles = [];
  score = 0;
  timeLeft = ROUND_TIME;
  paused = false;
  pauseButton.textContent = 'Ⅱ';

  const availableBots = characters.map((_, i) => i).filter(i => i !== selectedCharacter);
  shuffle(availableBots);
  const spawns = [[1, 1], [COLS - 2, ROWS - 2], [COLS - 2, 1], [1, ROWS - 2]];
  entities = [makeEntity(0, selectedCharacter, spawns[0][0], spawns[0][1], true)];
  for (let i = 1; i < 4; i++) {
    entities.push(makeEntity(i, availableBots[i - 1], spawns[i][0], spawns[i][1], false));
  }

  state = 'playing';
  startOverlay.classList.remove('open');
  endOverlay.classList.remove('open');
  showBanner('3 · 2 · 1 · GO!', 1.7);
  updateUI();
  tone(540, 0.09, 'square', 0.03);
  lastTime = performance.now();
}

function restartGame() {
  startGame();
}

function endGame(won, reason = '') {
  if (state !== 'playing') return;
  state = 'ended';
  paused = false;
  const player = entities[0];
  const timeBonus = won ? Math.max(0, Math.floor(timeLeft) * 10) : 0;
  if (won) score += 1000 + timeBonus;
  const earnedCoins = Math.max(1, Math.floor(score / 250));
  persisted.coins += earnedCoins;
  persisted.highscores[selectedCharacter] = Math.max(persisted.highscores[selectedCharacter] || 0, score);
  if (won) persisted.wins += 1;
  savePersisted();

  ui.resultIcon.textContent = won ? '🏆' : '💥';
  ui.resultTitle.textContent = won ? 'Arena veroverd' : 'Uitgeschakeld';
  ui.resultText.textContent = won
    ? `Je hebt alle tegenstanders verslagen en ${earnedCoins} munten verdiend.`
    : `${reason || 'De explosie was net iets sneller.'} Je verdient ${earnedCoins} munten.`;
  ui.resultScore.textContent = score.toLocaleString('nl-NL');
  updateUI();
  setTimeout(() => endOverlay.classList.add('open'), 450);
  if (won) {
    tone(660, 0.12, 'square', 0.035);
    setTimeout(() => tone(880, 0.18, 'square', 0.035), 120);
  } else {
    tone(180, 0.3, 'sawtooth', 0.04, 60);
  }
  player.alive = false;
}

function update(dt) {
  if (state !== 'playing' || paused) return;

  timeLeft = Math.max(0, timeLeft - dt);
  if (timeLeft <= 0) {
    const aliveBots = entities.filter(entity => entity.alive && !entity.human).length;
    endGame(aliveBots === 0, aliveBots ? 'De tijd is verstreken.' : '');
    return;
  }

  if (bannerTimer > 0) {
    bannerTimer -= dt;
    if (bannerTimer <= 0) statusBanner.classList.add('hidden');
  }

  const player = entities[0];
  if (player.alive) updatePlayer(player, dt);

  for (const bot of entities.slice(1)) {
    if (bot.alive) updateBot(bot, dt);
  }

  updateBombs(dt);
  updateExplosions(dt);
  updateParticles(dt);

  for (const entity of entities) {
    if (!entity.alive) continue;
    entity.invulnerable = Math.max(0, entity.invulnerable - dt);
    entity.bombCooldown = Math.max(0, entity.bombCooldown - dt);
    entity.bob += dt * 6;
    collectPowerup(entity);
  }

  const aliveBots = entities.filter(entity => entity.alive && !entity.human);
  if (player.alive && aliveBots.length === 0) endGame(true);
  updateUI();
}
