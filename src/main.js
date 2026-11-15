import { Game, TILE, COLS, ROWS } from './game.js';
import { ENEMY_TYPES, TOWER_TYPES } from './entities.js';
import { Effects, progress } from './effects.js';
import { Sound } from './audio.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const el = { gold: $('gold'), lives: $('lives'), wave: $('wave'), kills: $('kills'), status: $('status') };
const startBtn = $('start');
const speedBtn = $('speed');
const game = new Game();
const effects = new Effects();
const sound = new Sound({ muted: loadMuted() });
const muteBtn = $('mute');
let hover = null;
let speed = 1;
let pick = 'arrow';
let selected = null;
const picks = Object.fromEntries(Object.keys(TOWER_TYPES).map((k) => [k, $(`pick-${k}`)]));
const selPanel = $('selection');
const upgradeBtn = $('upgrade');
const sellBtn = $('sell');

canvas.addEventListener('mousemove', (ev) => { hover = tileAt(ev); });
canvas.addEventListener('mouseleave', () => { hover = null; });
canvas.addEventListener('click', (ev) => {
  const t = tileAt(ev);
  const existing = game.towerAt(t.col, t.row);
  if (existing) { selected = existing; return; }
  selected = null;
  game.placeTower(pick, t.col, t.row);
});
for (const [type, btn] of Object.entries(picks)) btn.addEventListener('click', () => choose(type));
upgradeBtn.addEventListener('click', () => { if (selected) game.upgradeTower(selected); });
sellBtn.addEventListener('click', () => { if (selected) { game.sellTower(selected); selected = null; } });

function choose(type) {
  pick = type;
  selected = null;
  for (const [k, btn] of Object.entries(picks)) btn.setAttribute('aria-pressed', String(k === type));
}
startBtn.addEventListener('click', () => game.startWave());
$('restart').addEventListener('click', restart);
function restart() { game.reset(); effects.clear(); selected = null; }

// Browsers only start audio after a user gesture, so unlock it on the first click or key press.
window.addEventListener('pointerdown', () => sound.unlock());
muteBtn.addEventListener('click', toggleMute);
function toggleMute() {
  sound.toggle();
  saveMuted(sound.muted);
  renderMute();
}
function renderMute() {
  muteBtn.textContent = sound.muted ? 'Sound off' : 'Sound on';
  muteBtn.setAttribute('aria-pressed', String(!sound.muted));
}
function loadMuted() {
  try { return window.localStorage?.getItem('bastion-td:muted') === '1'; } catch { return false; }
}
function saveMuted(muted) {
  try { window.localStorage?.setItem('bastion-td:muted', muted ? '1' : '0'); } catch { /* storage blocked */ }
}
renderMute();
speedBtn.addEventListener('click', () => {
  speed = speed === 1 ? 2 : 1;
  speedBtn.textContent = `${speed}x`;
});
window.addEventListener('keydown', (ev) => {
  sound.unlock();
  if (ev.target instanceof HTMLButtonElement) return; // let Space/Enter activate the focused button
  if (ev.code === 'Space') { ev.preventDefault(); game.startWave(); }
  if (ev.code === 'KeyR') restart();
  const n = Number(ev.code.replace('Digit', ''));
  if (n >= 1 && n <= Object.keys(picks).length) choose(Object.keys(picks)[n - 1]);
  if (ev.code === 'Escape') selected = null;
  if (ev.code === 'KeyM') toggleMute();
});

function tileAt(ev) {
  const r = canvas.getBoundingClientRect();
  const x = ((ev.clientX - r.left) / r.width) * canvas.width;
  const y = ((ev.clientY - r.top) / r.height) * canvas.height;
  return { col: Math.floor(x / TILE), row: Math.floor(y / TILE) };
}

/** Text for the status tile and the start button, derived from the wave state. */
function hudStatus() {
  const w = game.waves;
  if (game.over) return { status: `Defeated on wave ${game.wave}`, button: 'Start wave', canStart: false };
  if (w.state === 'waiting') {
    if (w.countdown === null) return { status: 'Build, then start', button: 'Start wave', canStart: true };
    const s = Math.ceil(w.countdown);
    return { status: `Next wave in ${s}s`, button: `Call early +${Math.floor(w.countdown)}`, canStart: true };
  }
  const left = w.toSpawn + game.enemies.length;
  return { status: `${left} ${left === 1 ? 'enemy' : 'enemies'} left`, button: 'Wave running', canStart: false };
}

function setText(node, value) {
  const text = String(value);
  if (node.textContent !== text) node.textContent = text;
}

function drawSelection() {
  if (selected && !game.towers.includes(selected)) selected = null;
  selPanel.hidden = !selected;
  if (!selected) return;
  const t = selected;
  setText($('sel-info'), `${t.name} L${t.level} · dmg ${t.damage} · range ${t.range}`);
  setText(upgradeBtn, t.maxed ? 'Max level' : `Upgrade ${t.upgradeCost}`);
  upgradeBtn.disabled = t.maxed || game.gold < t.upgradeCost || game.over;
  setText(sellBtn, `Sell +${t.sellValue}`);
}

function drawHud() {
  const h = hudStatus();
  setText(el.gold, game.gold);
  setText(el.lives, Math.max(0, game.lives));
  setText(el.wave, game.wave);
  setText(el.kills, game.kills);
  setText(el.status, h.status);
  setText(startBtn, h.button);
  startBtn.disabled = !h.canStart;
}

function drawEffects() {
  for (const fx of effects.items) {
    const k = progress(fx);
    ctx.globalAlpha = 1 - k;
    if (fx.kind === 'beam') {
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx.x1, fx.y1);
      ctx.lineTo(fx.x2, fx.y2);
      ctx.stroke();
    } else if (fx.kind === 'splash' || fx.kind === 'burst') {
      ctx.strokeStyle = fx.kind === 'splash' ? '#fb923c' : '#f7f8f8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius * (0.4 + 0.6 * k), 0, Math.PI * 2);
      ctx.stroke();
    } else if (fx.kind === 'text') {
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      ctx.font = '600 14px system-ui';
      ctx.fillText(fx.text, fx.x, fx.y - 24 * k);
    } else if (fx.kind === 'flash') {
      ctx.fillStyle = 'rgba(248, 113, 113, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#23252a';
  for (const key of game.pathTiles) {
    const [c, r] = key.split(',').map(Number);
    ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
  }
  if (hover && !game.over && game.canPlace(hover.col, hover.row)) {
    ctx.fillStyle = 'rgba(94, 106, 210, 0.3)';
    ctx.fillRect(hover.col * TILE, hover.row * TILE, TILE, TILE);
    ctx.strokeStyle = 'rgba(94, 106, 210, 0.6)';
    ctx.beginPath();
    ctx.arc((hover.col + 0.5) * TILE, (hover.row + 0.5) * TILE, TOWER_TYPES[pick].range, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (selected) {
    ctx.strokeStyle = 'rgba(247, 248, 248, 0.5)';
    ctx.beginPath();
    ctx.arc(selected.x, selected.y, selected.range, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const t of game.towers) {
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(t.x, t.y, TILE * (0.28 + 0.05 * t.level), 0, Math.PI * 2);
    ctx.fill();
  }
  for (const e of game.enemies) {
    const p = game.enemyPos(e);
    ctx.fillStyle = ENEMY_TYPES[e.type].color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#010102';
    ctx.fillRect(p.x - 12, p.y - 20, 24, 4);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(p.x - 12, p.y - 20, 24 * Math.max(0, e.hp / e.maxHp), 4);
  }
  drawEffects();
  if (game.over) {
    ctx.fillStyle = 'rgba(1, 1, 2, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f7f8f8';
    ctx.textAlign = 'center';
    ctx.font = '600 40px system-ui';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 8);
    ctx.fillStyle = '#8a8f98';
    ctx.font = '16px system-ui';
    ctx.fillText(`Reached wave ${game.wave} with ${game.kills} kills. Press R to restart.`, canvas.width / 2, canvas.height / 2 + 28);
  }
  drawHud();
  drawSelection();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  for (let i = 0; i < speed; i++) game.update(dt);
  const events = game.drainEvents();
  effects.fromEvents(events);
  sound.fromEvents(events);
  effects.update(dt * speed);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
console.assert(COLS * TILE === canvas.width && ROWS * TILE === canvas.height, 'canvas size mismatch');
window.__game = game; // handy for poking at the state from the console
