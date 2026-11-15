// Short-lived visual effects (shot tracers, explosions, floating gold text).
// Pure data so it can be tested without a canvas; src/main.js draws them.

export const LIFETIMES = { beam: 0.08, splash: 0.3, burst: 0.4, text: 0.9, flash: 0.35 };

const SHOT_COLORS = { arrow: '#4ade80', frost: '#60a5fa', cannon: '#fb923c' };

export class Effects {
  constructor({ max = 300 } = {}) {
    this.max = max;
    this.items = [];
  }

  add(kind, data) {
    const life = LIFETIMES[kind];
    if (life === undefined) throw new Error(`Unknown effect: ${kind}`);
    this.items.push({ kind, age: 0, life, ...data });
    if (this.items.length > this.max) this.items.splice(0, this.items.length - this.max);
  }

  /** Turns game events (see Game#drainEvents) into effects. */
  fromEvents(events) {
    for (const ev of events) {
      if (ev.type === 'shot') {
        this.add('beam', { x1: ev.x1, y1: ev.y1, x2: ev.x2, y2: ev.y2, color: SHOT_COLORS[ev.tower] ?? '#f7f8f8' });
        if (ev.splash) this.add('splash', { x: ev.x2, y: ev.y2, radius: ev.splash });
      } else if (ev.type === 'kill') {
        this.add('burst', { x: ev.x, y: ev.y, radius: 22 });
        this.add('text', { x: ev.x, y: ev.y - 14, text: `+${ev.gold}` });
      } else if (ev.type === 'sell') {
        this.add('text', { x: ev.x, y: ev.y - 14, text: `+${ev.gold}` });
      } else if (ev.type === 'leak') {
        this.add('flash', {});
      }
    }
  }

  update(dt) {
    for (const fx of this.items) fx.age += dt;
    this.items = this.items.filter((fx) => fx.age < fx.life);
  }

  clear() { this.items = []; }
}

/** 0 at birth, 1 at death. */
export function progress(fx) { return Math.min(1, fx.age / fx.life); }
