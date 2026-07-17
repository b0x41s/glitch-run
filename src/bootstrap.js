const mainUrl = new URL('./main.js', import.meta.url);
mainUrl.searchParams.set('v', '8');

const response = await fetch(mainUrl, { cache: 'no-store' });
if (!response.ok) {
  throw new Error(`Kon gamecode niet laden: ${response.status}`);
}

let source = await response.text();

const assetFunctionStart = source.indexOf('function resolveAsset(path) {');
const assetFunctionEnd = source.indexOf('\n}\n\nfunction renderCharacterCards', assetFunctionStart);

if (assetFunctionStart === -1 || assetFunctionEnd === -1) {
  throw new Error('Kon de assetresolver niet aanpassen.');
}

source = `${source.slice(0, assetFunctionStart)}function resolveAsset(path) {
  const pagePath = window.location.pathname.endsWith('/')
    ? window.location.pathname
    : window.location.pathname.replace(/\\/[^/]*$/, '/');
  const cleanPath = String(path).replace(/^\\.?\\//, '');
  return window.location.origin + pagePath + cleanPath;
}${source.slice(assetFunctionEnd + 2)}`;

source = source.replace(
  `    if (gameState === 'playing' && options.grounded) {
      this.footstepTimer -= delta;
      if (this.footstepTimer <= 0) {
        this.footstep(options.speed || 7);
        this.footstepTimer = Math.max(0.18, 0.42 - (options.speed || 7) * 0.017);
      }
    } else {
      this.footstepTimer = 0;
    }`,
  `    // Voetstappen zijn uitgeschakeld, de overige geluidseffecten blijven actief.
    this.footstepTimer = 0;`
);

source = source.replace(
  `const baseSpeed = Math.min(12.4, 7.2 + distance * 0.0048);`,
  `const baseSpeed = Math.min(14.6, 8.6 + distance * 0.0085);`
);

source = source.replace(
  `const nextZone = Math.floor(distance / 180) + 1;`,
  `const nextZone = Math.floor(distance / 95) + 1;`
);

source = source.replace(
  `pressure += (0.46 + zone * 0.075) * delta;`,
  `pressure += (0.7 + zone * 0.12) * delta;`
);

const blob = new Blob([source], { type: 'text/javascript' });
const moduleUrl = URL.createObjectURL(blob);

try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
