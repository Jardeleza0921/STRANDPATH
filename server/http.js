import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf'
};

const MAX_BODY = 1024 * 512;

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.expose = true;
    Object.assign(this, extra);
  }
}

export async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new HttpError(413, 'Request body is too large');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON');
  }
}

export function sendJson(res, status, payload, extraHeaders = {}) {
  if (res.writableEnded) return;
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(body);
}

export function sendError(res, error) {
  const status = error?.status && error.status >= 400 && error.status < 600 ? error.status : 500;
  const expose = error?.expose === true || status < 500;
  if (!expose) console.error('[api]', error);
  sendJson(res, status, {
    error: error?.code ?? (status >= 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR'),
    message: expose ? error.message : 'Something went wrong on the server.',
    ...(error?.missing ? { missing: error.missing } : {})
  });
}

export function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
  );
}

export function serveStatic(req, res, distDir) {
  const url = new URL(req.url, 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    res.end('Bad request');
    return true;
  }
  if (pathname === '/api' || pathname.startsWith('/api/')) return false;
  if (!existsSync(distDir)) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('The application has not been built yet. Run "npm run build", then restart the server.');
    return true;
  }

  const root = resolve(distDir);
  const candidate = resolve(join(root, normalize(pathname)));
  if (candidate !== root && !candidate.startsWith(root + sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return true;
  }

  let file = candidate;
  if (!existsSync(file) || statSync(file).isDirectory()) {
    const index = join(root, 'index.html');
    if (!existsSync(index)) {
      res.writeHead(404);
      res.end('Not found');
      return true;
    }
    file = index;
  }

  const ext = extname(file).toLowerCase();
  const type = MIME[ext] ?? 'application/octet-stream';
  const isHtml = ext === '.html';
  const body = readFileSync(file);
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': body.length,
    'Cache-Control': isHtml ? 'no-store' : 'public, max-age=3600'
  });
  res.end(req.method === 'HEAD' ? undefined : body);
  return true;
}
