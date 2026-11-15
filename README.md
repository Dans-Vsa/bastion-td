# Bastion TD

[![CI](https://github.com/Dans-Vsa/bastion-td/actions/workflows/ci.yml/badge.svg)](https://github.com/Dans-Vsa/bastion-td/actions/workflows/ci.yml)

A dependency-free tower defense game for the browser, built with vanilla JavaScript and the Canvas API.
The game logic is kept separate from rendering so it can be unit-tested with Node's built-in test runner.

> Status: **v1.0.0** - feature complete. See the [CHANGELOG](CHANGELOG.md).

## Features

- [x] Waypoint-based enemy path with tile blocking
- [x] Enemies walking the path, base lives, game over
- [x] Arrow tower placement (gold cost, tile validation)
- [x] Auto-targeting towers (furthest enemy in range) and gold rewards
- [x] Canvas renderer with hover preview and health bars
- [x] Waves with a scaling difficulty curve (more, faster-spawning, tougher enemies)
- [x] Wave timer: auto-start countdown between waves, early-call gold bonus, wave clear bonus
- [x] HUD (gold, lives, wave, kills, status), start / call-early button, 2x speed, restart
- [x] Three tower types (Arrow, Frost slow, Cannon splash) and three enemy types (Grunt, Runner, Tank)
- [x] Tower upgrades (3 levels) and selling (70% refund), range preview rings
- [x] Sound effects synthesised with WebAudio (no audio files) and a remembered mute toggle
- [x] Visual effects: shot tracers, splash rings, kill bursts, floating gold, leak flash
- [x] GitHub Actions CI (Node.js 20 and 22) and a v1.0.0 release

## Tech stack

Vanilla JS (ES modules), HTML5 Canvas, Web Audio API, Node.js `node:test` for tests, GitHub Actions for CI. No runtime dependencies.

## Getting started

Requires Node.js 20+.

```bash
npm test
npm start
```

Then open http://localhost:5173.

## How to play

- Pick a tower with the build menu or keys `1`/`2`/`3`, then click a free tile. Towers cannot be built on the road.
  - **Arrow** (50): fast single-target shots. **Frost** (70): weak hits that slow enemies by 50%. **Cannon** (100): slow shots with splash damage.
  - Click a built tower to see its range, **Upgrade** it (up to level 3) or **Sell** it (70% of the gold invested).
  - Runners appear from wave 3 (fast, fragile) and tanks from wave 5 (slow, tough, big reward).
- Press **Start wave** (or `Space`) to send the first wave. Every enemy that reaches the end costs one life.
- Clearing a wave pays a bonus and starts a 10 second countdown to the next one.
  Calling the next wave early pays 1 gold per second skipped.
- Toggle **1x / 2x** to speed the game up, and **Restart** (or `R`) to start over.
- **Sound on / off** (or `M`) mutes the sound effects; the choice is remembered in the browser.

## Project structure

```
index.html        page shell
style.css         styles
src/path.js       waypoint path math
src/entities.js   tower / enemy definitions
src/waves.js      wave difficulty curve and wave state machine
src/game.js       game state and rules (no DOM), emits events for effects and sound
src/effects.js    short-lived visual effects built from game events
src/audio.js      WebAudio synth sound effects
src/main.js       canvas rendering, HUD and input
scripts/serve.js  tiny static dev server
test/             unit tests + a fake-DOM smoke test of the page
.github/workflows CI workflow
CHANGELOG.md      release notes
```

## Architecture

`Game` owns all the rules and never touches the DOM. Whenever something happens (a shot, a kill, a leak, a new wave)
it records an event; once per frame `src/main.js` drains the queue and hands the events to `Effects` (visuals) and
`Sound` (audio). This keeps the rules fully testable in Node, and the effects and sound are tested on their own with
fake timers and a fake `AudioContext`.

## Future ideas

- More maps and a map picker
- Saving high scores
- Touch-friendly controls for phones

## License

MIT - see [LICENSE](LICENSE).
