import { Test } from '@nestjs/testing';
import {
  ValidationPipe,
  ConflictException,
  type INestApplication,
} from '@nestjs/common';
import request from 'supertest';
import { ClassicController } from '../../packages/api/src/api/game/classic.controller';
import { ClassicStore } from '../../packages/api/src/api/game/classic.store';

describe('Classic HTTP session and validation', () => {
  let app: INestApplication;
  const state = jest.fn().mockResolvedValue({ status: 'playing', guesses: [] });
  const artSource = jest.fn();
  const act = jest.fn().mockResolvedValue({ status: 'playing', guesses: [] });
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ClassicController],
      providers: [
        { provide: ClassicStore, useValue: { state, act, artSource } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    state.mockClear();
    act.mockClear();
    artSource.mockReset();
  });

  it('creates an opaque HttpOnly session and reuses it for a valid guess', async () => {
    const initial = await request(app.getHttpServer())
      .get('/classic/today')
      .expect(200);
    const cookie = String(initial.headers['set-cookie'][0]);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(initial.headers['cache-control']).toBe('no-store');
    const session = state.mock.calls[0][0] as string;
    const cardId = '00000000-0000-4000-8000-000000000001';
    const requestId = '00000000-0000-4000-8000-000000000002';
    await request(app.getHttpServer())
      .post('/classic/2026-10-29/guesses')
      .set('Cookie', cookie.split(';')[0])
      .send({ cardId, requestId })
      .expect(201);
    expect(act).toHaveBeenCalledWith(
      '2026-10-29',
      session,
      'guess',
      cardId,
      requestId,
    );
  });
  it('rejects malformed proposals before invoking persistence', async () => {
    await request(app.getHttpServer())
      .post('/classic/2026-10-29/guesses')
      .send({ cardId: 'invalid' })
      .expect(400);
    expect(act).not.toHaveBeenCalled();
  });
  it('validates the requested hint kind', async () => {
    await request(app.getHttpServer())
      .post('/classic/2026-10-29/hint')
      .send({ kind: 'answer' })
      .expect(400);
    expect(act).not.toHaveBeenCalled();
    await request(app.getHttpServer())
      .post('/classic/2026-10-29/hint')
      .send({ kind: 'text' })
      .expect(201);
    expect(act.mock.calls[0][5]).toBe('text');
  });
  it('never downloads a locked illustration or an untrusted source', async () => {
    const download = jest.spyOn(globalThis, 'fetch');
    try {
      artSource.mockRejectedValueOnce(new ConflictException('Locked'));
      await request(app.getHttpServer())
        .get('/classic/2026-10-29/art')
        .expect(409);
      artSource.mockResolvedValueOnce(
        'https://example.invalid/art_crop/secret.jpg',
      );
      await request(app.getHttpServer())
        .get('/classic/2026-10-29/art')
        .expect(503);
      expect(download).not.toHaveBeenCalled();
    } finally {
      download.mockRestore();
    }
  });
  it('serves only image bytes, without revealing the source URL', async () => {
    artSource.mockResolvedValue(
      'https://cards.scryfall.io/art_crop/front/secret.jpg',
    );
    const download = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([255, 216, 255]), {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
      }),
    );
    try {
      const response = await request(app.getHttpServer())
        .get('/classic/2026-10-29/art')
        .expect(200);
      expect(response.headers['content-type']).toContain('image/jpeg');
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.headers.location).toBeUndefined();
      expect(response.body).toEqual(Buffer.from([255, 216, 255]));
    } finally {
      download.mockRestore();
    }
  });
});
