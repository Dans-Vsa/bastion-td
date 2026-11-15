# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-15

### Added
- Sound effects synthesised with WebAudio (no audio files): per-tower shots, kills, leaks, building, upgrading, selling, waves and game over.
- Sound toggle button and `M` shortcut; the choice is remembered in `localStorage` when available.
- Visual effects: shot tracers, cannon splash rings, kill bursts, floating gold text and a red flash when an enemy leaks.
- Game event queue (`Game#emit` / `Game#drainEvents`) that keeps the rules free of DOM, audio and canvas code.
- GitHub Actions CI running the test suite on Node.js 20 and 22.

### Fixed
- The selected-tower info text used a non-UTF-8 separator byte that showed up as a replacement character in browsers.

## [0.3.0] - 2026-11-14

### Added
- Frost (slow) and Cannon (splash) towers; Runner and Tank enemies mixed into later waves.
- Tower upgrades up to level 3, selling for a 70% refund, range preview rings, build menu with `1`/`2`/`3` shortcuts.

## [0.2.0] - 2026-11-13

### Added
- Wave system with a difficulty curve, auto-start countdown, early-call gold bonus and wave clear bonus.
- HUD (gold, lives, wave, kills, status), start / call-early button, 2x speed and restart.

## [0.1.0] - 2026-11-12

### Added
- Waypoint path, enemies, arrow tower placement and targeting, lives and game over.
- Canvas renderer with hover preview and health bars, static dev server, unit tests.

[1.0.0]: https://github.com/Dans-Vsa/bastion-td/releases/tag/v1.0.0
