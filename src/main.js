import { Game, TILE, COLS, ROWS } from './game.js';
import { ENEMY_TYPES } from './entities.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const el = { gold: $('gold'), lives: $('lives'), wave: $('wave'), kills: $('kills'), status: $('status') };
const startBtn = $('start');
const speedBtn = $('speed');
const game = new Game();
let hover = null;
let speed = 1;

canvas.addEventListener('mousemove', (ev) => { hover = tileAt(ev); });
canvas.addEventListener('mouseleave', () => { hover = null; });
canvas.addEventListener('click', (ev) => {
  const t = tileAt(ev);
  game.placeTower('arrow', t.col, t.row);
});
startBtn.addEventListener('click', () => game.startWave());
$('restart').addEventListener('click', () => game.reset());
speedBtn.addEventListener('click', () => {
  speed = speed === 1 ? 2 : 1;
  speedBtn.textContent = `${speed}x`;
});
window.addEventListener('keydown', (ev) => {
  if (ev.target instanceof HTMLButtonElement) return; // let Space/Enter activate the focused button
  if (ev.code === 'Space') { ev.preventDefault(); game.startWave(); }
  if (ev.code === 'KeyR') game.reset();
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
  return { status: `${w.toSpawn + game.enemies.length} enemies left`, button: 'Wave running', canStart: false };
}

function setText(node, value) {
  const text = String(value);
  if (node.textContent !== text) node.textContent = text;
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
  }
  for (const t of game.towers) {
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(t.x, t.y, TILE * 0.35, 0, Math.PI * 2);
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
