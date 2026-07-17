import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CHARACTERS = [
  { id: 'casper', name: 'Casper', description: 'Blauwe hoodie', initial: 'C', accent: '#39e072', model: 'models/casper.glb' },
  { id: 'adult-man', name: 'Bas', description: 'Casual outfit', initial: 'B', accent: '#9e42e7', model: 'models/adult-man.glb' },
  { id: 'woman-black-dress', name: 'Tamara', description: 'Zwarte jurk', initial: 'T', accent: '#d8dbe2', model: 'models/woman-black-dress.glb' },
  { id: 'young-girl', name: 'Lisette', description: 'Jonge avonturier', initial: 'L', accent: '#67d7ff', model: 'models/young-girl.glb' },
  { id: 'laurens', name: 'Laurens', description: 'Jonge held', initial: 'L', accent: '#f0b84b', model: 'models/laurens.glb' }
];

const EXPECTED_CLIPS = [
  { name: 'run', duration: 1.2916666 },
  { name: 'jump', duration: 2.25 },
  { name: 'walk', duration: 2.375 },
  { name: 'bow', duration: 6.0 },
  { name: 'foldArms', duration: 13.791667 },
  { name: 'idle', duration: 15.375 }
];

const TRACK_WIDTH = 10;
const SEGMENT_LENGTH = 12;
const LANES = [-2.65, 0, 2.65];
const SPAWN_AHEAD = 250;
const CLEANUP_BEHIND = 38;
const GRAVITY = 19;
const JUMP_SPEED = 7.45;
const MAX_INTEGRITY = 3;
const MODEL_FORWARD_OFFSET = 0;

const canvas = document.querySelector('#game');
const loadingScreen = document.querySelector('#loading-screen');
const loadingDetail = document.querySelector('#loading-detail');
const loadStatus = document.querySelector('#load-status');
const selectionScreen = document.querySelector('#selection-screen');
const characterGrid = document.querySelector('#character-grid');
const selectedCharacterName = document.querySelector('#selected-character-name');
const selectedCharacterMeta = document.querySelector('#selected-character-meta');
const startGameButton = document.querySelector('#start-game');
const changeCharacterButton = document.querySelector('#change-character');
const cameraModeButton = document.querySelector('#camera-mode');
const soundToggleButton = document.querySelector('#sound-toggle');
const pauseButton = document.querySelector('#pause-button');
const hud = document.querySelector('#hud');
const missionCard = document.querySelector('#mission-card');
const controlsHint = document.querySelector('#controls-hint');
const mobileControls = document.querySelector('#mobile-controls');
const mobileCameraModeButton = document.querySelector('#mobile-camera-mode');
const countdownEl = document.querySelector('#countdown');
const toastEl = document.querySelector('#toast');
const damageFlash = document.querySelector('#damage-flash');
const pauseScreen = document.querySelector('#pause-screen');
const gameOverScreen = document.querySelector('#game-over-screen');
const resumeGameButton = document.querySelector('#resume-game');
const pauseSelectButton = document.querySelector('#pause-select-character');
const restartGameButton = document.querySelector('#restart-game');
const gameOverSelectButton = document.querySelector('#game-over-select-character');

const scoreValueEl = document.querySelector('#score-value');
const distanceValueEl = document.querySelector('#distance-value');
const shardsValueEl = document.querySelector('#shards-value');
const comboValueEl = document.querySelector('#combo-value');
const integrityValueEl = document.querySelector('#integrity-value');
const energyValueEl = document.querySelector('#energy-value');
const energyBarEl = document.querySelector('#energy-bar');
const pressureValueEl = document.querySelector('#pressure-value');
const pressureBarEl = document.querySelector('#pressure-bar');
const zoneValueEl = document.querySelector('#zone-value');
const missionTitleEl = document.querySelector('#mission-title');
const missionDetailEl = document.querySelector('#mission-detail');
const resultScoreEl = document.querySelector('#result-score');
const resultDistanceEl = document.querySelector('#result-distance');
const resultShardsEl = document.querySelector('#result-shards');
const resultBestEl = document.querySelector('#result-best');
const resultMessageEl = document.querySelector('#result-message');

class GameAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noiseBuffer = null;
    this.enabled = this.readEnabled();
    this.musicTimer = 0;
    this.musicStep = 0;
    this.footstepTimer = 0;
    this.lastBoosting = false;
    this.boostOscillator = null;
    this.boostGain = null;
    this.lastState = '';
  }

  readEnabled() {
    try {
      return localStorage.getItem('tex-glitch-run-sound') !== 'off';
    } catch {
      return true;
    }
  }

  writeEnabled() {
    try {
      localStorage.setItem('tex-glitch-run-sound', this.enabled ? 'on' : 'off');
    } catch {
      // Audio blijft werken wanneer opslag is geblokkeerd.
    }
  }

  async unlock() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.master.gain.value = this.enabled ? 0.78 : 0;
      this.musicGain.gain.value = 0.22;
      this.sfxGain.gain.value = 0.72;
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.context.destination);
      this.noiseBuffer = this.createNoiseBuffer();
    }
    if (this.context.state === 'suspended') await this.context.resume();
    return true;
  }

  createNoiseBuffer() {
    const length = Math.floor(this.context.sampleRate * 0.8);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
    return buffer;
  }

  toggle() {
    this.enabled = !this.enabled;
    this.writeEnabled();
    this.unlock().then(() => {
      if (!this.master) return;
      const now = this.context.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value, now);
      this.master.gain.linearRampToValueAtTime(this.enabled ? 0.78 : 0, now + 0.12);
      if (this.enabled) {
        this.lastBoosting = false;
        this.ui(660);
      } else {
        this.stopBoostHum();
        this.lastBoosting = false;
      }
    });
    updateSoundButton();
  }

  tone(frequency, duration = 0.12, options = {}) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const {
      type = 'sine', volume = 0.12, start = 0, endFrequency = frequency,
      attack = 0.008, destination = this.sfxGain, detune = 0
    } = options;
    const now = this.context.currentTime + start;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), now);
    oscillator.detune.setValueAtTime(detune, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  noise(duration = 0.15, options = {}) {
    if (!this.enabled || !this.context || this.context.state !== 'running' || !this.noiseBuffer) return;
    const { volume = 0.1, frequency = 1200, start = 0 } = options;
    const now = this.context.currentTime + start;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency, now);
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(Math.max(0.0002, volume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start(now);
    source.stop(now + duration);
  }

  ui(frequency = 520) {
    this.tone(frequency, 0.08, { type: 'square', volume: 0.045, endFrequency: frequency * 1.18 });
  }

  select() {
    this.tone(420, 0.16, { type: 'triangle', volume: 0.075, endFrequency: 620 });
    this.tone(630, 0.18, { type: 'sine', volume: 0.05, start: 0.07, endFrequency: 760 });
  }

  bow() {
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      this.tone(frequency, 0.28, { type: 'sine', volume: 0.045, start: index * 0.08, endFrequency: frequency * 0.98 });
    });
  }

  countdown(label) {
    if (label === 'RUN') {
      this.tone(523.25, 0.22, { type: 'square', volume: 0.08, endFrequency: 1046.5 });
      this.noise(0.15, { volume: 0.045, frequency: 1800 });
      return;
    }
    const number = Number(label);
    const frequency = Number.isFinite(number) ? 330 + (3 - number) * 55 : 330;
    this.tone(frequency, 0.11, { type: 'square', volume: 0.055, endFrequency: frequency * 0.96 });
  }

  jump() {
    this.tone(260, 0.24, { type: 'triangle', volume: 0.09, endFrequency: 720 });
    this.noise(0.11, { volume: 0.035, frequency: 2100 });
  }

  land() {
    this.tone(105, 0.12, { type: 'sine', volume: 0.075, endFrequency: 62 });
    this.noise(0.08, { volume: 0.045, frequency: 420 });
  }

  footstep(speedValue = 7) {
    const intensity = Math.min(0.055, 0.025 + speedValue * 0.0022);
    this.tone(92, 0.07, { type: 'sine', volume: intensity, endFrequency: 58 });
    this.noise(0.045, { volume: intensity * 0.55, frequency: 620 });
  }

  shard(comboValue = 1) {
    const base = 720 + Math.min(4, comboValue - 1) * 85;
    this.tone(base, 0.12, { type: 'sine', volume: 0.07, endFrequency: base * 1.45 });
    this.tone(base * 1.5, 0.16, { type: 'triangle', volume: 0.038, start: 0.045, endFrequency: base * 1.8 });
  }

  combo(comboValue) {
    const root = 330 * Math.pow(2, Math.min(4, comboValue - 1) / 12);
    [1, 1.25, 1.5].forEach((ratio, index) => {
      this.tone(root * ratio, 0.32, { type: 'triangle', volume: 0.055, start: index * 0.045, endFrequency: root * ratio * 1.08 });
    });
  }

  heal() {
    [440, 554.37, 659.25, 880].forEach((frequency, index) => {
      this.tone(frequency, 0.38, { type: 'sine', volume: 0.055, start: index * 0.08, endFrequency: frequency * 1.04 });
    });
  }

  boostPad() {
    this.tone(110, 0.55, { type: 'sawtooth', volume: 0.075, endFrequency: 620 });
    this.tone(440, 0.4, { type: 'triangle', volume: 0.055, start: 0.12, endFrequency: 880 });
    this.noise(0.3, { volume: 0.04, frequency: 950 });
  }

  hit() {
    this.noise(0.34, { volume: 0.16, frequency: 260 });
    this.tone(170, 0.42, { type: 'sawtooth', volume: 0.1, endFrequency: 48 });
    this.tone(88, 0.28, { type: 'square', volume: 0.055, start: 0.03, endFrequency: 44 });
  }

  zone(zoneValue) {
    const root = 392 * Math.pow(2, (zoneValue - 1) / 24);
    [1, 1.25, 1.5, 2].forEach((ratio, index) => {
      this.tone(root * ratio, 0.34, { type: 'triangle', volume: 0.052, start: index * 0.075, endFrequency: root * ratio * 1.05 });
    });
  }

  pause(paused) {
    this.tone(paused ? 330 : 440, 0.13, { type: 'square', volume: 0.045, endFrequency: paused ? 220 : 660 });
  }

  gameOver() {
    [392, 329.63, 261.63, 130.81].forEach((frequency, index) => {
      this.tone(frequency, 0.52, { type: 'sawtooth', volume: 0.055, start: index * 0.18, endFrequency: frequency * 0.82 });
    });
    this.noise(0.55, { volume: 0.055, frequency: 180, start: 0.45 });
  }

  update(delta, gameState, options = {}) {
    if (!this.context || this.context.state !== 'running') return;
    const active = gameState === 'playing' || gameState === 'countdown';
    if (!active || !this.enabled) {
      this.musicTimer = 0;
      this.footstepTimer = 0;
      if (this.lastBoosting) this.stopBoostHum();
      this.lastBoosting = false;
      return;
    }

    const boosting = Boolean(options.boosting);
    if (boosting !== this.lastBoosting) {
      if (boosting) this.startBoostHum();
      else this.stopBoostHum();
      this.lastBoosting = boosting;
    }

    if (gameState === 'playing' && options.grounded) {
      this.footstepTimer -= delta;
      if (this.footstepTimer <= 0) {
        this.footstep(options.speed || 7);
        this.footstepTimer = Math.max(0.18, 0.42 - (options.speed || 7) * 0.017);
      }
    } else {
      this.footstepTimer = 0;
    }

    this.musicTimer -= delta;
    if (this.musicTimer <= 0) {
      const speedFactor = Math.min(1.25, 0.9 + (options.speed || 0) * 0.025);
      const stepDuration = (60 / (112 * speedFactor)) / 2;
      this.musicTimer += stepDuration;
      this.playMusicStep(this.musicStep, options.pressure || 0, options.zone || 1);
      this.musicStep = (this.musicStep + 1) % 16;
    }
  }

  playMusicStep(step, pressureValue, zoneValue) {
    const bassPattern = [55, 55, 65.41, 55, 73.42, 65.41, 55, 49];
    const root = bassPattern[Math.floor(step / 2) % bassPattern.length] * Math.pow(2, Math.min(5, zoneValue - 1) / 24);
    if (step % 2 === 0) this.tone(root, 0.21, { type: 'sawtooth', volume: 0.032, endFrequency: root * 0.92, destination: this.musicGain });
    if (step % 4 === 0) {
      this.tone(82.41, 0.08, { type: 'sine', volume: 0.055, endFrequency: 52, destination: this.musicGain });
      this.noiseToMusic(0.055, 0.035, 5200);
    } else if (step % 2 === 1) {
      this.noiseToMusic(0.025, 0.018, 7200);
    }
    if (step % 8 === 6) {
      const lead = pressureValue > 65 ? 987.77 : 659.25;
      this.tone(lead, 0.12, { type: 'square', volume: 0.018, endFrequency: lead * 0.8, destination: this.musicGain });
    }
    if (pressureValue > 72 && step % 4 === 2) {
      this.tone(58, 0.18, { type: 'sine', volume: 0.06, endFrequency: 42, destination: this.musicGain });
    }
  }

  noiseToMusic(duration, volume, frequency) {
    if (!this.enabled || !this.context || !this.noiseBuffer) return;
    const now = this.context.currentTime;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    source.start(now);
    source.stop(now + duration);
  }

  startBoostHum() {
    if (!this.enabled || !this.context || this.boostOscillator) return;
    const now = this.context.currentTime;
    this.boostOscillator = this.context.createOscillator();
    this.boostGain = this.context.createGain();
    this.boostOscillator.type = 'sawtooth';
    this.boostOscillator.frequency.setValueAtTime(72, now);
    this.boostOscillator.frequency.linearRampToValueAtTime(124, now + 0.3);
    this.boostGain.gain.setValueAtTime(0.0001, now);
    this.boostGain.gain.exponentialRampToValueAtTime(0.045, now + 0.12);
    this.boostOscillator.connect(this.boostGain);
    this.boostGain.connect(this.sfxGain);
    this.boostOscillator.start(now);
  }

  stopBoostHum() {
    if (!this.context || !this.boostOscillator || !this.boostGain) return;
    const oscillator = this.boostOscillator;
    const gain = this.boostGain;
    const now = this.context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    oscillator.stop(now + 0.14);
    this.boostOscillator = null;
    this.boostGain = null;
  }
}

const audio = new GameAudio();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1821);
scene.fog = new THREE.FogExp2(0x0d1821, 0.025);

const camera = new THREE.PerspectiveCamera(51, window.innerWidth / window.innerHeight, 0.1, 420);
camera.position.set(0, 2.7, 5.5);

const hemisphereLight = new THREE.HemisphereLight(0xcfe9ff, 0x111a1e, 2.15);
scene.add(hemisphereLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
keyLight.position.set(4.5, 9, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 45;
keyLight.shadow.camera.left = -10;
keyLight.shadow.camera.right = 10;
keyLight.shadow.camera.top = 10;
keyLight.shadow.camera.bottom = -10;
scene.add(keyLight);

const greenLight = new THREE.PointLight(0x39e072, 19, 18, 2);
greenLight.position.set(-4, 3, 1);
scene.add(greenLight);

const purpleLight = new THREE.PointLight(0x9e42e7, 17, 18, 2);
purpleLight.position.set(4, 3, -5);
scene.add(purpleLight);

const worldGroup = new THREE.Group();
scene.add(worldGroup);

const player = new THREE.Group();
scene.add(player);

const previewPlatform = createPreviewPlatform();
scene.add(previewPlatform);

const shadowBlob = new THREE.Mesh(
  new THREE.CircleGeometry(0.62, 32),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })
);
shadowBlob.rotation.x = -Math.PI / 2;
shadowBlob.position.y = 0.018;
scene.add(shadowBlob);

const boostAura = new THREE.Group();
const boostRingMaterial = new THREE.MeshBasicMaterial({ color: 0x9e42e7, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
for (let index = 0; index < 5; index += 1) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.43 + index * 0.04, 0.025, 8, 28), boostRingMaterial.clone());
  ring.rotation.x = Math.PI / 2;
  ring.position.z = 0.38 + index * 0.28;
  ring.userData.offset = index;
  boostAura.add(ring);
}
boostAura.visible = false;
scene.add(boostAura);

const playerGlow = new THREE.PointLight(0x9e42e7, 0, 6, 2);
scene.add(playerGlow);

createStars();
const glitchWall = createGlitchWall();
scene.add(glitchWall);

const loader = new GLTFLoader();
const loadedCharacters = new Map();
const failedCharacters = new Set();
const keys = new Set();
const pressedKeys = new Set();
const clock = new THREE.Clock();
const velocity = new THREE.Vector3();
const tempVector = new THREE.Vector3();

let character = null;
let mixer = null;
let actions = {};
let currentAction = null;
let currentState = '';
let selectedCharacterId = CHARACTERS[0].id;
let state = 'loading';
let countdownTimer = 0;
let toastTimer = 0;
let runSeed = 1;
let nextSegmentZ = 12;
let segmentIndex = 0;
let distance = 0;
let score = 0;
let shards = 0;
let integrity = MAX_INTEGRITY;
let pressure = 8;
let energy = 35;
let combo = 1;
let comboStreak = 0;
let comboTimer = 0;
let zone = 1;
let forwardSpeed = 0;
let lateralVelocity = 0;
let verticalVelocity = 0;
let grounded = true;
let invulnerableTimer = 0;
let screenShake = 0;
let runTime = 0;
let currentBoosting = false;
let cameraMode = 'rear';
let previewFocusTimer = 0;
let bestScore = readBestScore();

const segments = [];
let obstacles = [];
let collectibles = [];
let boostPads = [];

const shared = createSharedWorldAssets();

renderCharacterCards();
preloadCharacters();
animate();

function resolveAsset(path) {
  if (import.meta.env?.BASE_URL) return `${import.meta.env.BASE_URL}${path}`;
  return new URL(`../public/${path}`, import.meta.url).href;
}

function renderCharacterCards() {
  characterGrid.innerHTML = '';
  for (const definition of CHARACTERS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'character-card';
    button.dataset.characterId = definition.id;
    button.style.setProperty('--card-accent', definition.accent);
    button.disabled = true;
    button.innerHTML = `
      <span class="card-top">
        <span class="character-avatar">${definition.initial}</span>
        <span><strong>${definition.name}</strong><small>${definition.description}</small></span>
      </span>
      <span class="card-status"><span class="card-status-dot"></span><span data-card-status>Wordt geladen…</span></span>
    `;
    button.addEventListener('click', async () => {
      await audio.unlock();
      audio.select();
      selectCharacter(definition.id);
    });
    characterGrid.append(button);
  }
}

async function preloadCharacters() {
  let completed = 0;
  await Promise.all(CHARACTERS.map(async (definition) => {
    try {
      const gltf = await loader.loadAsync(resolveAsset(definition.model));
      prepareLoadedCharacter(gltf);
      loadedCharacters.set(definition.id, gltf);
      updateCardStatus(definition.id, 'Klaar om te rennen', false);
    } catch (error) {
      console.error(`Kon ${definition.name} niet laden`, error);
      failedCharacters.add(definition.id);
      updateCardStatus(definition.id, 'Laden mislukt', true);
    } finally {
      completed += 1;
      loadingDetail.textContent = `${completed} van ${CHARACTERS.length} characters geladen`;
    }
  }));

  const firstAvailable = CHARACTERS.find((item) => loadedCharacters.has(item.id));
  if (!firstAvailable) {
    loadingDetail.textContent = 'Geen character kon worden geladen. Start de game via een lokale webserver.';
    loadStatus.textContent = 'Laadfout';
    return;
  }

  await selectCharacter(firstAvailable.id);
  state = 'selection';
  loadStatus.textContent = `${loadedCharacters.size} runners online`;
  loadingDetail.textContent = 'Kies je runner';
  window.setTimeout(() => loadingScreen.classList.add('hidden'), 300);
}

function prepareLoadedCharacter(gltf) {
  const root = gltf.scene;
  root.traverse((object) => {
    if (object.isMesh || object.isSkinnedMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = false;
      if (object.material) object.material.side = THREE.FrontSide;
    }
  });

  const initialBox = new THREE.Box3().setFromObject(root);
  const initialHeight = Math.max(initialBox.max.y - initialBox.min.y, 0.001);
  root.scale.setScalar(1.75 / initialHeight);
  const scaledBox = new THREE.Box3().setFromObject(root);
  const center = scaledBox.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= scaledBox.min.y;
}

function updateCardStatus(id, label, failed) {
  const button = characterGrid.querySelector(`[data-character-id="${id}"]`);
  if (!button) return;
  const status = button.querySelector('[data-card-status]');
  if (status) status.textContent = label;
  button.disabled = failed;
  button.classList.toggle('failed', failed);
}

async function selectCharacter(id) {
  const gltf = loadedCharacters.get(id);
  if (!gltf) return;

  selectedCharacterId = id;
  const definition = CHARACTERS.find((item) => item.id === id);
  for (const card of characterGrid.querySelectorAll('.character-card')) {
    card.classList.toggle('selected', card.dataset.characterId === id);
    card.disabled = failedCharacters.has(card.dataset.characterId) || !loadedCharacters.has(card.dataset.characterId);
  }

  selectedCharacterName.textContent = definition.name;
  selectedCharacterMeta.textContent = describeAvailableAnimations(gltf.animations);
  startGameButton.disabled = false;

  if (mixer && character) {
    mixer.stopAllAction();
    mixer.uncacheRoot(character);
  }
  if (character) player.remove(character);

  character = gltf.scene;
  player.add(character);
  mixer = new THREE.AnimationMixer(character);
  actions = {};
  currentAction = null;
  currentState = '';

  for (const sourceClip of gltf.animations) {
    const clip = sourceClip.clone();
    clip.name = identifyClip(clip);
    if (['walk', 'run', 'jump'].includes(clip.name)) makeRootMotionInPlace(clip);
    if (!actions[clip.name]) actions[clip.name] = mixer.clipAction(clip);
  }

  mixer.addEventListener('finished', (event) => {
    if (event.action === actions.bow && state === 'selection') playAnimation('idle', 0.24);
  });

  resetPlayerTransform(false);
  previewFocusTimer = 2.6;
  playAnimation(actions.bow ? 'bow' : (actions.idle ? 'idle' : Object.keys(actions)[0]), 0.08);
  if (audio.context?.state === 'running' && actions.bow) audio.bow();
  mixer.update(0);
  loadStatus.textContent = definition.name;
}

function identifyClip(clip) {
  const explicitName = clip.name.toLowerCase();
  for (const name of ['idle', 'walk', 'run', 'jump', 'bow']) {
    if (explicitName.includes(name)) return name;
  }
  let closest = EXPECTED_CLIPS[0];
  let smallestDifference = Infinity;
  for (const candidate of EXPECTED_CLIPS) {
    const difference = Math.abs(clip.duration - candidate.duration);
    if (difference < smallestDifference) {
      smallestDifference = difference;
      closest = candidate;
    }
  }
  return smallestDifference <= 0.38 ? closest.name : clip.name;
}

function describeAvailableAnimations(clips) {
  const names = new Set(clips.map(identifyClip));
  const core = ['idle', 'walk', 'run', 'jump'].filter((name) => names.has(name));
  return core.length === 4 ? 'Idle, walk, run en jump' : `${core.length} basisanimaties beschikbaar`;
}

function makeRootMotionInPlace(clip) {
  for (const track of clip.tracks) {
    const normalizedName = track.name.toLowerCase();
    const isRootPosition = normalizedName.endsWith('root.position') || normalizedName.endsWith('/root.position');
    if (!isRootPosition || track.values.length < 3) continue;
    const restX = track.values[0];
    const restZ = track.values[2];
    for (let index = 0; index < track.values.length; index += 3) {
      track.values[index] = restX;
      track.values[index + 2] = restZ;
    }
  }
}

function playAnimation(name, fade = 0.16) {
  const nextAction = actions[name];
  if (!nextAction || currentState === name) return;
  if (currentAction) currentAction.fadeOut(fade);
  nextAction.reset().fadeIn(fade);
  if (name === 'jump' || name === 'bow') {
    nextAction.setLoop(THREE.LoopOnce, 1);
    nextAction.clampWhenFinished = true;
    nextAction.timeScale = name === 'jump' ? 1.15 : 1.0;
  } else {
    nextAction.setLoop(THREE.LoopRepeat, Infinity);
    nextAction.clampWhenFinished = false;
    nextAction.timeScale = 1.0;
  }
  nextAction.play();
  currentAction = nextAction;
  currentState = name;
}

async function startRun() {
  if (!character) return;
  await audio.unlock();
  audio.ui(740);
  resetRun();
  selectionScreen.classList.add('closed');
  gameOverScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  missionCard.classList.remove('hidden');
  controlsHint.classList.remove('hidden');
  mobileControls.classList.remove('hidden');
  pauseButton.classList.remove('hidden');
  changeCharacterButton.classList.remove('hidden');
  cameraModeButton.classList.remove('hidden');
  updateCameraButton();
  previewPlatform.visible = false;
  worldGroup.visible = true;
  glitchWall.visible = true;
  state = 'countdown';
  countdownTimer = 3.15;
  countdownEl.classList.remove('hidden');
  countdownEl.textContent = '3';
  audio.countdown('3');
  playAnimation('idle', 0.12);
  loadStatus.textContent = `Runner, ${getSelectedDefinition().name}`;
}

function resetRun() {
  clearWorld();
  resetPlayerTransform(true);
  keys.clear();
  pressedKeys.clear();
  runSeed = Math.floor(Math.random() * 1_000_000) + 1;
  nextSegmentZ = 12;
  segmentIndex = 0;
  distance = 0;
  score = 0;
  shards = 0;
  integrity = MAX_INTEGRITY;
  pressure = 8;
  energy = 35;
  combo = 1;
  comboStreak = 0;
  comboTimer = 0;
  zone = 1;
  forwardSpeed = 0;
  lateralVelocity = 0;
  verticalVelocity = 0;
  grounded = true;
  invulnerableTimer = 0;
  screenShake = 0;
  runTime = 0;
  currentBoosting = false;
  damageFlash.classList.remove('active');
  for (let z = 12; z > -SPAWN_AHEAD; z -= SEGMENT_LENGTH) spawnSegment(z);
  updateHud();
}

function resetPlayerTransform(forRun = false) {
  player.position.set(0, 0, 0);
  player.rotation.set(0, forRun ? Math.PI : 0, 0);
  velocity.set(0, 0, 0);
  shadowBlob.position.set(0, 0.018, 0);
}

function clearWorld() {
  for (const segment of segments) worldGroup.remove(segment.group);
  segments.length = 0;
  obstacles = [];
  collectibles = [];
  boostPads = [];
}

function updateCountdown(delta) {
  countdownTimer -= delta;
  if (countdownTimer > 0) {
    const label = String(Math.ceil(countdownTimer));
    if (countdownEl.textContent !== label) restartCountdownAnimation(label);
    return;
  }
  if (countdownTimer > -0.52) {
    if (countdownEl.textContent !== 'RUN') restartCountdownAnimation('RUN');
    return;
  }
  countdownEl.classList.add('hidden');
  state = 'playing';
  playAnimation('run', 0.12);
  showToast('RUN, de glitch komt eraan', 'good', 1.8);
}

function restartCountdownAnimation(label) {
  countdownEl.textContent = label;
  audio.countdown(label);
  countdownEl.style.animation = 'none';
  void countdownEl.offsetWidth;
  countdownEl.style.animation = '';
}

function updateGame(delta, elapsed) {
  runTime += delta;
  invulnerableTimer = Math.max(0, invulnerableTimer - delta);
  comboTimer = Math.max(0, comboTimer - delta);
  if (comboTimer === 0 && comboStreak > 0) resetCombo();

  const rawSteerInput = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  const steerInput = rawSteerInput * (cameraMode === 'front' ? -1 : 1);
  const accelerating = keys.has('KeyW') || keys.has('ArrowUp');
  const braking = keys.has('KeyS') || keys.has('ArrowDown');
  currentBoosting = (keys.has('ShiftLeft') || keys.has('ShiftRight')) && energy > 0.4;

  const baseSpeed = Math.min(11.6, 7.0 + distance * 0.0042);
  let targetSpeed = baseSpeed + (accelerating ? 0.9 : 0) - (braking ? 2.1 : 0);
  if (currentBoosting) {
    targetSpeed += 3.8;
    energy = Math.max(0, energy - 23 * delta);
    pressure = Math.max(0, pressure - 1.8 * delta);
  } else {
    energy = Math.min(100, energy + 2.2 * delta);
  }
  targetSpeed = Math.max(4.6, targetSpeed);
  forwardSpeed = THREE.MathUtils.damp(forwardSpeed, targetSpeed, 3.4, delta);

  const lateralTarget = steerInput * (currentBoosting ? 7.1 : 6.1);
  lateralVelocity = THREE.MathUtils.damp(lateralVelocity, lateralTarget, steerInput === 0 ? 10 : 8, delta);
  player.position.x = THREE.MathUtils.clamp(player.position.x + lateralVelocity * delta, -4.25, 4.25);
  player.position.z -= forwardSpeed * delta;

  if (pressedKeys.has('Space') && grounded) {
    grounded = false;
    verticalVelocity = JUMP_SPEED;
    audio.jump();
    playAnimation('jump', 0.1);
  }

  if (!grounded) {
    verticalVelocity -= GRAVITY * delta;
    player.position.y += verticalVelocity * delta;
    if (player.position.y <= 0) {
      player.position.y = 0;
      verticalVelocity = 0;
      grounded = true;
      audio.land();
      playAnimation('run', 0.1);
    }
  }

  const targetRotation = Math.atan2(lateralVelocity * 0.28, -forwardSpeed) + MODEL_FORWARD_OFFSET;
  player.rotation.y = dampAngle(player.rotation.y, targetRotation, 12, delta);

  if (grounded) {
    playAnimation(forwardSpeed < 5.4 && actions.walk ? 'walk' : 'run');
    if (actions.run) actions.run.timeScale = THREE.MathUtils.clamp(forwardSpeed / 7.4, 0.88, 1.65);
    if (actions.walk) actions.walk.timeScale = THREE.MathUtils.clamp(forwardSpeed / 4.8, 0.85, 1.4);
  }

  distance = Math.max(0, -player.position.z);
  const nextZone = Math.floor(distance / 250) + 1;
  if (nextZone !== zone) {
    zone = nextZone;
    audio.zone(zone);
    showToast(`ZONE ${zone}, snelheid verhoogd`, 'good', 2.1);
    updateMission();
  }

  pressure += (0.46 + zone * 0.075) * delta;
  score = Math.floor(distance * 10 + shards * 80 + comboStreak * 15);

  updateCollisions();
  updateWorld(delta, elapsed);
  updateRunnerEffects(delta, elapsed);
  updateHud();

  if (integrity <= 0) endRun('Je integriteit is volledig ingestort.');
  else if (pressure >= 100) endRun('De corrupte simulatie heeft je ingehaald.');
}

function updateCollisions() {
  const playerX = player.position.x;
  const playerZ = player.position.z;
  const playerBottom = player.position.y;
  const playerTop = playerBottom + 1.62;

  for (const obstacle of obstacles) {
    if (obstacle.hit || Math.abs(obstacle.z - playerZ) > 1.35) continue;
    const overlapsX = Math.abs(obstacle.x - playerX) < obstacle.width * 0.5 + 0.38;
    const overlapsZ = Math.abs(obstacle.z - playerZ) < obstacle.depth * 0.5 + 0.28;
    const overlapsY = playerBottom < obstacle.height - 0.08 && playerTop > 0.05;
    if (overlapsX && overlapsZ && overlapsY) hitObstacle(obstacle);
  }

  for (const shard of collectibles) {
    if (shard.collected || Math.abs(shard.z - playerZ) > 1.0) continue;
    const dx = shard.x - playerX;
    const dy = shard.y - (playerBottom + 0.82);
    const dz = shard.z - playerZ;
    if (dx * dx + dy * dy + dz * dz < 0.75) collectShard(shard);
  }

  for (const pad of boostPads) {
    if (pad.used || playerBottom > 0.18 || Math.abs(pad.z - playerZ) > 1.1) continue;
    if (Math.abs(pad.x - playerX) < pad.width * 0.5 + 0.4) activateBoostPad(pad);
  }
}

function hitObstacle(obstacle) {
  if (invulnerableTimer > 0 || state !== 'playing') return;
  obstacle.hit = true;
  integrity -= 1;
  pressure = Math.min(100, pressure + 23);
  forwardSpeed *= 0.58;
  invulnerableTimer = 1.45;
  screenShake = 0.45;
  resetCombo();
  audio.hit();
  showToast(`FIREWALL HIT, integriteit ${integrity}/${MAX_INTEGRITY}`, 'bad', 1.7);
  damageFlash.classList.add('active');
  window.setTimeout(() => damageFlash.classList.remove('active'), 130);
}

function collectShard(shard) {
  shard.collected = true;
  shard.mesh.visible = false;
  shards += 1;
  comboStreak += 1;
  comboTimer = 2.35;
  combo = Math.min(5, 1 + Math.floor(comboStreak / 5));
  audio.shard(combo);
  energy = Math.min(100, energy + 6.5);
  pressure = Math.max(0, pressure - 0.65);
  if (shards % 18 === 0 && integrity < MAX_INTEGRITY) {
    integrity += 1;
    audio.heal();
    showToast('INTEGRITEIT HERSTELD', 'good', 1.8);
  } else if (comboStreak === 5 || comboStreak === 10 || comboStreak === 15 || comboStreak === 20) {
    audio.combo(combo);
    showToast(`COMBO ×${combo}`, 'good', 1.3);
  }
}

function activateBoostPad(pad) {
  pad.used = true;
  pad.mesh.material = shared.boostPadUsedMaterial;
  energy = Math.min(100, energy + 45);
  pressure = Math.max(0, pressure - 14);
  audio.boostPad();
  showToast('OVERCLOCK GELADEN', 'good', 1.5);
}

function resetCombo() {
  combo = 1;
  comboStreak = 0;
  comboTimer = 0;
}

function updateWorld(delta, elapsed) {
  while (nextSegmentZ > player.position.z - SPAWN_AHEAD) spawnSegment(nextSegmentZ);
  while (segments.length && segments[0].centerZ > player.position.z + CLEANUP_BEHIND) removeOldestSegment();

  for (const shard of collectibles) {
    if (shard.collected) continue;
    shard.mesh.rotation.y += delta * 2.4;
    shard.mesh.rotation.x += delta * 0.8;
    shard.mesh.position.y = shard.baseY + Math.sin(elapsed * 3.1 + shard.phase) * 0.11;
  }

  for (const obstacle of obstacles) {
    if (!obstacle.pulse) continue;
    const pulse = 1 + Math.sin(elapsed * 5 + obstacle.phase) * 0.08;
    obstacle.mesh.material.emissiveIntensity = 1.1 * pulse;
  }

  const wallDistance = Math.max(5.4, 18 - pressure * 0.125);
  glitchWall.position.set(0, 0, player.position.z + wallDistance);
  glitchWall.userData.core.material.opacity = 0.16 + pressure * 0.0038;
  for (const particle of glitchWall.userData.particles) {
    particle.position.x += Math.sin(elapsed * 2 + particle.userData.phase) * delta * 0.45;
    particle.position.y += Math.cos(elapsed * 2.4 + particle.userData.phase) * delta * 0.22;
    particle.rotation.x += delta * 1.3;
    particle.rotation.y += delta * 1.1;
  }
  scene.fog.density = 0.024 + pressure * 0.00009;
}

function updateRunnerEffects(delta, elapsed) {
  const blink = invulnerableTimer > 0 && Math.floor(invulnerableTimer * 12) % 2 === 0;
  if (character) character.visible = !blink;

  shadowBlob.position.set(player.position.x, 0.018, player.position.z);
  const jumpScale = THREE.MathUtils.clamp(1 - player.position.y * 0.16, 0.7, 1);
  shadowBlob.scale.setScalar(jumpScale);
  shadowBlob.material.opacity = 0.3 * jumpScale;

  boostAura.visible = currentBoosting;
  boostAura.position.set(player.position.x, player.position.y + 0.82, player.position.z + 0.2);
  boostAura.rotation.y = player.rotation.y;
  if (currentBoosting) {
    boostAura.children.forEach((ring, index) => {
      ring.position.z = 0.45 + ((elapsed * 5 + index * 0.34) % 1.8);
      ring.material.opacity = 0.55 * (1 - ring.position.z / 2.4);
      ring.scale.setScalar(0.75 + ring.position.z * 0.18);
    });
  }
  playerGlow.position.set(player.position.x, player.position.y + 0.8, player.position.z);
  playerGlow.intensity = THREE.MathUtils.damp(playerGlow.intensity, currentBoosting ? 16 : 0, 7, delta);
}

function updateHud() {
  scoreValueEl.textContent = score.toLocaleString('nl-NL');
  distanceValueEl.textContent = Math.floor(distance).toLocaleString('nl-NL');
  shardsValueEl.textContent = shards.toString();
  comboValueEl.textContent = `×${combo}`;
  integrityValueEl.textContent = `${'◆ '.repeat(Math.max(0, integrity)).trim()}${integrity < MAX_INTEGRITY ? ` ${'◇ '.repeat(MAX_INTEGRITY - integrity).trim()}` : ''}`;
  energyValueEl.textContent = `${Math.round(energy)}%`;
  pressureValueEl.textContent = `${Math.round(pressure)}%`;
  energyBarEl.style.width = `${energy}%`;
  pressureBarEl.style.width = `${pressure}%`;
  zoneValueEl.textContent = zone.toString();
}

function updateMission() {
  const missions = [
    ['Blijf vóór de glitch', 'A en D om te sturen, spatie om te springen.'],
    ['Firewall-sector', 'Hoge blokken moet je ontwijken, lage barrières kun je overspringen.'],
    ['Overclock-zone', 'Houd Shift vast om energie om te zetten in topsnelheid.'],
    ['Corruptie stijgt', 'Data Shards verlagen de glitchdruk en bouwen je combo op.'],
    ['Root Access', 'Vanaf nu worden de patronen sneller en dichter.']
  ];
  const mission = missions[Math.min(missions.length - 1, zone - 1)];
  missionTitleEl.textContent = mission[0];
  missionDetailEl.textContent = mission[1];
}

function pauseGame() {
  if (state !== 'playing') return;
  state = 'paused';
  pauseScreen.classList.remove('hidden');
  pauseButton.textContent = 'Verder';
  keys.clear();
  if (character) character.visible = true;
  audio.pause(true);
}

function resumeGame() {
  if (state !== 'paused') return;
  state = 'playing';
  pauseScreen.classList.add('hidden');
  pauseButton.textContent = 'Pauze';
  audio.pause(false);
  clock.getDelta();
}

function togglePause() {
  if (state === 'playing') pauseGame();
  else if (state === 'paused') resumeGame();
}

function endRun(reason) {
  if (state === 'gameover') return;
  state = 'gameover';
  keys.clear();
  currentBoosting = false;
  boostAura.visible = false;
  if (character) character.visible = true;
  playAnimation('idle', 0.22);
  audio.gameOver();
  const previousBest = bestScore;
  if (score > bestScore) {
    bestScore = score;
    writeBestScore(bestScore);
  }
  resultScoreEl.textContent = score.toLocaleString('nl-NL');
  resultDistanceEl.textContent = Math.floor(distance).toLocaleString('nl-NL');
  resultShardsEl.textContent = shards.toString();
  resultBestEl.textContent = bestScore.toLocaleString('nl-NL');
  resultMessageEl.textContent = score > previousBest ? 'Nieuwe topscore. De simulatie is nog niet van je af.' : reason;
  gameOverScreen.classList.remove('hidden');
  pauseButton.classList.add('hidden');
  cameraModeButton.classList.add('hidden');
  controlsHint.classList.add('hidden');
  mobileControls.classList.add('hidden');
  loadStatus.textContent = `Run beëindigd, ${Math.floor(distance)} meter`;
}

function openCharacterSelection() {
  state = 'selection';
  keys.clear();
  pressedKeys.clear();
  selectionScreen.classList.remove('closed');
  gameOverScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  hud.classList.add('hidden');
  missionCard.classList.add('hidden');
  controlsHint.classList.add('hidden');
  mobileControls.classList.add('hidden');
  pauseButton.classList.add('hidden');
  changeCharacterButton.classList.add('hidden');
  cameraModeButton.classList.add('hidden');
  countdownEl.classList.add('hidden');
  worldGroup.visible = false;
  glitchWall.visible = false;
  previewPlatform.visible = true;
  clearWorld();
  resetPlayerTransform(false);
  previewFocusTimer = 2.6;
  playAnimation(actions.bow ? 'bow' : 'idle', 0.18);
  loadStatus.textContent = `${loadedCharacters.size} runners online`;
}

function createSharedWorldAssets() {
  return {
    floorGeometry: new THREE.BoxGeometry(TRACK_WIDTH, 0.24, SEGMENT_LENGTH),
    floorMaterials: [
      new THREE.MeshStandardMaterial({ color: 0x12242e, roughness: 0.82, metalness: 0.14 }),
      new THREE.MeshStandardMaterial({ color: 0x10202a, roughness: 0.86, metalness: 0.1 })
    ],
    stripGeometry: new THREE.BoxGeometry(0.055, 0.035, SEGMENT_LENGTH - 0.2),
    greenStripMaterial: new THREE.MeshBasicMaterial({ color: 0x39e072, transparent: true, opacity: 0.42 }),
    purpleStripMaterial: new THREE.MeshBasicMaterial({ color: 0x9e42e7, transparent: true, opacity: 0.34 }),
    railGeometry: new THREE.BoxGeometry(0.18, 0.34, SEGMENT_LENGTH),
    railMaterial: new THREE.MeshStandardMaterial({ color: 0x1c3340, emissive: 0x0b2f1a, emissiveIntensity: 0.5, roughness: 0.65, metalness: 0.35 }),
    towerGeometry: new THREE.BoxGeometry(0.75, 4.5, 0.75),
    towerMaterial: new THREE.MeshStandardMaterial({ color: 0x172a36, roughness: 0.7, metalness: 0.28 }),
    lowBarrierGeometry: new THREE.BoxGeometry(1.9, 1.0, 0.68),
    tallBarrierGeometry: new THREE.BoxGeometry(1.95, 2.65, 0.78),
    obstacleMaterial: new THREE.MeshStandardMaterial({ color: 0x5b1729, emissive: 0xff264f, emissiveIntensity: 1.08, roughness: 0.36, metalness: 0.32 }),
    obstacleMaterialAlt: new THREE.MeshStandardMaterial({ color: 0x351653, emissive: 0x9e42e7, emissiveIntensity: 1.0, roughness: 0.32, metalness: 0.4 }),
    shardGeometry: new THREE.OctahedronGeometry(0.23, 0),
    shardMaterial: new THREE.MeshStandardMaterial({ color: 0x9affbd, emissive: 0x39e072, emissiveIntensity: 2.1, roughness: 0.23, metalness: 0.28 }),
    boostPadGeometry: new THREE.BoxGeometry(1.9, 0.08, 2.1),
    boostPadMaterial: new THREE.MeshStandardMaterial({ color: 0x4d1b70, emissive: 0x9e42e7, emissiveIntensity: 2, roughness: 0.28, metalness: 0.42 }),
    boostPadUsedMaterial: new THREE.MeshStandardMaterial({ color: 0x20252b, emissive: 0x292d32, emissiveIntensity: 0.25, roughness: 0.8, metalness: 0.1 }),
    archPillarGeometry: new THREE.BoxGeometry(0.42, 4.3, 0.42),
    archTopGeometry: new THREE.BoxGeometry(TRACK_WIDTH + 1.4, 0.42, 0.42),
    archMaterial: new THREE.MeshStandardMaterial({ color: 0x263c49, emissive: 0x163520, emissiveIntensity: 0.55, roughness: 0.6, metalness: 0.36 })
  };
}

function spawnSegment(centerZ) {
  const index = segmentIndex;
  segmentIndex += 1;
  nextSegmentZ = centerZ - SEGMENT_LENGTH;
  const group = new THREE.Group();
  group.position.z = centerZ;
  worldGroup.add(group);
  const segment = { group, centerZ, index };
  segments.push(segment);

  const floor = new THREE.Mesh(shared.floorGeometry, shared.floorMaterials[index % 2]);
  floor.position.y = -0.12;
  floor.receiveShadow = true;
  group.add(floor);

  for (const x of [-1.325, 1.325]) {
    const strip = new THREE.Mesh(shared.stripGeometry, index % 2 ? shared.greenStripMaterial : shared.purpleStripMaterial);
    strip.position.set(x, 0.025, 0);
    group.add(strip);
  }

  for (const x of [-TRACK_WIDTH * 0.5 - 0.14, TRACK_WIDTH * 0.5 + 0.14]) {
    const rail = new THREE.Mesh(shared.railGeometry, shared.railMaterial);
    rail.position.set(x, 0.16, 0);
    rail.castShadow = true;
    group.add(rail);
  }

  const random = seededRandom(runSeed + index * 991);
  if (index % 3 === 0) addSideTowers(group, random);
  if (index > 1 && index % 7 === 0) addArch(group);

  if (index < 4) {
    addShardLine(segment, LANES[index % LANES.length], -3.8, 5, 1.9, 0.85);
    return;
  }

  const density = Math.min(0.82, 0.39 + distance / 1850);
  if (random() > density) {
    const lane = LANES[Math.floor(random() * LANES.length)];
    addShardLine(segment, lane, -4.1, 6, 1.65, 0.86);
    if (random() < 0.18) addBoostPad(segment, lane, 3.7);
    return;
  }

  const pattern = random();
  if (pattern < 0.26) {
    const blockedIndex = Math.floor(random() * LANES.length);
    addObstacle(segment, LANES[blockedIndex], 0, 'tall');
    const safeLane = LANES[(blockedIndex + (random() < 0.5 ? 1 : 2)) % LANES.length];
    addShardLine(segment, safeLane, -3.8, 5, 1.8, 0.86);
  } else if (pattern < 0.5) {
    const safeIndex = Math.floor(random() * LANES.length);
    for (let laneIndex = 0; laneIndex < LANES.length; laneIndex += 1) {
      if (laneIndex !== safeIndex) addObstacle(segment, LANES[laneIndex], 0, 'tall');
    }
    addShardLine(segment, LANES[safeIndex], -3.6, 5, 1.75, 0.86);
  } else if (pattern < 0.73) {
    const lane = LANES[Math.floor(random() * LANES.length)];
    addObstacle(segment, lane, 0.5, 'low');
    addShardLine(segment, lane, -3.2, 5, 1.55, 1.62, true);
  } else {
    const first = Math.floor(random() * LANES.length);
    let second = Math.floor(random() * LANES.length);
    if (second === first) second = (second + 1) % LANES.length;
    addObstacle(segment, LANES[first], -2.2, random() < 0.45 ? 'low' : 'tall');
    addObstacle(segment, LANES[second], 2.7, 'tall');
    const safeIndex = [0, 1, 2].find((value) => value !== first && value !== second) ?? ((first + 1) % 3);
    addShardLine(segment, LANES[safeIndex], -4.4, 6, 1.65, 0.86);
  }

  if (random() < 0.11) {
    const lane = LANES[Math.floor(random() * LANES.length)];
    addBoostPad(segment, lane, 4.2);
  }
}

function addSideTowers(group, random) {
  for (const x of [-7.0, 7.0]) {
    const tower = new THREE.Mesh(shared.towerGeometry, shared.towerMaterial);
    tower.position.set(x, 1.4 + random() * 1.3, (random() - 0.5) * 6);
    tower.scale.y = 0.65 + random() * 0.8;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.81, 0.08, 0.81), random() > 0.5 ? shared.greenStripMaterial : shared.purpleStripMaterial);
    lamp.position.set(tower.position.x, tower.position.y + tower.scale.y * 2.25, tower.position.z);
    group.add(lamp);
  }
}

function addArch(group) {
  for (const x of [-5.55, 5.55]) {
    const pillar = new THREE.Mesh(shared.archPillarGeometry, shared.archMaterial);
    pillar.position.set(x, 2.15, 0);
    pillar.castShadow = true;
    group.add(pillar);
  }
  const top = new THREE.Mesh(shared.archTopGeometry, shared.archMaterial);
  top.position.set(0, 4.3, 0);
  top.castShadow = true;
  group.add(top);
}

function addObstacle(segment, x, localZ, type) {
  const isLow = type === 'low';
  const material = segment.index % 3 === 0 ? shared.obstacleMaterialAlt : shared.obstacleMaterial;
  const mesh = new THREE.Mesh(isLow ? shared.lowBarrierGeometry : shared.tallBarrierGeometry, material.clone());
  const height = isLow ? 1.0 : 2.65;
  mesh.position.set(x, height * 0.5, localZ);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  segment.group.add(mesh);
  obstacles.push({
    segment,
    mesh,
    x,
    z: segment.centerZ + localZ,
    width: isLow ? 1.9 : 1.95,
    height,
    depth: isLow ? 0.68 : 0.78,
    hit: false,
    pulse: true,
    phase: segment.index * 0.73 + x
  });
}

function addShardLine(segment, x, startZ, count, spacing, height, arc = false) {
  for (let index = 0; index < count; index += 1) {
    const localZ = startZ + index * spacing;
    const arcHeight = arc ? Math.sin((index / Math.max(1, count - 1)) * Math.PI) * 0.7 : 0;
    addShard(segment, x, localZ, height + arcHeight);
  }
}

function addShard(segment, x, localZ, y) {
  const mesh = new THREE.Mesh(shared.shardGeometry, shared.shardMaterial);
  mesh.position.set(x, y, localZ);
  mesh.castShadow = true;
  segment.group.add(mesh);
  collectibles.push({
    segment,
    mesh,
    x,
    z: segment.centerZ + localZ,
    y,
    baseY: y,
    phase: segment.index * 0.51 + localZ,
    collected: false
  });
}

function addBoostPad(segment, x, localZ) {
  const mesh = new THREE.Mesh(shared.boostPadGeometry, shared.boostPadMaterial);
  mesh.position.set(x, 0.045, localZ);
  mesh.receiveShadow = true;
  segment.group.add(mesh);
  boostPads.push({ segment, mesh, x, z: segment.centerZ + localZ, width: 1.9, used: false });
}

function removeOldestSegment() {
  const segment = segments.shift();
  if (!segment) return;
  worldGroup.remove(segment.group);
  obstacles = obstacles.filter((item) => item.segment !== segment);
  collectibles = collectibles.filter((item) => item.segment !== segment);
  boostPads = boostPads.filter((item) => item.segment !== segment);
}

function createPreviewPlatform() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.15, 2.45, 0.32, 48),
    new THREE.MeshStandardMaterial({ color: 0x142833, roughness: 0.58, metalness: 0.32 })
  );
  base.position.y = -0.16;
  base.receiveShadow = true;
  group.add(base);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.23, 0.035, 10, 72),
    new THREE.MeshBasicMaterial({ color: 0x39e072, transparent: true, opacity: 0.7 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.015;
  group.add(ring);
  return group;
}

function createGlitchWall() {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(TRACK_WIDTH * 1.8, 7, 0.28),
    new THREE.MeshBasicMaterial({ color: 0x9e42e7, transparent: true, opacity: 0.18, depthWrite: false })
  );
  core.position.y = 3.0;
  group.add(core);
  const particles = [];
  const random = seededRandom(9137);
  for (let index = 0; index < 36; index += 1) {
    const particle = new THREE.Mesh(
      new THREE.BoxGeometry(0.18 + random() * 0.58, 0.18 + random() * 0.75, 0.12),
      new THREE.MeshBasicMaterial({ color: random() > 0.45 ? 0x9e42e7 : 0xff4d69, transparent: true, opacity: 0.45 + random() * 0.4 })
    );
    particle.position.set((random() - 0.5) * TRACK_WIDTH * 1.8, random() * 6.2, (random() - 0.5) * 1.3);
    particle.userData.phase = random() * Math.PI * 2;
    group.add(particle);
    particles.push(particle);
  }
  group.userData.core = core;
  group.userData.particles = particles;
  group.visible = false;
  return group;
}

function createStars() {
  const count = 550;
  const positions = new Float32Array(count * 3);
  const random = seededRandom(82711);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 150;
    positions[index * 3 + 1] = 3 + random() * 42;
    positions[index * 3 + 2] = -random() * 300 + 30;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0x8fb9c9, size: 0.07, transparent: true, opacity: 0.58, sizeAttenuation: true })
  );
  scene.add(points);
}

function updateCamera(delta, elapsed) {
  if (state === 'selection' || state === 'loading') {
    previewFocusTimer = Math.max(0, previewFocusTimer - delta);
    const orbit = previewFocusTimer > 0 ? 0 : elapsed * 0.16;
    const target = player.position.clone().add(new THREE.Vector3(0, 1.02, 0));
    const radius = previewFocusTimer > 0 ? 3.65 : 4.1;
    const desired = new THREE.Vector3(Math.sin(orbit) * radius, 2.25, Math.cos(orbit) * radius);
    camera.position.lerp(desired, 1 - Math.exp(-4.8 * delta));
    camera.lookAt(target);
    camera.fov = THREE.MathUtils.damp(camera.fov, 48, 5, delta);
    camera.updateProjectionMatrix();
    return;
  }

  const shake = screenShake > 0 ? screenShake * 0.12 : 0;
  screenShake = Math.max(0, screenShake - delta * 1.8);
  const shakeX = (Math.random() - 0.5) * shake;
  const shakeY = (Math.random() - 0.5) * shake;

  let desired;
  let target;
  let targetFov;

  if (cameraMode === 'front') {
    desired = new THREE.Vector3(
      player.position.x * 0.22 + shakeX,
      player.position.y + 2.85 + shakeY,
      player.position.z - 6.4
    );
    target = new THREE.Vector3(
      player.position.x * 0.12,
      player.position.y + 1.08,
      player.position.z + 2.4
    );
    targetFov = currentBoosting ? 67 : 59 + Math.min(3, forwardSpeed * 0.16);
  } else {
    desired = new THREE.Vector3(
      player.position.x * 0.34 + shakeX,
      player.position.y + 3.15 + shakeY,
      player.position.z + 6.45
    );
    target = new THREE.Vector3(
      player.position.x * 0.18,
      player.position.y + 1.05,
      player.position.z - 5.8
    );
    targetFov = currentBoosting ? 60 : 52 + Math.min(4, forwardSpeed * 0.22);
  }

  camera.position.lerp(desired, 1 - Math.exp(-7.5 * delta));
  camera.lookAt(target);
  camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 5, delta);
  camera.updateProjectionMatrix();
  keyLight.position.set(player.position.x + 4.5, 9, player.position.z + 5);
  keyLight.target.position.set(player.position.x, 0, player.position.z - 5);
  if (!keyLight.target.parent) scene.add(keyLight.target);
}

function updatePreview(elapsed) {
  if (state !== 'selection') return;
  previewPlatform.children[1].rotation.z = elapsed * 0.22;
  player.position.y = Math.sin(elapsed * 1.2) * 0.008;
}

function updateToast(delta) {
  if (toastTimer <= 0) return;
  toastTimer -= delta;
  if (toastTimer <= 0) {
    toastEl.classList.remove('visible');
    window.setTimeout(() => toastEl.classList.add('hidden'), 180);
  }
}

function showToast(message, kind = 'good', duration = 1.5) {
  toastEl.textContent = message;
  toastEl.className = `toast ${kind}`;
  toastEl.classList.remove('hidden');
  void toastEl.offsetWidth;
  toastEl.classList.add('visible');
  toastTimer = duration;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  if (mixer && state !== 'paused') mixer.update(delta);
  if (state === 'countdown') updateCountdown(delta);
  else if (state === 'playing') updateGame(delta, elapsed);

  updatePreview(elapsed);
  updateCamera(delta, elapsed);
  updateToast(delta);
  audio.update(delta, state, { speed: forwardSpeed, pressure, zone, boosting: currentBoosting, grounded });
  pressedKeys.clear();
  renderer.render(scene, camera);
}

function dampAngle(current, target, lambda, delta) {
  let difference = (target - current + Math.PI) % (Math.PI * 2) - Math.PI;
  if (difference < -Math.PI) difference += Math.PI * 2;
  return current + difference * (1 - Math.exp(-lambda * delta));
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function toggleCameraMode() {
  if (!['playing', 'countdown', 'paused'].includes(state)) return;
  cameraMode = cameraMode === 'rear' ? 'front' : 'rear';
  audio.ui(cameraMode === 'front' ? 720 : 520);
  updateCameraButton();
  showToast(cameraMode === 'front' ? 'CRASH-CAMERA, de glitch is zichtbaar' : 'VOLGCAMERA, blik op het parcours', 'good', 1.7);
}

function updateCameraButton() {
  const front = cameraMode === 'front';
  cameraModeButton.textContent = front ? 'Camera: Voor' : 'Camera: Achter';
  cameraModeButton.classList.toggle('active', front);
  cameraModeButton.setAttribute('aria-pressed', String(front));
}

function updateSoundButton() {
  if (!soundToggleButton) return;
  soundToggleButton.textContent = audio.enabled ? 'Geluid: Aan' : 'Geluid: Uit';
  soundToggleButton.classList.toggle('active', audio.enabled);
  soundToggleButton.setAttribute('aria-pressed', String(audio.enabled));
}

function getSelectedDefinition() {
  return CHARACTERS.find((item) => item.id === selectedCharacterId) ?? CHARACTERS[0];
}

function readBestScore() {
  try {
    return Number.parseInt(localStorage.getItem('tex-glitch-run-best') ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function writeBestScore(value) {
  try {
    localStorage.setItem('tex-glitch-run-best', String(value));
  } catch {
    // De game blijft werken wanneer opslag door de browser wordt geblokkeerd.
  }
}

startGameButton.addEventListener('click', startRun);
restartGameButton.addEventListener('click', startRun);
changeCharacterButton.addEventListener('click', openCharacterSelection);
cameraModeButton.addEventListener('click', toggleCameraMode);
soundToggleButton?.addEventListener('click', async () => {
  await audio.unlock();
  audio.toggle();
});
mobileCameraModeButton?.addEventListener('click', toggleCameraMode);
pauseSelectButton.addEventListener('click', openCharacterSelection);
gameOverSelectButton.addEventListener('click', openCharacterSelection);
pauseButton.addEventListener('click', togglePause);
resumeGameButton.addEventListener('click', resumeGame);

window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
updateSoundButton();

window.addEventListener('keydown', (event) => {
  audio.unlock();
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  if (event.code === 'Escape') {
    togglePause();
    return;
  }
  if (event.code === 'KeyM') {
    audio.toggle();
    return;
  }
  if (event.code === 'KeyC') {
    toggleCameraMode();
    return;
  }
  if (event.code === 'KeyR' && state === 'gameover') {
    startRun();
    return;
  }
  if (!keys.has(event.code)) pressedKeys.add(event.code);
  keys.add(event.code);
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => {
  keys.clear();
  if (state === 'playing') pauseGame();
});

for (const button of document.querySelectorAll('[data-key]')) {
  const key = button.dataset.key;
  const press = (event) => {
    event.preventDefault();
    if (!keys.has(key)) pressedKeys.add(key);
    keys.add(key);
  };
  const release = (event) => {
    event.preventDefault();
    keys.delete(key);
  };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
