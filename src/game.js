import { Path } from './path.js';
import { Enemy, Tower, TOWER_TYPES } from './entities.js';

export const TILE = 48;
export const COLS = 16;
export const ROWS = 10;

const DEFAULT_PATH = [
  { x: 0, y: 1.5 }, { x: 5.5, y: 1.5 }, { x: 5.5, y: 6.5 },
  { x: 10.5, y: 6.5 }, { x: 10.5, y: 3.5 }, { x: 16, y: 3.5 },
].map((p) => ({ x: p.x * TILE, y: p.y * TILE }));

export class Game {
  constructor({ path = new Path(DEFAULT_PATH), gold = 100, lives = 20 } = {}) {
    this.path = path;
    this.pathTiles = path.tiles(TILE);
    this.gold = gold;
    this.lives = lives;
    this.towers = [];
    this.enemies = [];
  }

  get over() { return this.lives <= 0; }

  canPlace(col, row) {
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return false;
    if (this.pathTiles.has(`${col},${row}`)) return false;
    return !this.towers.some((t) => t.col === col && t.row === row);
  }

  placeTower(type, col, row) {
    const def = TOWER_TYPES[type];
    if (!def || this.gold < def.cost || !this.canPlace(col, row)) return null;
    this.gold -= def.cost;
    const tower = new Tower(type, col, row, TILE);
    this.towers.push(tower);
    return tower;
  }

  spawn(type) {
    const e = new Enemy(type);
    this.enemies.push(e);
    return e;
  }

  enemyPos(e) { return this.path.positionAt(e.distance); }

  /** Enemy furthest along the path that is within the tower's range. */
  target(tower) {
    let best = null;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const p = this.enemyPos(e);
      if (Math.hypot(p.x - tower.x, p.y - tower.y) <= tower.range && (!best || e.distance > best.distance)) best = e;
    }
    return best;
  }

  update(dt) {
    if (this.over) return;
    for (const e of this.enemies) {
      e.distance += e.speed * dt;
      if (e.distance >= this.path.length) { e.alive = false; e.reachedBase = true; this.lives -= 1; }
    }
    for (const t of this.towers) {
      t.timer -= dt;
      if (t.timer > 0) continue;
      const target = this.target(t);
      if (!target) continue;
      target.hp -= t.damage;
      t.timer = t.cooldown;
      if (target.hp <= 0) { target.alive = false; this.gold += target.reward; }
    }
    this.enemies = this.enemies.filter((e) => e.alive);
  }
}
