import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

const types = (events) => events.map((e) => e.type);

test('building, upgrading and selling emit events', () => {
  const g = new Game({ gold: 500 });
  const t = g.placeTower('arrow', 2, 3);
  g.upgradeTower(t);
  g.sellTower(t);
  const events = g.drainEvents();
  assert.deepEqual(types(events), ['build', 'upgrade', 'sell']);
  assert.equal(events[1].level, 2);
  assert.equal(events[2].gold, t.sellValue);
  assert.deepEqual(g.drainEvents(), [], 'drain clears the queue');
});

test('shots and kills emit events with positions', () => {
  const g = new Game();
  g.placeTower('arrow', 2, 3);
  g.drainEvents();
  const e = g.spawn('grunt');
  e.hp = 1;
  e.distance = 100;
  g.update(0.01);
  const events = g.drainEvents();
  assert.deepEqual(types(events), ['shot', 'kill']);
  assert.equal(events[0].tower, 'arrow');
  assert.equal(events[1].gold, e.reward);
  assert.ok(Number.isFinite(events[1].x) && Number.isFinite(events[1].y));
});

test('cannon shots carry their splash radius', () => {
  const g = new Game({ gold: 200 });
  g.placeTower('cannon', 2, 3);
  g.spawn('tank').distance = 100;
  g.update(0.01);
  const shot = g.drainEvents().find((e) => e.type === 'shot');
  assert.equal(shot.splash, 55);
});

test('leaks and the final leak emit leak and gameover', () => {
  const g = new Game({ lives: 2 });
  for (let i = 0; i < 2; i++) g.spawn('grunt').distance = g.path.length - 1;
  g.update(0.1);
  assert.deepEqual(types(g.drainEvents()), ['leak', 'leak', 'gameover']);
});

test('starting, auto-starting and clearing waves emit events', () => {
  const g = new Game({ waveDelay: 1 });
  g.startWave();
  assert.deepEqual(types(g.drainEvents()), ['wave']);
  g.waves.toSpawn = 0;
  g.waves.state = 'fighting';
  g.enemies = [];
  g.update(0.01);
  const clear = g.drainEvents();
  assert.deepEqual(types(clear), ['clear']);
  assert.equal(clear[0].wave, 1);
  g.update(1.5); // countdown runs out
  assert.deepEqual(g.drainEvents().map((e) => [e.type, e.wave]), [['wave', 2]]);
});

test('reset clears pending events', () => {
  const g = new Game();
  g.placeTower('arrow', 2, 3);
  g.reset();
  assert.deepEqual(g.drainEvents(), []);
});
