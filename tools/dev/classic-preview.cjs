const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
function gameRoute(method, pathname) {
  return method === 'GET'
    ? /^\/api\/classic\/(today|\d{4}-\d{2}-\d{2}\/art)$/.test(pathname)
    : method === 'POST' &&
        /^\/api\/classic\/\d{4}-\d{2}-\d{2}\/(guesses|hint|abandon)$/.test(
          pathname,
        );
}
function reply(res, status, message) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify({ message }));
}
function createPreviewServer({ directory, apiOrigin }) {
  const root = path.resolve(directory);
  return http.createServer(
    { requestTimeout: 20000, headersTimeout: 10000 },
    async (req, res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'same-origin');
      try {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname.startsWith('/api')) {
          if (!gameRoute(req.method, url.pathname))
            return reply(res, 404, 'Not found');
          const chunks = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 16384) return reply(res, 413, 'Request too large');
            chunks.push(chunk);
          }
          const body = Buffer.concat(chunks);
          // Explicit target and headers: this cannot act as an arbitrary proxy.
          const upstream = http.request(
            new URL(url.pathname.slice(4) + url.search, apiOrigin),
            {
              method: req.method,
              headers: {
                accept: req.headers.accept || '*/*',
                'content-type':
                  req.headers['content-type'] || 'application/json',
                'content-length': body.length,
                ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}),
                'x-forwarded-proto':
                  req.headers['x-forwarded-proto'] === 'https'
                    ? 'https'
                    : 'http',
              },
              timeout: 15000,
            },
            (response) => {
              res.statusCode = response.statusCode;
              for (const name of ['content-type', 'set-cookie']) {
                if (response.headers[name])
                  res.setHeader(name, response.headers[name]);
              }
              res.setHeader('Cache-Control', 'no-store');
              response.on('error', () => res.destroy());
              response.pipe(res);
            },
          );
          upstream.on('timeout', () => upstream.destroy(new Error('Timeout')));
          upstream.on('error', () => {
            if (!res.headersSent) reply(res, 502, 'Game API unavailable');
            else res.destroy();
          });
          res.on('close', () => upstream.destroy());
          upstream.end(body);
          return;
        }
        if (!['GET', 'HEAD'].includes(req.method))
          return reply(res, 405, 'Method not allowed');
        const pathname = decodeURIComponent(url.pathname);
        const file = path.resolve(
          root,
          pathname === '/' ? 'index.html' : '.' + pathname,
        );
        const relative = path.relative(root, file);
        if (
          relative.startsWith('..') ||
          path.isAbsolute(relative) ||
          !mime[path.extname(file)] ||
          pathname.includes('\\')
        ) {
          return reply(res, 404, 'Not found');
        }
        const realFile = await fs.realpath(file);
        if (path.relative(root, realFile).startsWith('..'))
          return reply(res, 404, 'Not found');
        const data = await fs.readFile(realFile);
        res.writeHead(200, {
          'Content-Type': mime[path.extname(file)],
          'Cache-Control': 'no-cache',
        });
        res.end(req.method === 'HEAD' ? undefined : data);
      } catch (error) {
        if (!res.headersSent)
          reply(
            res,
            error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 400,
            'Not found',
          );
        else res.destroy();
      }
    },
  );
}
module.exports = { createPreviewServer, gameRoute };
