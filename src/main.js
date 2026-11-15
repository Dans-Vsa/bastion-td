import { Game, TILE, COLS, ROWS } from './game.js';
import { ENEMY_TYPES, TOWER_TYPES } from './entities.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const el = { gold: $('gold'), lives: $('lives'), wave: $('wave'), kills: $('kills'), status: $('status') };
const startBtn = $('start');
const speedBtn = $('speed');
const game = new Game();
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
function restart() { game.reset(); selected = null; }
speedBtn.addEventListener('click', () => {
  speed = speed === 1 ? 2 : 1;
  speedBtn.textContent = `${speed}x`;
});
window.addEventListener('keydown', (ev) => {
  if (ev.target instanceof HTMLButtonElement) return; // let Space/Enter activate the focused button
  if (ev.code === 'Space') { ev.preventDefault(); game.startWave(); }
  if (ev.code === 'KeyR') restart();
  const n = Number(ev.code.replace('Digit', ''));
  if (n >= 1 && n <= Object.keys(picks).length) choose(Object.keys(picks)[n - 1]);
  if (ev.code === 'Escape') selected = null;
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
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
console.assert(COLS * TILE === canvas.width && ROWS * TILE === canvas.height, 'canvas size mismatch');
window.__game = game; // handy for poking at the state from the console
