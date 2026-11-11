// Tiny static file server so ES modules work (file:// blocks them).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const port = Number(process.env.PORT) || 5173;

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const rel = normalize(url.pathname === '/' ? '/index.html' : url.pathname);
  if (rel.includes('..')) { res.writeHead(403).end(); return; }
  try {
    const data = await readFile(join(root, rel));
    res.writeHead(200, { 'Content-Type': types[extname(rel)] || 'application/octet-stream' }).end(data);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`Bastion TD running at http://localhost:${port}`));
