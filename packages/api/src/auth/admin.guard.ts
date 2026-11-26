import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { Configuration } from '../config/config';
import { AdminSessionService } from './admin-session.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService<Configuration>,
    @Optional() private readonly sessions?: AdminSessionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (this.sessions?.authorize(request)) return true;
    const expected = this.config.get('admin.token', { infer: true });
    if (!expected && !this.sessions?.isConfigured())
      throw new ForbiddenException('HTTP administration is disabled');
    const token =
      request.headers.authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
    const digest = (value: string) =>
      createHash('sha256').update(value).digest();
    if (
      !token ||
      !expected ||
      !timingSafeEqual(digest(token), digest(expected))
    ) {
      throw new UnauthorizedException('Administrator credentials required');
    }
    return true;
  }
}
