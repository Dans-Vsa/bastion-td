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

test('upgrading costs gold, raises damage and caps at the max level', () => {
  const g = new Game({ gold: 1000 });
  const t = g.placeTower('arrow', 2, 3);
  const dmg = t.damage;
  assert.equal(t.upgradeCost, 40);
  assert.ok(g.upgradeTower(t));
  assert.equal(t.level, 2);
  assert.ok(t.damage > dmg);
  assert.ok(g.upgradeTower(t));
  assert.equal(t.maxed, true);
  assert.equal(g.upgradeTower(t), false);
});

test('upgrade fails without enough gold', () => {
  const g = new Game({ gold: 50 });
  const t = g.placeTower('arrow', 2, 3);
  assert.equal(g.upgradeTower(t), false);
  assert.equal(t.level, 1);
});

test('selling refunds 70% of the gold invested and frees the tile', () => {
  const g = new Game({ gold: 1000 });
  const t = g.placeTower('arrow', 2, 3);
  g.upgradeTower(t);
  const before = g.gold;
  assert.equal(g.sellTower(t), 63);
  assert.equal(g.gold, before + 63);
  assert.equal(g.canPlace(2, 3), true);
  assert.equal(g.sellTower(t), 0);
});

test('frost towers slow enemies and the slow wears off', () => {
  const g = new Game({ gold: 1000 });
  g.placeTower('frost', 4, 2);
  const e = g.spawn('grunt');
  e.distance = 4 * 48;
  g.update(0.01);
  assert.equal(e.speed, 30);
  g.towers.length = 0;
  g.update(2);
  assert.equal(e.speed, 60);
});

test('cannon splash damages nearby enemies but not distant ones', () => {
  const g = new Game({ gold: 1000 });
  g.placeTower('cannon', 4, 2);
  const a = g.spawn('tank'); a.distance = 220;
  const b = g.spawn('tank'); b.distance = 200;
  const far = g.spawn('tank'); far.distance = 60;
  g.update(0.01);
  assert.equal(a.hp, 160 - 22);
  assert.equal(b.hp, 160 - 22);
  assert.equal(far.hp, 160);
});
