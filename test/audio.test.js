import test from 'node:test';
import assert from 'node:assert/strict';
import { Sound, SOUNDS, THROTTLE, soundFor } from '../src/audio.js';

class FakeParam { setValueAtTime() {} exponentialRampToValueAtTime() {} }
class FakeNode {
  constructor(log) { this.log = log; this.frequency = new FakeParam(); this.gain = new FakeParam(); }
  connect(next) { return next; }
  start() { this.log.push(this.type); }
  stop() {}
}
class FakeAudioContext {
  constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; this.started = []; }
  resume() { this.state = 'running'; }
  createOscillator() { return new FakeNode(this.started); }
  createGain() { return new FakeNode([]); }
}

test('maps events to sounds', () => {
  assert.equal(soundFor({ type: 'shot', tower: 'frost' }), 'shot:frost');
  assert.equal(soundFor({ type: 'kill' }), 'kill');
  assert.equal(soundFor({ type: 'nothing' }), null);
  for (const t of ['arrow', 'frost', 'cannon']) assert.ok(SOUNDS[`shot:${t}`]);
});

test('stays silent until unlocked, then plays and resumes the context', () => {
  const s = new Sound({ AudioContextClass: FakeAudioContext });
  assert.equal(s.play('kill'), false);
  s.unlock();
  assert.equal(s.ctx.state, 'running');
  assert.equal(s.play('kill'), true);
  assert.deepEqual(s.ctx.started, ['triangle']);
});

test('throttles repeats of the same sound and respects mute', () => {
  const s = new Sound({ AudioContextClass: FakeAudioContext });
  s.unlock();
  assert.equal(s.play('shot:arrow'), true);
  assert.equal(s.play('shot:arrow'), false);
  assert.equal(s.play('kill'), true, 'other sounds are not throttled');
  s.ctx.currentTime = THROTTLE + 0.01;
  assert.equal(s.play('shot:arrow'), true);
  assert.equal(s.toggle(), true);
  s.ctx.currentTime = 1;
  assert.equal(s.play('kill'), false);
  s.fromEvents([{ type: 'leak' }]);
  assert.equal(s.ctx.started.length, 3);
});

test('is a no-op without WebAudio', () => {
  const s = new Sound({ AudioContextClass: undefined });
  assert.equal(s.available, false);
  s.unlock();
  s.fromEvents([{ type: 'kill' }]);
  assert.equal(s.play('kill'), false);
});
