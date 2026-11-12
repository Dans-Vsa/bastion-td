import test from 'node:test';
import assert from 'node:assert/strict';
import { waveSpec, WaveManager } from '../src/waves.js';
import { Game } from '../src/game.js';

const run = (g, seconds, step = 0.1) => { for (let t = 0; t < seconds; t += step) g.update(step); };

test('waveSpec gets harder every wave', () => {
  const a = waveSpec(1);
  const b = waveSpec(5);
  assert.equal(a.count, 6);
  assert.ok(b.count > a.count && b.hpScale > a.hpScale && b.interval < a.interval && b.bonus > a.bonus);
  assert.ok(waveSpec(100).interval >= 0.35);
  assert.throws(() => waveSpec(0));
});

test('the first wave waits for the player', () => {
  const g = new Game();
  run(g, 30);
  assert.equal(g.wave, 0);
  assert.equal(g.enemies.length, 0);
});

test('starting a wave spawns its enemies over time', () => {
  const g = new Game();
  assert.equal(g.startWave(), true);
  assert.equal(g.wave, 1);
  g.update(0.01);
  assert.equal(g.enemies.length, 1);
  assert.equal(g.waves.state, 'spawning');
  run(g, 6);
  assert.equal(g.waves.state, 'fighting');
  assert.equal(g.enemies.length, 6);
});

test('cannot start a wave while one is running', () => {
  const g = new Game();
  g.startWave();
  assert.equal(g.startWave(), false);
  assert.equal(g.wave, 1);
});

test('clearing a wave pays a bonus and starts the countdown', () => {
  const g = new Game({ lives: 99 });
  g.startWave();
  run(g, 40); // no towers: every grunt leaks through
  assert.equal(g.lives, 99 - 6);
  assert.equal(g.gold, 100 + waveSpec(1).bonus);
});

test('the next wave auto-starts when the countdown ends', () => {
  const g = new Game({ lives: 99, waveDelay: 3 });
  g.startWave();
  while (g.waves.state !== 'waiting') g.update(0.1);
  assert.ok(g.waves.countdown > 0);
  run(g, 3.5);
  assert.equal(g.wave, 2);
});

test('calling the next wave early pays gold for the skipped seconds', () => {
  const g = new Game({ lives: 99, waveDelay: 10 });
  g.startWave();
  while (g.waves.state !== 'waiting') g.update(0.1);
  const gold = g.gold;
  assert.equal(g.startWave(), true);
  assert.equal(g.gold, gold + 10);
});

test('later waves spawn tougher enemies', () => {
  const m = new WaveManager();
  const spawned = [];
  const fake = { enemies: [], gold: 0, spawn: (type, scale) => spawned.push(scale) };
  m.start(); m.update(100, fake); m.update(0, fake); // wave 1 spawned and cleared
  m.start(); m.update(0, fake);
  assert.equal(spawned.at(-1), 1.25);
});

test('kills are counted', () => {
  const g = new Game({ gold: 1000 });
  for (const [c, r] of [[1, 2], [2, 2], [3, 2], [4, 2], [1, 0], [2, 0], [3, 0], [4, 0]]) g.placeTower('arrow', c, r);
  g.startWave();
  while (g.waves.state !== 'waiting') g.update(0.1);
  assert.equal(g.kills, 6);
  assert.equal(g.lives, 20);
});

test('reset restores a fresh game', () => {
  const g = new Game({ lives: 1 });
  g.placeTower('arrow', 2, 3);
  g.startWave();
  run(g, 40);
  assert.equal(g.over, true);
  assert.equal(g.startWave(), false);
  g.reset();
  assert.deepEqual([g.over, g.gold, g.lives, g.wave, g.towers.length, g.enemies.length], [false, 100, 1, 0, 0, 0]);
});

test('waves stop advancing after game over', () => {
  const g = new Game({ lives: 1, waveDelay: 1 });
  g.startWave();
  run(g, 60);
  assert.equal(g.over, true);
  assert.equal(g.wave, 1);
});
