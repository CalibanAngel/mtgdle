import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { Configuration } from '../config/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Configuration>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get('admin.token', { infer: true });
    if (!expected)
      throw new ForbiddenException('HTTP administration is disabled');
    const request = context.switchToHttp().getRequest<Request>();
    const token =
      request.headers.authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
    const digest = (value: string) =>
      createHash('sha256').update(value).digest();
    if (!token || !timingSafeEqual(digest(token), digest(expected))) {
      throw new UnauthorizedException('Administrator credentials required');
    }
    return true;
  }
}
