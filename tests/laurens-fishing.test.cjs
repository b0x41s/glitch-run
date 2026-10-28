'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('Laurens fisherman loads in both static publishing layouts', () => {
  for (const base of ['world-debugger', 'public/world-debugger']) {
    const html = read(base + '/index.html');
    assert.match(html, /src="fishing-laurens\.js\?v=1"/);
    assert.match(html, /href="fishing-laurens\.css\?v=1"/);
    assert.match(html, /type="importmap"/);
    assert.match(html, /cdn\.jsdelivr\.net\/npm\/three@0\.170\.0/);
    assert.match(html, /id="worldStage"/);
    const character = read(base + '/fishing-laurens.js');
    assert.doesNotThrow(() => new Function(character));
    assert.match(character, /models\/laurens\.glb/);
    assert.match(character, /stage\.dataset\.biome === 'alpine'/);
    assert.match(character, /classList\.contains\('rendered'\)/);
    assert.match(character, /pointer|decorative/);
    assert.match(character, /prefers-reduced-motion/);
    const css = read(base + '/fishing-laurens.css');
    assert.match(css, /pointer-events: none/);
  }
  assert.equal(
    read('world-debugger/fishing-laurens.js'),
    read('public/world-debugger/fishing-laurens.js')
  );
  assert.equal(
    read('world-debugger/fishing-laurens.css'),
    read('public/world-debugger/fishing-laurens.css')
  );
  assert.equal(
    read('world-debugger/index.html'),
    read('public/world-debugger/index.html')
  );
  assert.ok(fs.statSync(path.join(root, 'public/models/laurens.glb')).size > 100000);
});

test('fishing layer is independent from score state and hit targets', () => {
  const code = read('public/world-debugger/fishing-laurens.js');
  assert.doesNotMatch(code, /(?:localStorage|ArcadeScores|chooseTarget|game\.tick)\s*\(/);
  assert.match(code, /layer\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(code, /\.className = 'laurens-fishing-layer'/);
});
