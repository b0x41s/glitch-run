const mainUrl = new URL('./main.js', import.meta.url);
mainUrl.searchParams.set('v', '12');

const response = await fetch(mainUrl, { cache: 'no-store' });
if (!response.ok) {
  throw new Error(`Kon gamecode niet laden: ${response.status}`);
}

let source = await response.text();

function replaceFunction(functionName, nextFunctionName, replacement) {
  const start = source.indexOf(`function ${functionName}`);
  const end = source.indexOf(`\nfunction ${nextFunctionName}`, start);
  if (start === -1 || end === -1) {
    throw new Error(`Kon functie ${functionName} niet aanpassen.`);
  }
  source = `${source.slice(0, start)}${replacement}\n${source.slice(end + 1)}`;
}

function replaceRequired(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Kon wijziging niet toepassen: ${label}`);
  }
  source = source.replace(search, replacement);
}

replaceFunction(
  'resolveAsset(path) {',
  'renderCharacterCards()',
  `function resolveAsset(path) {
  const pagePath = window.location.pathname.endsWith('/')
    ? window.location.pathname
    : window.location.pathname.replace(/\\/[^/]*$/, '/');
  const cleanPath = String(path).replace(/^\\.?\\//, '');
  return window.location.origin + pagePath + 'public/' + cleanPath;
}`
);

replaceRequired(
  `    const boosting = Boolean(options.boosting);
    if (boosting !== this.lastBoosting) {
      if (boosting) this.startBoostHum();
      else this.stopBoostHum();
      this.lastBoosting = boosting;
    }`,
  `    const boosting = Boolean(options.boosting);
    if (!boosting && this.lastBoosting) this.stopBoostHum();
    this.lastBoosting = boosting;`,
  'boostgeluid uitschakelen'
);

replaceRequired(
  'let currentBoosting = false;',
  `let currentBoosting = false;
let sprintExhausted = false;
let pressureWarningLevel = 0;`,
  'sprintstatus toevoegen'
);

replaceRequired(
  `      <span class="card-status"><span class="card-status-dot"></span><span data-card-status>Wordt geladen…</span></span>`,
  `      <span class="card-status"><span class="card-status-dot"></span><span data-card-status>Wordt geladen…</span></span>
      <span class="card-best" data-card-best>Highscore \${readBestScore(definition.id).toLocaleString('nl-NL')}</span>`,
  'highscore op characterkaart'
);

replaceRequired(
  `  selectedCharacterId = id;`,
  `  selectedCharacterId = id;
  bestScore = readBestScore(id);`,
  'highscore bij characterselectie'
);

replaceRequired(
  `  selectedCharacterMeta.textContent = describeAvailableAnimations(gltf.animations);`,
  `  selectedCharacterMeta.textContent = describeAvailableAnimations(gltf.animations) + ' • Highscore ' + bestScore.toLocaleString('nl-NL');
  updateCharacterBestScores();`,
  'highscore tonen bij selectie'
);

replaceRequired(
  `  pressure = 8;
  energy = 35;`,
  `  pressure = 20;
  energy = 100;`,
  'sterkere startdruk en volle sprintmeter'
);

replaceRequired(
  `  runTime = 0;
  currentBoosting = false;`,
  `  runTime = 0;
  currentBoosting = false;
  sprintExhausted = false;
  pressureWarningLevel = 0;`,
  'sprintstatus resetten'
);

replaceRequired(
  `  currentBoosting = (keys.has('ShiftLeft') || keys.has('ShiftRight')) && energy > 0.4;`,
  `  const wantsSprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  if (sprintExhausted && energy >= 60 && !wantsSprint) {
    sprintExhausted = false;
    showToast('SPRINT GEREED', 'good', 1.1);
  }
  currentBoosting = wantsSprint && !sprintExhausted && energy > 0.5;`,
  'sprint met herstelperiode'
);

replaceRequired(
  `const baseSpeed = Math.min(11.6, 7.0 + distance * 0.0042);`,
  `const baseSpeed = Math.min(17.2, 9.2 + distance * 0.012);`,
  'hogere basissnelheid'
);

replaceRequired(
  `  if (currentBoosting) {
    targetSpeed += 3.8;
    energy = Math.max(0, energy - 23 * delta);
    pressure = Math.max(0, pressure - 1.8 * delta);
  } else {
    energy = Math.min(100, energy + 2.2 * delta);
  }`,
  `  if (currentBoosting) {
    targetSpeed += 5.2;
    energy = Math.max(0, energy - 34 * delta);
    pressure = Math.max(0, pressure - 0.45 * delta);
    if (energy <= 0.5) {
      sprintExhausted = true;
      currentBoosting = false;
      showToast('BUITEN ADEM, laat Shift los en herstel', 'bad', 1.8);
    }
  } else {
    energy = Math.min(100, energy + (sprintExhausted ? 22 : 13) * delta);
    if (sprintExhausted) targetSpeed -= 1.45;
  }`,
  'sprintduur en herstel instellen'
);

replaceRequired(
  `const nextZone = Math.floor(distance / 250) + 1;`,
  `const nextZone = Math.floor(distance / 75) + 1;`,
  'kortere zones'
);

replaceRequired(
  `  pressure += (0.46 + zone * 0.075) * delta;`,
  `  pressure += (1.12 + zone * 0.22) * delta;
  const nextWarningLevel = pressure >= 86 ? 3 : pressure >= 68 ? 2 : pressure >= 48 ? 1 : 0;
  if (nextWarningLevel > pressureWarningLevel) {
    pressureWarningLevel = nextWarningLevel;
    screenShake = Math.max(screenShake, nextWarningLevel * 0.12);
    const warningText = nextWarningLevel === 3 ? 'GLITCH KRITIEK, sprint nu' : nextWarningLevel === 2 ? 'DE GLITCH KOMT DICHTERBIJ' : 'GLITCHDRUK STIJGT';
    showToast(warningText, 'bad', 1.7);
    audio.ui(nextWarningLevel === 3 ? 170 : 250);
  }`,
  'snellere en duidelijkere glitchdruk'
);

replaceRequired(
  `const density = Math.min(0.82, 0.39 + distance / 1850);`,
  `const density = Math.min(0.98, 0.72 + distance / 520);`,
  'hogere obstakeldichtheid'
);

replaceRequired(
  `if (index < 4) {`,
  `if (index < 2) {`,
  'kortere introductie'
);

replaceRequired(
  `pressure = Math.min(100, pressure + 23);`,
  `pressure = Math.min(100, pressure + 29);`,
  'zwaardere botsing'
);

replaceRequired(
  `invulnerableTimer = 1.45;`,
  `invulnerableTimer = 1.05;`,
  'kortere onkwetsbaarheid'
);

replaceRequired(
  `pressure = Math.max(0, pressure - 0.65);`,
  `pressure = Math.max(0, pressure - 0.15);`,
  'minder drukverlaging per coin'
);

replaceRequired(
  `if (shards % 18 === 0 && integrity < MAX_INTEGRITY) {`,
  `if (shards % 28 === 0 && integrity < MAX_INTEGRITY) {`,
  'minder vaak herstel'
);

replaceRequired(
  `  const wallDistance = Math.max(5.4, 18 - pressure * 0.125);`,
  `  const wallDistance = Math.max(3.15, 13.2 - pressure * 0.098);`,
  'glitchmuur dichterbij'
);

replaceRequired(
  `  glitchWall.userData.core.material.opacity = 0.16 + pressure * 0.0038;`,
  `  glitchWall.userData.core.material.opacity = Math.min(0.96, 0.3 + pressure * 0.0065);`,
  'glitchmuur zichtbaarder'
);

replaceRequired(
  `  scene.fog.density = 0.024 + pressure * 0.00009;`,
  `  scene.fog.density = 0.027 + pressure * 0.00022;`,
  'sterkere glitchmist'
);

replaceRequired(
  `function updateRunnerEffects(delta, elapsed) {
  const blink = invulnerableTimer > 0 && Math.floor(invulnerableTimer * 12) % 2 === 0;`,
  `function updateRunnerEffects(delta, elapsed) {
  const threatOpacity = Math.max(0, (pressure - 34) / 66) * 0.38;
  damageFlash.style.opacity = damageFlash.classList.contains('active') ? '1' : String(threatOpacity);
  const blink = invulnerableTimer > 0 && Math.floor(invulnerableTimer * 12) % 2 === 0;`,
  'visuele drukoverlay'
);

replaceRequired(
  "  energyValueEl.textContent = `${Math.round(energy)}%`;",
  `  energyValueEl.textContent = sprintExhausted
    ? ((keys.has('ShiftLeft') || keys.has('ShiftRight')) ? 'LAAT LOS' : 'HERSTEL ' + Math.round(energy) + '%')
    : Math.round(energy) + '%';
  energyBarEl.classList.toggle('exhausted', sprintExhausted);
  pressureBarEl.classList.toggle('critical', pressure >= 70);`,
  'sprintstatus in HUD'
);

replaceRequired(
  `  currentBoosting = false;
  boostAura.visible = false;`,
  `  currentBoosting = false;
  damageFlash.style.opacity = '0';
  boostAura.visible = false;`,
  'drukoverlay uit bij game-over'
);

replaceRequired(
  `    shardGeometry: new THREE.OctahedronGeometry(0.23, 0),
    shardMaterial: new THREE.MeshStandardMaterial({ color: 0x9affbd, emissive: 0x39e072, emissiveIntensity: 2.1, roughness: 0.23, metalness: 0.28 }),`,
  `    coinGeometry: new THREE.CylinderGeometry(0.29, 0.29, 0.09, 28, 1, false),
    coinMaterial: new THREE.MeshStandardMaterial({ color: 0xf6bd2a, emissive: 0x8a5100, emissiveIntensity: 0.62, roughness: 0.24, metalness: 0.92 }),
    coinRimGeometry: new THREE.TorusGeometry(0.235, 0.022, 7, 28),
    coinRimMaterial: new THREE.MeshStandardMaterial({ color: 0xffe06b, emissive: 0xb66b00, emissiveIntensity: 0.72, roughness: 0.2, metalness: 0.95 }),
    coinBarGeometry: new THREE.BoxGeometry(0.032, 0.35, 0.026),
    coinArcGeometry: new THREE.TorusGeometry(0.105, 0.021, 6, 14, Math.PI),
    coinMarkMaterial: new THREE.MeshStandardMaterial({ color: 0x6e3d00, emissive: 0x2b1600, emissiveIntensity: 0.2, roughness: 0.36, metalness: 0.72 }),`,
  'coinmaterialen'
);

replaceFunction(
  'addShard(segment, x, localZ, y) {',
  'addBoostPad(segment, x, localZ)',
  `function addShard(segment, x, localZ, y) {
  const mesh = new THREE.Group();

  const coin = new THREE.Mesh(shared.coinGeometry, shared.coinMaterial);
  coin.rotation.x = Math.PI / 2;
  coin.castShadow = true;
  mesh.add(coin);

  const frontRim = new THREE.Mesh(shared.coinRimGeometry, shared.coinRimMaterial);
  frontRim.position.z = 0.05;
  mesh.add(frontRim);

  const backRim = new THREE.Mesh(shared.coinRimGeometry, shared.coinRimMaterial);
  backRim.position.z = -0.05;
  mesh.add(backRim);

  const markBar = new THREE.Mesh(shared.coinBarGeometry, shared.coinMarkMaterial);
  markBar.position.z = 0.058;
  mesh.add(markBar);

  const upperArc = new THREE.Mesh(shared.coinArcGeometry, shared.coinMarkMaterial);
  upperArc.position.set(0, 0.045, 0.058);
  mesh.add(upperArc);

  const lowerArc = new THREE.Mesh(shared.coinArcGeometry, shared.coinMarkMaterial);
  lowerArc.position.set(0, -0.045, 0.058);
  lowerArc.rotation.z = Math.PI;
  mesh.add(lowerArc);

  mesh.position.set(x, y, localZ);
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
}`
);

replaceRequired(
  `function readBestScore() {
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
}`,
  `function readBestScore(characterId = selectedCharacterId) {
  try {
    const key = 'tex-glitch-run-best-' + characterId;
    const stored = Number.parseInt(localStorage.getItem(key) ?? '0', 10) || 0;
    if (stored > 0) return stored;
    if (characterId === 'casper') return Number.parseInt(localStorage.getItem('tex-glitch-run-best') ?? '0', 10) || 0;
    return 0;
  } catch {
    return 0;
  }
}

function writeBestScore(value, characterId = selectedCharacterId) {
  try {
    localStorage.setItem('tex-glitch-run-best-' + characterId, String(value));
  } catch {
    // De game blijft werken wanneer opslag door de browser wordt geblokkeerd.
  }
}

function updateCharacterBestScores() {
  for (const definition of CHARACTERS) {
    const card = characterGrid.querySelector('[data-character-id="' + definition.id + '"]');
    const label = card?.querySelector('[data-card-best]');
    if (label) label.textContent = 'Highscore ' + readBestScore(definition.id).toLocaleString('nl-NL');
  }
}`,
  'highscores per character opslaan'
);

replaceRequired(
  `    writeBestScore(bestScore);`,
  `    writeBestScore(bestScore, selectedCharacterId);
    updateCharacterBestScores();`,
  'characterhighscore bijwerken'
);

source = source.replaceAll('Data Shards', 'Coins');
source = source.replaceAll('Data Shard', 'Coin');
source = source.replaceAll('Overclock-zone', 'Sprint-zone');
source = source.replaceAll('Houd Shift vast om energie om te zetten in topsnelheid.', 'Houd Shift kort vast om te sprinten, laat los om op adem te komen.');
source = source.replaceAll('OVERCLOCK GELADEN', 'SPRINTENERGIE HERSTELD');

const blob = new Blob([source], { type: 'text/javascript' });
const moduleUrl = URL.createObjectURL(blob);

try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
