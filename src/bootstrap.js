const mainUrl = new URL('./main.js', import.meta.url);
mainUrl.searchParams.set('v', '11');

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
  `const baseSpeed = Math.min(11.6, 7.0 + distance * 0.0042);`,
  `const baseSpeed = Math.min(16.2, 8.8 + distance * 0.0105);`,
  'hogere snelheid'
);

replaceRequired(
  `const nextZone = Math.floor(distance / 250) + 1;`,
  `const nextZone = Math.floor(distance / 85) + 1;`,
  'kortere zones'
);

replaceRequired(
  `pressure += (0.46 + zone * 0.075) * delta;`,
  `pressure += (0.84 + zone * 0.16) * delta;`,
  'snellere glitchdruk'
);

replaceRequired(
  `const density = Math.min(0.82, 0.39 + distance / 1850);`,
  `const density = Math.min(0.96, 0.66 + distance / 650);`,
  'hogere obstakeldichtheid'
);

replaceRequired(
  `if (index < 4) {`,
  `if (index < 2) {`,
  'kortere introductie'
);

replaceRequired(
  `pressure = Math.min(100, pressure + 23);`,
  `pressure = Math.min(100, pressure + 27);`,
  'zwaardere botsing'
);

replaceRequired(
  `invulnerableTimer = 1.45;`,
  `invulnerableTimer = 1.15;`,
  'kortere onkwetsbaarheid'
);

replaceRequired(
  `pressure = Math.max(0, pressure - 0.65);`,
  `pressure = Math.max(0, pressure - 0.25);`,
  'minder drukverlaging per coin'
);

replaceRequired(
  `if (shards % 18 === 0 && integrity < MAX_INTEGRITY) {`,
  `if (shards % 25 === 0 && integrity < MAX_INTEGRITY) {`,
  'minder vaak herstel'
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

source = source.replaceAll('Data Shards', 'Coins');
source = source.replaceAll('Data Shard', 'Coin');

const blob = new Blob([source], { type: 'text/javascript' });
const moduleUrl = URL.createObjectURL(blob);

try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
