import test from 'node:test';
import assert from 'node:assert/strict';
import { Effects, LIFETIMES, progress } from '../src/effects.js';

test('game events become effects', () => {
  const fx = new Effects();
  fx.fromEvents([
    { type: 'shot', tower: 'cannon', x1: 0, y1: 0, x2: 10, y2: 10, splash: 55 },
    { type: 'shot', tower: 'arrow', x1: 0, y1: 0, x2: 5, y2: 5, splash: 0 },
    { type: 'kill', x: 10, y: 10, gold: 5 },
    { type: 'leak' },
    { type: 'build', x: 1, y: 1 },
  ]);
  assert.deepEqual(fx.items.map((i) => i.kind), ['beam', 'splash', 'beam', 'burst', 'text', 'flash']);
  assert.equal(fx.items[0].color, '#fb923c');
  assert.equal(fx.items[4].text, '+5');
});

test('effects age and expire', () => {
  const fx = new Effects();
  fx.add('beam', {});
  fx.add('text', { text: '+1' });
  fx.update(LIFETIMES.beam / 2);
  assert.equal(progress(fx.items[0]), 0.5);
  fx.update(LIFETIMES.beam);
  assert.deepEqual(fx.items.map((i) => i.kind), ['text']);
  fx.update(LIFETIMES.text);
  assert.equal(fx.items.length, 0);
});

test('the effect list is capped and can be cleared', () => {
  const fx = new Effects({ max: 3 });
  for (let i = 0; i < 5; i++) fx.add('burst', { id: i });
  assert.deepEqual(fx.items.map((i) => i.id), [2, 3, 4]);
  fx.clear();
  assert.equal(fx.items.length, 0);
  assert.throws(() => fx.add('nope', {}), /Unknown effect/);
});
