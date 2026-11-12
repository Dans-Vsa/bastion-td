# Bastion TD

A dependency-free tower defense game for the browser, built with vanilla JavaScript and the Canvas API.
The game logic is kept separate from rendering so it can be unit-tested with Node's built-in test runner.

> Status: **work in progress** (milestone 2 of 4)

## Features

- [x] Waypoint-based enemy path with tile blocking
- [x] Enemies walking the path, base lives, game over
- [x] Arrow tower placement (gold cost, tile validation)
- [x] Auto-targeting towers (furthest enemy in range) and gold rewards
- [x] Canvas renderer with hover preview and health bars
- [x] Waves with a scaling difficulty curve (more, faster-spawning, tougher enemies)
- [x] Wave timer: auto-start countdown between waves, early-call gold bonus, wave clear bonus
- [x] HUD (gold, lives, wave, kills, status), start / call-early button, 2x speed, restart
- [ ] More tower and enemy types, upgrades
- [ ] Sound, polish, GitHub Actions CI, v1.0.0

## Tech stack

Vanilla JS (ES modules), HTML5 Canvas, Node.js `node:test` for tests. No runtime dependencies.

## Getting started

Requires Node.js 20+.

```bash
npm test
npm start
```

Then open http://localhost:5173.

## How to play

- Click a free tile to build an Arrow Tower (50 gold). Towers cannot be built on the road.
- Press **Start wave** (or `Space`) to send the first wave. Every enemy that reaches the end costs one life.
- Clearing a wave pays a bonus and starts a 10 second countdown to the next one.
  Calling the next wave early pays 1 gold per second skipped.
- Toggle **1x / 2x** to speed the game up, and **Restart** (or `R`) to start over.

## Project structure

```
index.html        page shell
style.css         styles
src/path.js       waypoint path math
src/entities.js   tower / enemy definitions
src/waves.js      wave difficulty curve and wave state machine
src/game.js       game state and rules (no DOM)
src/main.js       canvas rendering, HUD and input
scripts/serve.js  tiny static dev server
test/             unit tests + a fake-DOM smoke test of the page
```

## License

MIT
