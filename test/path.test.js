import test from 'node:test';
import assert from 'node:assert/strict';
import { Path } from '../src/path.js';

const p = new Path([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }]);

test('length sums all segments', () => assert.equal(p.length, 150));
test('positionAt interpolates along a segment', () => assert.deepEqual(p.positionAt(40), { x: 40, y: 0 }));
test('positionAt crosses corners', () => assert.deepEqual(p.positionAt(125), { x: 100, y: 25 }));
test('positionAt clamps to the ends', () => {
  assert.deepEqual(p.positionAt(-5), { x: 0, y: 0 });
  assert.deepEqual(p.positionAt(999), { x: 100, y: 50 });
});
test('needs two points', () => assert.throws(() => new Path([{ x: 0, y: 0 }])));
test('tiles lists covered grid cells', () => {
  const tiles = p.tiles(50);
  assert.ok(tiles.has('0,0') && tiles.has('1,0') && tiles.has('2,0') && tiles.has('2,1'));
  assert.ok(!tiles.has('0,1'));
});
