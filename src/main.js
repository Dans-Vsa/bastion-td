import { Game, TILE, COLS, ROWS } from './game.js';
import { ENEMY_TYPES } from './entities.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const goldEl = document.getElementById('gold');
const livesEl = document.getElementById('lives');
const game = new Game();
let hover = null;

canvas.addEventListener('mousemove', (ev) => { hover = tileAt(ev); });
canvas.addEventListener('mouseleave', () => { hover = null; });
canvas.addEventListener('click', (ev) => {
  const t = tileAt(ev);
  game.placeTower('arrow', t.col, t.row);
});
window.addEventListener('keydown', (ev) => {
  if (ev.code === 'Space') { ev.preventDefault(); game.spawn('grunt'); }
});

function tileAt(ev) {
  const r = canvas.getBoundingClientRect();
  const x = ((ev.clientX - r.left) / r.width) * canvas.width;
  const y = ((ev.clientY - r.top) / r.height) * canvas.height;
  return { col: Math.floor(x / TILE), row: Math.floor(y / TILE) };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#334155';
  for (const key of game.pathTiles) {
    const [c, r] = key.split(',').map(Number);
    ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
  }
  if (hover && game.canPlace(hover.col, hover.row)) {
    ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
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
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(p.x - 12, p.y - 20, 24, 4);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(p.x - 12, p.y - 20, 24 * (e.hp / e.maxHp), 4);
  }
  if (game.over) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
  goldEl.textContent = game.gold;
  livesEl.textContent = Math.max(0, game.lives);
}

let last = performance.now();
function frame(now) {
  game.update(Math.min(0.05, (now - last) / 1000));
  last = now;
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
console.assert(COLS * TILE === canvas.width && ROWS * TILE === canvas.height, 'canvas size mismatch');
