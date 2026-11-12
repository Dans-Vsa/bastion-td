// Boots src/main.js against a minimal fake DOM built from the ids in index.html,
// so a renamed element or a broken render loop fails in CI without a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

class FakeElement {
  constructor(id) { this.id = id; this.textContent = ''; this.disabled = false; this.listeners = {}; this.width = 768; this.height = 480; }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  fire(type, ev = {}) { this.listeners[type]?.(ev); }
  getBoundingClientRect() { return { left: 0, top: 0, width: this.width, height: this.height }; }
  getContext() { return new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } }); }
}

test('the page boots, renders the HUD and reacts to the controls', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map((m) => [m[1], new FakeElement(m[1])]));
  const frames = [];
  let now = 0;
  globalThis.HTMLButtonElement = class {};
  globalThis.document = { getElementById: (id) => elements.get(id) ?? null };
  globalThis.window = { addEventListener: (type, fn) => { globalThis.window[`on${type}`] = fn; } };
  globalThis.requestAnimationFrame = (fn) => frames.push(fn);
  const tick = (n = 1) => { for (let i = 0; i < n; i++) { now += 50; frames.shift()(now); } };
  const text = (id) => elements.get(id).textContent;

  await import('../src/main.js');
  const game = globalThis.window.__game;
  tick();
  assert.deepEqual([text('gold'), text('lives'), text('wave'), text('kills')], ['100', '20', '0', '0']);
  assert.equal(text('start'), 'Start wave');
  assert.equal(elements.get('start').disabled, false);

  elements.get('game').fire('click', { clientX: 2.5 * 48, clientY: 3.5 * 48 });
  tick();
  assert.equal(game.towers.length, 1);
  assert.equal(text('gold'), '50');

  elements.get('start').fire('click');
  tick();
  assert.equal(text('wave'), '1');
  assert.equal(text('start'), 'Wave running');
  assert.equal(elements.get('start').disabled, true);
  assert.match(text('status'), /^\d+ enemies left$/);

  elements.get('speed').fire('click');
  assert.equal(text('speed'), '2x');
  tick(2000); // long enough to clear wave 1 and reach the countdown or beyond
  assert.ok(Number(text('wave')) >= 2 || /^Next wave in \d+s$/.test(text('status')));

  game.lives = 0;
  tick();
  assert.match(text('status'), /^Defeated on wave \d+$/);
  assert.equal(elements.get('start').disabled, true);

  globalThis.window.onkeydown({ code: 'KeyR', target: {}, preventDefault() {} });
  tick();
  assert.deepEqual([text('gold'), text('lives'), text('wave')], ['100', '20', '0']);
  globalThis.window.onkeydown({ code: 'Space', target: {}, preventDefault() {} });
  tick();
  assert.equal(text('wave'), '1');
});
