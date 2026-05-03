#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const HOST = process.env.TERRAIT_HOST || '127.0.0.1';
const argPort = Number(process.argv[2]);
const PORT = Number.isFinite(argPort) && argPort > 0 ? argPort : Number(process.env.TERRAIT_PORT || 8080);

const MIME_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.obj': 'model/obj; charset=utf-8',
  '.mtl': 'text/plain; charset=utf-8',
  '.stl': 'model/stl',
  '.fbx': 'application/octet-stream',
  '.terrait': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
});

function safeResolve(requestUrl) {
  const parsedUrl = new URL(requestUrl, `http://${HOST}:${PORT}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const filePath = path.resolve(ROOT_DIR, `.${pathname}`);
  if (!filePath.startsWith(ROOT_DIR)) return null;
  return filePath;
}

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    send(res, 405, 'Method not allowed', { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  const filePath = safeResolve(req.url);
  if (!filePath) {
    send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }

    const mimeType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': stat.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log('TERRAit Static Web V1.1.8 local server');
  console.log(`Serving: ${ROOT_DIR}`);
  console.log(`Open: http://${HOST}:${PORT}/`);
});

server.on('error', (error) => {
  console.error(`Local server failed: ${error.message}`);
  process.exit(1);
});

// sksdesign © 2026
