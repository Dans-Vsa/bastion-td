import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

test('cannot place a tower on the path', () => {
  const g = new Game();
  assert.equal(g.canPlace(2, 1), false);
  assert.equal(g.placeTower('arrow', 2, 1), null);
  assert.equal(g.gold, 100);
});

test('placing a tower costs gold and blocks the tile', () => {
  const g = new Game();
  assert.ok(g.placeTower('arrow', 2, 3));
  assert.equal(g.gold, 50);
  assert.equal(g.canPlace(2, 3), false);
});

test('cannot place without enough gold or outside the map', () => {
  const g = new Game({ gold: 10 });
  assert.equal(g.placeTower('arrow', 2, 3), null);
  assert.equal(new Game().canPlace(99, 0), false);
});

test('enemies reaching the base cost lives', () => {
  const g = new Game();
  g.spawn('grunt');
  g.update(g.path.length / 60 + 0.1);
  assert.equal(g.lives, 19);
  assert.equal(g.enemies.length, 0);
});

test('a tower kills an enemy and awards gold', () => {
  const g = new Game();
  g.placeTower('arrow', 3, 2);
  g.spawn('grunt');
  g.enemies[0].distance = 150; // near the tower
  for (let i = 0; i < 30; i++) g.update(0.1);
  assert.equal(g.enemies.length, 0);
  assert.equal(g.lives, 20);
  assert.equal(g.gold, 55);
});

test('game over when lives run out', () => {
  const g = new Game({ lives: 1 });
  g.spawn('grunt');
  g.update(100);
  assert.equal(g.over, true);
});
