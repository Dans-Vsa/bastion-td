export const TOWER_TYPES = {
  arrow: { name: 'Arrow Tower', cost: 50, range: 120, damage: 12, cooldown: 0.6, color: '#4ade80' },
};

export const ENEMY_TYPES = {
  grunt: { name: 'Grunt', hp: 40, speed: 60, reward: 5, color: '#f87171' },
};

export class Enemy {
  constructor(type = 'grunt') {
    const t = ENEMY_TYPES[type];
    if (!t) throw new Error(`Unknown enemy type: ${type}`);
    this.type = type;
    this.maxHp = this.hp = t.hp;
    this.speed = t.speed;
    this.reward = t.reward;
    this.distance = 0;
    this.alive = true;
    this.reachedBase = false;
  }
}

export class Tower {
  constructor(type, col, row, tileSize) {
    const t = TOWER_TYPES[type];
    if (!t) throw new Error(`Unknown tower type: ${type}`);
    Object.assign(this, { type, col, row, ...t });
    this.x = (col + 0.5) * tileSize;
    this.y = (row + 0.5) * tileSize;
    this.timer = 0;
  }
}
