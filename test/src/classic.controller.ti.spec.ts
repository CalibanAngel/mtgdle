import { Test } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ClassicController } from '../../packages/api/src/api/game/classic.controller';
import { ClassicStore } from '../../packages/api/src/api/game/classic.store';

describe('Classic HTTP session and validation', () => {
  let app: INestApplication;
  const state = jest.fn().mockResolvedValue({ status: 'playing', guesses: [] });
  const act = jest.fn().mockResolvedValue({ status: 'playing', guesses: [] });
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ClassicController],
      providers: [{ provide: ClassicStore, useValue: { state, act } }],
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
});
