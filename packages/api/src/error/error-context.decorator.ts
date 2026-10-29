import { SetMetadata } from '@nestjs/common';
import { ErrorContextName, ErrorKey } from './error.types';
import { PostgresErrorCode } from './error.mapping';

export const ERROR_CONTEXT_META_KEY = 'error:context';

export type ErrorContextOptions = {
  context: ErrorContextName;
  codeToKey?: Partial<Record<PostgresErrorCode, ErrorKey>>;
  fallback?: { key: ErrorKey; description?: string };
};

export const ErrorContext = (options: ErrorContextOptions) =>
  SetMetadata(ERROR_CONTEXT_META_KEY, options);