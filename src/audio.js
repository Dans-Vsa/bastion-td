// Tiny WebAudio synth: every sound is a short oscillator blip, so no audio files are needed.
// The AudioContext is created lazily (browsers only allow it after a user gesture)
// and everything becomes a no-op when WebAudio is not available.

export const SOUNDS = {
  'shot:arrow': { wave: 'triangle', from: 880, to: 660, time: 0.06, gain: 0.05 },
  'shot:frost': { wave: 'sine', from: 1320, to: 990, time: 0.09, gain: 0.04 },
  'shot:cannon': { wave: 'square', from: 140, to: 60, time: 0.18, gain: 0.07 },
  kill: { wave: 'triangle', from: 520, to: 1040, time: 0.08, gain: 0.05 },
  leak: { wave: 'sawtooth', from: 220, to: 110, time: 0.25, gain: 0.07 },
  build: { wave: 'sine', from: 440, to: 660, time: 0.1, gain: 0.06 },
  upgrade: { wave: 'sine', from: 660, to: 1320, time: 0.15, gain: 0.06 },
  sell: { wave: 'triangle', from: 660, to: 330, time: 0.12, gain: 0.06 },
  wave: { wave: 'square', from: 330, to: 495, time: 0.22, gain: 0.04 },
  clear: { wave: 'triangle', from: 495, to: 990, time: 0.3, gain: 0.05 },
  gameover: { wave: 'sawtooth', from: 330, to: 55, time: 0.9, gain: 0.07 },
};

/** Minimum seconds between two plays of the same sound, so fast towers don't buzz. */
export const THROTTLE = 0.05;

/** Maps a game event to a sound name, or null if it is silent. */
export function soundFor(ev) {
  if (ev.type === 'shot') return `shot:${ev.tower}`;
  return ev.type in SOUNDS ? ev.type : null;
}

export class Sound {
  constructor({ AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext, muted = false } = {}) {
    this.AudioContextClass = AudioContextClass;
    this.muted = muted;
    this.ctx = null;
    this.lastPlayed = {};
  }

  get available() { return typeof this.AudioContextClass === 'function'; }

  toggle() { this.muted = !this.muted; return this.muted; }

  /** Creates or resumes the AudioContext; call it from a click or key handler. */
  unlock() {
    if (!this.available) return;
    if (!this.ctx) this.ctx = new this.AudioContextClass();
    if (this.ctx.state === 'suspended') this.ctx.resume?.();
  }

  /** Plays a sound by name. Returns true if a sound was actually scheduled. */
  play(name) {
    const spec = SOUNDS[name];
    if (!spec || this.muted || !this.ctx) return false;
    const now = this.ctx.currentTime;
    if (now - (this.lastPlayed[name] ?? -Infinity) < THROTTLE) return false;
    this.lastPlayed[name] = now;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = spec.wave;
    osc.frequency.setValueAtTime(spec.from, now);
    osc.frequency.exponentialRampToValueAtTime(spec.to, now + spec.time);
    gain.gain.setValueAtTime(spec.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + spec.time);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + spec.time + 0.02);
    return true;
  }

  fromEvents(events) {
    for (const ev of events) {
      const name = soundFor(ev);
      if (name) this.play(name);
    }
  }
}
