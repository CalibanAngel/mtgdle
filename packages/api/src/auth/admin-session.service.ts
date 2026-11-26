import {
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import type { AdminSession } from '@mtgdle/shared-types';
import { Configuration } from '../config/config';
import { verifyAdminPassword } from './admin-password';

const cookieName = 'mtgdle_admin';
const lifetime = 8 * 60 * 60 * 1000;
@Injectable()
export class AdminSessionService {
  private readonly sessions = new Map<
    string,
    { username: string; expires: number }
  >();
  private readonly attempts = new Map<
    string,
    { count: number; expires: number }
  >();
  constructor(private readonly config: ConfigService<Configuration>) {}
  isConfigured(): boolean {
    return Boolean(this.config.get('admin.passwordHash', { infer: true }));
  }
  private key(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
  private token(req: Request): string {
    return (
      req.headers.cookie
        ?.split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${cookieName}=`))
        ?.slice(cookieName.length + 1) || ''
    );
  }
  private prune(): void {
    for (const [key, value] of this.sessions)
      if (value.expires <= Date.now()) this.sessions.delete(key);
    for (const [key, value] of this.attempts)
      if (value.expires <= Date.now()) this.attempts.delete(key);
  }
  session(req: Request): AdminSession {
    this.prune();
    const session = this.isConfigured()
      ? this.sessions.get(this.key(this.token(req)))
      : undefined;
    return {
      configured: this.isConfigured(),
      authenticated: Boolean(session),
      username: session?.username || null,
      expiresAt: session ? new Date(session.expires).toISOString() : null,
    };
  }
  assertSameOrigin(req: Request): void {
    if (
      req.get('X-Admin-Request') !== 'true' ||
      (req.get('Origin') &&
        req.get('Origin') !== `${req.protocol}://${req.get('host')}`)
    ) {
      throw new ForbiddenException('Requête administrative non autorisée.');
    }
  }
  authorize(req: Request): boolean {
    if (!this.session(req).authenticated) return false;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method))
      this.assertSameOrigin(req);
    return true;
  }
  async login(
    req: Request,
    res: Response,
    username: string,
    password: string,
  ): Promise<AdminSession> {
    if (!this.isConfigured())
      throw new ForbiddenException(
        'La connexion administrateur n’est pas configurée.',
      );
    if (process.env.NODE_ENV === 'production' && !req.secure)
      throw new ForbiddenException('HTTPS est requis.');
    this.assertSameOrigin(req);
    this.prune();
    const address = req.ip || 'unknown';
    const attempt = this.attempts.get(address) || {
      count: 0,
      expires: Date.now() + 15 * 60 * 1000,
    };
    if (attempt.count >= 5)
      throw new HttpException(
        'Trop de tentatives. Réessaie dans quinze minutes.',
        429,
      );
    if (this.attempts.size >= 1000 && !this.attempts.has(address))
      this.attempts.delete(this.attempts.keys().next().value!);
    attempt.count++;
    this.attempts.set(address, attempt);
    const valid = await verifyAdminPassword(
      password,
      this.config.get('admin.passwordHash', { infer: true }) || '',
    );
    if (
      !valid ||
      username !== this.config.get('admin.username', { infer: true })
    )
      throw new UnauthorizedException('Identifiants incorrects.');
    this.attempts.delete(address);
    this.sessions.delete(this.key(this.token(req)));
    while (this.sessions.size >= 20)
      this.sessions.delete(this.sessions.keys().next().value!);
    const token = randomBytes(32).toString('base64url');
    this.sessions.set(this.key(token), {
      username,
      expires: Date.now() + lifetime,
    });
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: req.secure || process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/admin',
      maxAge: lifetime,
    });
    return {
      configured: true,
      authenticated: true,
      username,
      expiresAt: new Date(Date.now() + lifetime).toISOString(),
    };
  }
  logout(req: Request, res: Response): void {
    this.assertSameOrigin(req);
    this.sessions.delete(this.key(this.token(req)));
    res.clearCookie(cookieName, {
      path: '/api/admin',
      httpOnly: true,
      secure: req.secure || process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }
}
