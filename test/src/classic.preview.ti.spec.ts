import http from 'node:http';
import net from 'node:net';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { randomUUID } from 'node:crypto';

const { available } = require('../../scripts/ports.cjs') as {
  available: (port: number) => Promise<void>;
};

const { createPreviewServer } =
  require('../../scripts/classic-preview.cjs') as {
    createPreviewServer: (options: {
      directory: string;
      apiOrigin: string;
    }) => http.Server;
  };

describe('Shared classic preview gateway', () => {
  let folder: string;
  let api: http.Server;
  let preview: http.Server;
  let calls: { path: string; method: string; body: string; cookie?: string }[];
  beforeAll(async () => {
    folder = await mkdtemp(path.join(os.tmpdir(), 'mtgdle-preview-'));
    await mkdir(path.join(folder, 'public/assets'), { recursive: true });
    await writeFile(
      path.join(folder, 'public/index.html'),
      '<html>MTGdle</html>',
    );
    await writeFile(
      path.join(folder, 'public/assets/game.js'),
      'console.log("MTGdle");',
    );
    await writeFile(
      path.join(folder, 'private.js'),
      'secret outside the web root',
    );
    await writeFile(path.join(folder, 'public/private.map'), 'source map');
    api = http.createServer(async (req, res) => {
      let body = '';
      for await (const chunk of req) body += chunk;
      calls.push({
        path: req.url!,
        method: req.method!,
        body,
        cookie: req.headers.cookie,
      });
      const session = req.headers.cookie || `mtgdle_session=${randomUUID()}`;
      res.setHeader(
        'Set-Cookie',
        `${session}; HttpOnly; SameSite=Lax; Path=/${req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`,
      );
      if (req.url?.endsWith('/art')) {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(Buffer.from([137, 80, 78, 71]));
      } else if (req.url?.endsWith('/hint')) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ code: 'errorHint' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ session }));
      }
    });
    api.listen(0, '127.0.0.1');
    await once(api, 'listening');
    preview = createPreviewServer({
      directory: path.join(folder, 'public'),
      apiOrigin: `http://127.0.0.1:${(api.address() as import('node:net').AddressInfo).port}`,
    });
  });
  beforeEach(() => {
    calls = [];
  });
  it('detects occupied IPv4 and IPv6 ports without interrupting their owners', async () => {
    await expect(
      available((api.address() as import('node:net').AddressInfo).port),
    ).rejects.toThrow('déjà occupé');
    const ipv6 = net.createServer();
    ipv6.listen(0, '::1');
    await once(ipv6, 'listening');
    try {
      await expect(
        available((ipv6.address() as import('node:net').AddressInfo).port),
      ).rejects.toThrow('déjà occupé');
      expect(ipv6.listening).toBe(true);
    } finally {
      await new Promise<void>((resolve) => ipv6.close(() => resolve()));
    }
    expect(api.listening).toBe(true);
  });
  afterAll(async () => {
    await Promise.all([
      new Promise<void>((resolve) => api.close(() => resolve())),
      new Promise<void>((resolve) => preview.close(() => resolve())),
    ]);
    await rm(folder, { recursive: true, force: true });
  });
  it('serves built files and HEAD requests without exposing source maps or files outside the web root', async () => {
    await request(preview)
      .get('/')
      .expect(200)
      .expect('Content-Type', /text\/html/);
    await request(preview)
      .get('/assets/game.js')
      .expect(200)
      .expect('Content-Type', /javascript/);
    const head = await request(preview).head('/assets/game.js').expect(200);
    expect(head.text).toBeUndefined();
    for (const url of [
      '/%2e%2e%5cprivate.js',
      '/.env',
      '/private.map',
      '/@fs/package.json',
      '/src/app.tsx',
      '/health',
    ]) {
      await request(preview).get(url).expect(404);
    }
    expect(calls).toHaveLength(0);
  });
  it('forwards anonymous cookies and preserves Secure over the HTTPS tunnel', async () => {
    const first = await request(preview)
      .get('/api/classic/today')
      .set('X-Forwarded-Proto', 'https')
      .expect(200)
      .expect('Cache-Control', 'no-store');
    const cookie = String(first.headers['set-cookie'][0]);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    const second = await request(preview)
      .get('/api/classic/today')
      .set('Cookie', cookie.split(';')[0])
      .expect(200);
    expect(second.body.session).toBe(first.body.session);
    const other = await request(preview).get('/api/classic/today').expect(200);
    expect(other.body.session).not.toBe(first.body.session);
    expect(calls.every((c) => c.path === '/classic/today')).toBe(true);
  });
  it('forwards guess payloads, error codes, abandonment and image bytes through the same origin', async () => {
    const body = { cardId: randomUUID(), requestId: randomUUID() };
    await request(preview)
      .post('/api/classic/2026-10-29/guesses')
      .send(body)
      .expect(200);
    expect(JSON.parse(calls[0].body)).toEqual(body);
    const hint = await request(preview)
      .post('/api/classic/2026-10-29/hint')
      .send({ kind: 'art' })
      .expect(409);
    expect(hint.body.code).toBe('errorHint');
    await request(preview)
      .post('/api/classic/2026-10-29/abandon')
      .send({})
      .expect(200);
    const image = await request(preview)
      .get('/api/classic/2026-10-29/art')
      .expect(200)
      .expect('Content-Type', 'image/png')
      .expect('Cache-Control', 'no-store');
    expect(image.body).toEqual(Buffer.from([137, 80, 78, 71]));
  });
  it('rejects admin routes, unexpected methods and oversized bodies before reaching the API', async () => {
    for (const url of [
      '/api/api',
      '/api/game/today',
      '/api/playable-cards',
      '/api/health',
      '/api/classic/today/extra',
    ]) {
      await request(preview).get(url).expect(404);
      await request(preview).post(url).send({}).expect(404);
    }
    await request(preview).post('/api/classic/today').send({}).expect(404);
    await request(preview)
      .delete('/api/classic/2026-10-29/guesses')
      .expect(404);
    await request(preview)
      .post('/api/classic/2026-10-29/guesses')
      .send({ value: 'x'.repeat(20000) })
      .expect(413);
    expect(calls).toHaveLength(0);
  });
  it('returns a controlled error if the API is unavailable', async () => {
    const unavailable = createPreviewServer({
      directory: path.join(folder, 'public'),
      apiOrigin: 'http://127.0.0.1:1',
    });
    try {
      await request(unavailable)
        .get('/api/classic/today')
        .expect(502)
        .expect({ message: 'Game API unavailable' });
    } finally {
      await new Promise<void>((resolve) => unavailable.close(() => resolve()));
    }
  });
});
