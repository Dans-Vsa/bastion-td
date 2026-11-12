// Wave progression: how many enemies each wave has and when they spawn.

/** Difficulty curve for wave `n` (1-based). */
export function waveSpec(n) {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Invalid wave number: ${n}`);
  return {
    number: n,
    count: 4 + n * 2,
    interval: Math.max(0.35, 0.95 - n * 0.05),
    hpScale: 1 + (n - 1) * 0.25,
    bonus: 15 + n * 5,
  };
}

/**
 * State machine: waiting -> spawning -> fighting -> waiting ...
 * The first wave waits for the player; later waves auto-start after `delay` seconds.
 */
export class WaveManager {
  constructor({ delay = 10 } = {}) {
    this.delay = delay;
    this.number = 0;
    this.state = 'waiting';
    this.countdown = null; // seconds until auto-start, null = wait for the player
    this.spec = null;
    this.toSpawn = 0;
    this.spawnTimer = 0;
  }

  get canStart() { return this.state === 'waiting'; }

  /** Starts the next wave. Returns the countdown seconds that were skipped, or null if a wave is running. */
  start() {
    if (!this.canStart) return null;
    const skipped = Math.max(0, this.countdown ?? 0);
    this.number += 1;
    this.spec = waveSpec(this.number);
    this.toSpawn = this.spec.count;
    this.spawnTimer = 0;
    this.countdown = null;
    this.state = 'spawning';
    return skipped;
  }

  /** Advances the timers. `game` needs `spawn(type, hpScale)`, `enemies` and `gold`. */
  update(dt, game) {
    if (this.state === 'waiting') {
      if (this.countdown === null) return;
      this.countdown -= dt;
      if (this.countdown <= 0) this.start();
      return;
    }
    if (this.state === 'spawning') {
      this.spawnTimer -= dt;
      while (this.toSpawn > 0 && this.spawnTimer <= 0) {
        game.spawn('grunt', this.spec.hpScale);
        this.toSpawn -= 1;
        this.spawnTimer += this.spec.interval;
      }
      if (this.toSpawn === 0) this.state = 'fighting';
      return;
    }
    if (game.enemies.length === 0) {
      game.gold += this.spec.bonus;
      this.state = 'waiting';
      this.countdown = this.delay;
    }
  }
}
