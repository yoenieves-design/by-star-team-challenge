import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const assets = { '/': ['dist/index.html', 'text/html'], '/index.html': ['dist/index.html', 'text/html'], '/app.js': ['dist/app.js', 'text/javascript'], '/styles.css': ['dist/styles.css', 'text/css'] };
createServer(async (request, response) => {
  const asset = assets[new URL(request.url, 'http://localhost').pathname];
  if (!asset) { response.writeHead(404); response.end('Not found'); return; }
  try { const body = await readFile(asset[0]); response.writeHead(200, { 'Content-Type': `${asset[1]}; charset=utf-8`, 'Cache-Control': 'no-store' }); response.end(body); }
  catch { response.writeHead(503); response.end('Run npm run build first.'); }
}).listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));
