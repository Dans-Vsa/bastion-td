export const TOWER_TYPES = {
  arrow: { name: 'Arrow Tower', cost: 50, range: 120, damage: 12, cooldown: 0.6, color: '#4ade80' },
  frost: { name: 'Frost Tower', cost: 70, range: 100, damage: 4, cooldown: 0.9, color: '#60a5fa', slow: 0.5, slowTime: 1.5 },
  cannon: { name: 'Cannon', cost: 100, range: 110, damage: 22, cooldown: 1.6, color: '#fb923c', splash: 55 },
};

export const ENEMY_TYPES = {
  grunt: { name: 'Grunt', hp: 40, speed: 60, reward: 5, color: '#f87171' },
  runner: { name: 'Runner', hp: 22, speed: 105, reward: 4, color: '#fbbf24' },
  tank: { name: 'Tank', hp: 160, speed: 38, reward: 14, color: '#a78bfa' },
};

export const MAX_LEVEL = 3;
export const SELL_RATIO = 0.7;

export class Enemy {
  constructor(type = 'grunt', hpScale = 1) {
    const t = ENEMY_TYPES[type];
    if (!t) throw new Error(`Unknown enemy type: ${type}`);
    this.type = type;
    this.maxHp = this.hp = Math.round(t.hp * hpScale);
    this.baseSpeed = t.speed;
    this.reward = t.reward;
    this.distance = 0;
    this.alive = true;
    this.reachedBase = false;
    this.slowFactor = 1;
    this.slowLeft = 0;
  }

  get speed() { return this.baseSpeed * (this.slowLeft > 0 ? this.slowFactor : 1); }

  /** Slows the enemy; the strongest slow wins and the timer is refreshed. */
  applySlow(factor, seconds) {
    if (this.slowLeft <= 0 || factor <= this.slowFactor) this.slowFactor = factor;
    this.slowLeft = Math.max(this.slowLeft, seconds);
  }

  tick(dt) { if (this.slowLeft > 0) this.slowLeft -= dt; }
}

export class Tower {
  constructor(type, col, row, tileSize) {
    const t = TOWER_TYPES[type];
    if (!t) throw new Error(`Unknown tower type: ${type}`);
    Object.assign(this, { type, col, row, ...t });
    this.x = (col + 0.5) * tileSize;
    this.y = (row + 0.5) * tileSize;
    this.timer = 0;
    this.level = 1;
    this.invested = t.cost;
  }

  get maxed() { return this.level >= MAX_LEVEL; }
  get upgradeCost() { return this.maxed ? null : Math.round(TOWER_TYPES[this.type].cost * 0.8 * this.level); }
  get sellValue() { return Math.floor(this.invested * SELL_RATIO); }

  /** Raises damage and range by one level. Gold is handled by the game. */
  levelUp() {
    this.level += 1;
    this.damage = Math.round(this.damage * 1.5);
    this.range = Math.round(this.range * 1.1);
    if (this.splash) this.splash = Math.round(this.splash * 1.1);
  }
}
