import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';
import { DomainException, ErrorKey } from './error.types';
import { ERROR_CONTEXT_META_KEY, ErrorContextOptions } from './error-context.decorator';
import { defaultContextCodeToKey, PostgresErrorCode } from './error.mapping';

@Injectable()
export class TypeormToDomainInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TypeormToDomainInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = ctx.getHandler?.();
    const controller = ctx.getClass?.();
    const req = ctx.switchToHttp?.().getRequest?.();
    const route = req?.method && req?.url ? `${req.method} ${req.url}` : 'N/A';

    const meta =
      (handler && this.reflector.get<ErrorContextOptions>(ERROR_CONTEXT_META_KEY, handler)) ??
      (controller && this.reflector.get<ErrorContextOptions>(ERROR_CONTEXT_META_KEY, controller)) ??
      { context: 'DEFAULT' };

    return next.handle().pipe(
      catchError((e: unknown) => {
        if (e instanceof QueryFailedError) {
          const rawCode: string | undefined = e?.driverError?.code;
          const code = rawCode as PostgresErrorCode | undefined;
          const message: string =
            e?.driverError?.message ?? (e as any)?.message ?? 'Unknown DB error';

          const merged = {
            ...(defaultContextCodeToKey[meta.context] ?? {}),
            ...(meta.codeToKey ?? {}),
          };
          const key: ErrorKey | undefined = code ? merged[code] : undefined;

          this.logger.error(
            `QueryFailedError caught. context=${meta.context} route=${route} code=${code ?? rawCode ?? 'n/a'} message=${message}`,
            (e as any)?.stack,
          );

          if (key) {
            return throwError(() => new DomainException(
              key,
              meta.fallback?.description ?? this.desc(key),
              { context: meta.context, code: code ?? rawCode, message },
            ));
          }

          return throwError(() => new DomainException(
            meta.fallback?.key ?? ErrorKey.INTERNAL_ERROR,
            meta.fallback?.description ?? 'Unexpected error.',
            { context: meta.context, code: code ?? rawCode, message },
          ));
        }

        return throwError(() => e);
      }),
    );
  }

  private desc(key: ErrorKey): string {
    switch (key) {
      case ErrorKey.GAME_ALREADY_EXISTS: return 'A game for today already exists.';
      case ErrorKey.CARD_NOT_FOUND: return 'Card not found.';
      case ErrorKey.VALIDATION_FAILED: return 'Validation failed.';
      default: return 'Unexpected error.';
    }
  }
}