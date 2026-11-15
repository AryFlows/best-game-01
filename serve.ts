import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game/', import.meta.url)));
const portArg = process.argv.indexOf('--port');
const port = portArg >= 0 ? Number(process.argv[portArg + 1]) : 8080;
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
};

createServer((req, res) => {
  let path: string;
  try {
    path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    res.writeHead(400, { 'Cache-Control': 'no-store' }).end('Bad request');
    return;
  }
  let target = resolve(root, `.${path}`);
  if (target !== root && !target.startsWith(root + sep)) {
    res.writeHead(403, { 'Cache-Control': 'no-store' }).end('Forbidden');
    return;
  }
  try {
    if (statSync(target).isDirectory()) target = resolve(target, 'index.html');
    const size = statSync(target).size;
    res.writeHead(200, { 'Content-Type': mime[extname(target).toLowerCase()] ?? 'application/octet-stream', 'Content-Length': size, 'Cache-Control': 'no-store' });
    createReadStream(target).pipe(res);
  } catch {
    res.writeHead(404, { 'Cache-Control': 'no-store' }).end('Not found');
  }
}).listen(port, '127.0.0.1');
