// Checks where the optional OpenRouter key is kept (the BYOK object at the
// top of assets/js/search.js), without booting the rest of the app.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const SRC = fs.readFileSync(path.resolve(__dirname, '../../assets/js/search.js'), 'utf8');
const NAME = 'fellowship-openrouter-key-v1';
const KEY = 'sk-or-v1-' + 'a'.repeat(40);

function load({ blockStorage = false, legacyKey = null } = {}) {
  const dom = new JSDOM('<!doctype html><body></body>', {
    url: 'https://fellowship-digital-ministry.github.io/search.html',
    runScripts: 'outside-only',
  });
  const { window } = dom;
  if (legacyKey) window.localStorage.setItem(NAME, legacyKey);
  if (blockStorage) {
    for (const prop of ['localStorage', 'sessionStorage']) {
      Object.defineProperty(window, prop, { get() { throw new Error('blocked'); } });
    }
  }
  const end = SRC.indexOf('class CapHitError');
  assert.ok(end > 0, 'BYOK section not found in search.js');
  window.eval(SRC.slice(0, end) + '\nwindow.__BYOK = BYOK;');
  return window;
}

test('by default the key is kept for this tab only (sessionStorage)', () => {
  const window = load();
  window.__BYOK.set(KEY, false);
  assert.strictEqual(window.__BYOK.get(), KEY);
  assert.strictEqual(window.sessionStorage.getItem(NAME), KEY);
  assert.strictEqual(window.localStorage.getItem(NAME), null);
  assert.strictEqual(window.__BYOK.isRemembered(), false);
});

test('"Remember on this device" keeps it in localStorage only', () => {
  const window = load();
  window.__BYOK.set(KEY, false);
  window.__BYOK.set(KEY, true);
  assert.strictEqual(window.localStorage.getItem(NAME), KEY);
  assert.strictEqual(window.sessionStorage.getItem(NAME), null);
  assert.strictEqual(window.__BYOK.isRemembered(), true);
});

test('clear() removes the key from every store', () => {
  const window = load({ legacyKey: KEY });
  window.__BYOK.set(KEY, false);
  window.__BYOK.clear();
  assert.strictEqual(window.__BYOK.get(), '');
  assert.strictEqual(window.localStorage.getItem(NAME), null);
  assert.strictEqual(window.sessionStorage.getItem(NAME), null);
});

test('a key saved by the previous version is still honoured as remembered', () => {
  const window = load({ legacyKey: KEY });
  assert.strictEqual(window.__BYOK.get(), KEY);
  assert.strictEqual(window.__BYOK.isRemembered(), true);
});

test('blocked storage falls back to memory and does not throw', () => {
  const window = load({ blockStorage: true });
  window.__BYOK.set(KEY, true);
  assert.strictEqual(window.__BYOK.get(), KEY);
  window.__BYOK.clear();
  assert.strictEqual(window.__BYOK.get(), '');
});

test('search.js never logs the key', () => {
  const offenders = SRC.split('\n').filter((line) =>
    /console\.(log|warn|error|info|debug)/.test(line) && /byok|openrouter.?key|BYOK\.get/i.test(line));
  assert.deepStrictEqual(offenders, []);
});
