import { Path } from './path.js';
import { Enemy, Tower, TOWER_TYPES } from './entities.js';
import { WaveManager } from './waves.js';

export const TILE = 48;
export const COLS = 16;
export const ROWS = 10;

const DEFAULT_PATH = [
  { x: 0, y: 1.5 }, { x: 5.5, y: 1.5 }, { x: 5.5, y: 6.5 },
  { x: 10.5, y: 6.5 }, { x: 10.5, y: 3.5 }, { x: 16, y: 3.5 },
].map((p) => ({ x: p.x * TILE, y: p.y * TILE }));

export class Game {
  constructor({ path = new Path(DEFAULT_PATH), gold = 100, lives = 20, waveDelay = 10 } = {}) {
    this.path = path;
    this.pathTiles = path.tiles(TILE);
    this.initial = { gold, lives, waveDelay };
    this.reset();
  }

  /** Back to a fresh game on the same map. */
  reset() {
    this.gold = this.initial.gold;
    this.lives = this.initial.lives;
    this.towers = [];
    this.enemies = [];
    this.kills = 0;
    this.waves = new WaveManager({ delay: this.initial.waveDelay });
  }

  get wave() { return this.waves.number; }

  /** Starts the next wave; calling it during the countdown pays 1 gold per second skipped. */
  startWave() {
    if (this.over) return false;
    const skipped = this.waves.start();
    if (skipped === null) return false;
    this.gold += Math.floor(skipped);
    return true;
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

  towerAt(col, row) { return this.towers.find((t) => t.col === col && t.row === row) ?? null; }

  /** Levels a tower up if there is enough gold. Returns true on success. */
  upgradeTower(tower) {
    const cost = tower.upgradeCost;
    if (cost === null || this.gold < cost || !this.towers.includes(tower)) return false;
    this.gold -= cost;
    tower.invested += cost;
    tower.levelUp();
    return true;
  }

  /** Removes a tower and refunds part of what was spent on it. Returns the refund, or 0. */
  sellTower(tower) {
    const i = this.towers.indexOf(tower);
    if (i < 0) return 0;
    this.towers.splice(i, 1);
    this.gold += tower.sellValue;
    return tower.sellValue;
  }

  spawn(type, hpScale = 1) {
    const e = new Enemy(type, hpScale);
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

  /** Applies a tower shot: damage (with splash around the target) and slow. */
  hit(tower, target) {
    const victims = [target];
    if (tower.splash) {
      const c = this.enemyPos(target);
      for (const e of this.enemies) {
        if (e === target || !e.alive) continue;
        const p = this.enemyPos(e);
        if (Math.hypot(p.x - c.x, p.y - c.y) <= tower.splash) victims.push(e);
      }
    }
    for (const e of victims) {
      e.hp -= tower.damage;
      if (tower.slow) e.applySlow(tower.slow, tower.slowTime);
      if (e.hp <= 0 && e.alive) { e.alive = false; this.gold += e.reward; this.kills += 1; }
    }
  }

  update(dt) {
    if (this.over) return;
    for (const e of this.enemies) {
      e.tick(dt);
      e.distance += e.speed * dt;
      if (e.distance >= this.path.length) { e.alive = false; e.reachedBase = true; this.lives -= 1; }
    }
    for (const t of this.towers) {
      t.timer -= dt;
      if (t.timer > 0) continue;
      const target = this.target(t);
      if (!target) continue;
      t.timer = t.cooldown;
      this.hit(t, target);
    }
    this.enemies = this.enemies.filter((e) => e.alive);
    if (!this.over) this.waves.update(dt, this);
  }
}
