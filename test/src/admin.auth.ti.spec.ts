import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  AdminAuthController,
  AdminController,
} from '../../packages/api/src/api/admin/admin.controller';
import { AdminService } from '../../packages/api/src/api/admin/admin.service';
import { AdminGuard } from '../../packages/api/src/auth/admin.guard';
import { AdminSessionService } from '../../packages/api/src/auth/admin-session.service';
import {
  hashAdminPassword,
  verifyAdminPassword,
} from '../../packages/api/src/auth/admin-password';

describe('Administrator portal authentication', () => {
  let app: INestApplication;
  let hash: string;
  let configured = true;
  const password = 'a-test-only-administrator-password';
  const start = jest
    .fn()
    .mockReturnValue({ id: 'test-job', status: 'running' });
  const headers = {
    Host: 'admin.test',
    Origin: 'https://admin.test',
    'X-Forwarded-Proto': 'https',
    'X-Admin-Request': 'true',
  };
  beforeAll(async () => {
    hash = await hashAdminPassword(password);
  });
  beforeEach(async () => {
    configured = true;
    start.mockClear();
    const module = await Test.createTestingModule({
      controllers: [AdminAuthController, AdminController],
      providers: [
        AdminGuard,
        AdminSessionService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'admin.username'
                ? 'admin'
                : key === 'admin.passwordHash'
                  ? configured
                    ? hash
                    : ''
                  : '',
          },
        },
        {
          provide: AdminService,
          useValue: {
            health: () => ({ database: 'up' }),
            statistics: () => ({ days: [] }),
            jobs: () => [],
            start,
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.getHttpAdapter().getInstance().set('trust proxy', 'loopback');
    await app.init();
  });
  afterEach(async () => {
    await app.close();
    jest.restoreAllMocks();
  });
  async function login(): Promise<string> {
    const result = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .set(headers)
      .send({ username: 'admin', password })
      .expect(200);
    return result.headers['set-cookie'][0].split(';')[0];
  }
  it('should store only a salted hash when the administrator password is prepared', async () => {
    expect(hash).not.toContain(password);
    expect(await hashAdminPassword(password)).not.toBe(hash);
    expect(await verifyAdminPassword(password, hash)).toBe(true);
    expect(await verifyAdminPassword('incorrect', hash)).toBe(false);
    expect(await verifyAdminPassword(password, 'malformed')).toBe(false);
  });
  it('should issue a protected cookie when valid credentials are provided over HTTPS', async () => {
    const result = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .set(headers)
      .send({ username: 'admin', password })
      .expect(200);
    expect(result.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    expect(result.headers['set-cookie'][0]).toMatch(/Secure/);
    expect(result.headers['set-cookie'][0]).toMatch(/SameSite=Strict/);
    expect(result.headers['set-cookie'][0]).toMatch(/Path=\/api\/admin/);
    expect(result.body).toMatchObject({
      authenticated: true,
      username: 'admin',
    });
    expect(JSON.stringify(result.body)).not.toContain(hash);
  });
  it.each([
    '/admin/health',
    '/admin/statistics',
    '/admin/database',
    '/admin/database/card/rows',
    '/admin/jobs',
  ])(
    'should refuse the protected resource when no administrator session exists: %s',
    async (path) => {
      await request(app.getHttpServer()).get(path).expect(401);
    },
  );
  it('should allow the protected resource when the session is valid', async () => {
    await request(app.getHttpServer())
      .get('/admin/health')
      .set('Cookie', await login())
      .expect(200);
  });
  it('should refuse the password when credentials are incorrect', async () => {
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .set(headers)
      .send({ username: 'admin', password: 'incorrect' })
      .expect(401);
  });
  it('should block repeated guesses when five invalid login attempts have occurred', async () => {
    for (let i = 0; i < 5; i++)
      await request(app.getHttpServer())
        .post('/admin/auth/login')
        .set(headers)
        .send({ username: 'admin', password: 'incorrect' })
        .expect(401);
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .set(headers)
      .send({ username: 'admin', password })
      .expect(429);
  });
  it('should disable the portal when no password hash is configured', async () => {
    configured = false;
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .set(headers)
      .send({ username: 'admin', password })
      .expect(403);
    const response = await request(app.getHttpServer())
      .get('/admin/auth/session')
      .expect(200);
    expect(response.body).toMatchObject({
      configured: false,
      authenticated: false,
    });
  });
  it('should refuse the login when production receives an unencrypted request', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await request(app.getHttpServer())
        .post('/admin/auth/login')
        .set({ ...headers, 'X-Forwarded-Proto': 'http' })
        .send({ username: 'admin', password })
        .expect(403);
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
  it('should refuse a forged cookie when no server session matches it', async () => {
    await request(app.getHttpServer())
      .get('/admin/health')
      .set('Cookie', 'mtgdle_admin=forged')
      .expect(401);
  });
  it('should revoke the session when the administrator logs out', async () => {
    const cookie = await login();
    await request(app.getHttpServer())
      .post('/admin/auth/logout')
      .set(headers)
      .set('Cookie', cookie)
      .send({})
      .expect(204);
    await request(app.getHttpServer())
      .get('/admin/health')
      .set('Cookie', cookie)
      .expect(401);
  });
  it('should expire the session when its eight-hour lifetime is exceeded', async () => {
    const cookie = await login();
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(Date.now() + 8 * 60 * 60 * 1000 + 1);
    await request(app.getHttpServer())
      .get('/admin/health')
      .set('Cookie', cookie)
      .expect(401);
  });
  it('should refuse a mutation when the custom request header is absent', async () => {
    await request(app.getHttpServer())
      .post('/admin/jobs')
      .set('Cookie', await login())
      .send({ operation: 'catalogue:check' })
      .expect(403);
    expect(start).not.toHaveBeenCalled();
  });
  it('should refuse a mutation when its origin is another site or subdomain', async () => {
    await request(app.getHttpServer())
      .post('/admin/jobs')
      .set(headers)
      .set('Origin', 'https://evil.admin.test')
      .set('Cookie', await login())
      .send({ operation: 'catalogue:check' })
      .expect(403);
    expect(start).not.toHaveBeenCalled();
  });
  it('should validate a mutation when the session and origin are valid', async () => {
    const cookie = await login();
    await request(app.getHttpServer())
      .post('/admin/jobs')
      .set(headers)
      .set('Cookie', cookie)
      .send({ operation: 'catalogue:check' })
      .expect(201);
    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'catalogue:check' }),
    );
    await request(app.getHttpServer())
      .post('/admin/jobs')
      .set(headers)
      .set('Cookie', cookie)
      .send({ operation: 'database:drop' })
      .expect(400);
  });
  it('should reject invalid bounds when the explorer query exceeds its limits', async () => {
    const cookie = await login();
    await request(app.getHttpServer())
      .get('/admin/database/card/rows?pageSize=1000')
      .set('Cookie', cookie)
      .expect(400);
    await request(app.getHttpServer())
      .get('/admin/statistics?days=1000')
      .set('Cookie', cookie)
      .expect(400);
  });
  it('should expose no database write route when an administrator tries to edit a row', async () => {
    await request(app.getHttpServer())
      .delete('/admin/database/card/row')
      .set('Cookie', await login())
      .expect(404);
  });
});
