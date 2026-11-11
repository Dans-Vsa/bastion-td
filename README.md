# Bastion TD

A dependency-free tower defense game for the browser, built with vanilla JavaScript and the Canvas API.
The game logic is kept separate from rendering so it can be unit-tested with Node's built-in test runner.

> Status: **work in progress** (milestone 1 of 4)

## Features

- [x] Waypoint-based enemy path with tile blocking
- [x] Enemies walking the path, base lives, game over
- [x] Arrow tower placement (gold cost, tile validation)
- [x] Auto-targeting towers (furthest enemy in range) and gold rewards
- [x] Canvas renderer with hover preview and health bars
- [ ] Waves and a wave timer
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

Then open http://localhost:5173. Click a free tile to build a tower, press Space to spawn a grunt.

## Project structure

```
index.html        page shell
style.css         styles
src/path.js       waypoint path math
src/entities.js   tower / enemy definitions
src/game.js       game state and rules (no DOM)
src/main.js       canvas rendering and input
scripts/serve.js  tiny static dev server
test/             unit tests
```

## License

MIT
