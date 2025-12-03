import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DomainException } from './error.types';
import { errorHttpStatus } from './error.mapping';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp?.();
    const res = http?.getResponse?.();
    const req = http?.getRequest?.();

    // If no HTTP context (e.g., Cron), just log and rethrow
    if (!res || !req) {
      this.logger.error(`Non-HTTP exception: ${String(exception)}`, (exception as any)?.stack);
      throw exception;
    }

    const route = req?.method && req?.url ? `${req.method} ${req.url}` : 'N/A';

    if (exception instanceof DomainException) {
      const status = errorHttpStatus[exception.errorKey] ?? HttpStatus.BAD_REQUEST;

      this.logger.error(
        `DomainException handled. route=${route} status=${status} key=${exception.errorKey} description="${exception.description}" details=${JSON.stringify(
          exception.details ?? {},
        )}`,
      );

      return res.status(status).json({
        errorKey: exception.errorKey,
        description: exception.description,
        details: exception.details ?? null,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      this.logger.error(
        `HttpException handled. route=${route} status=${status} payload=${typeof payload === 'object' ? JSON.stringify(payload) : String(payload)}`,
        (exception as any)?.stack,
      );

      return res.status(status).json(
        typeof payload === 'object'
          ? payload
          : { errorKey: 'INTERNAL_ERROR', description: String(payload) },
      );
    }

    this.logger.error(
      `Unknown exception handled. route=${route} status=500 error=${String(exception)}`,
      (exception as any)?.stack,
    );

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      errorKey: 'INTERNAL_ERROR',
      description: 'Unexpected error',
    });
  }
}