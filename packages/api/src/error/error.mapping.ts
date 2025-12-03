import { HttpStatus } from '@nestjs/common';
import { ErrorContextName, ErrorKey } from './error.types';

export const errorHttpStatus: Record<ErrorKey, HttpStatus> = {
  [ErrorKey.GAME_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorKey.CARD_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorKey.VALIDATION_FAILED]: HttpStatus.BAD_REQUEST,
  [ErrorKey.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
};

export enum PostgresErrorCode {
  UNIQUE_VIOLATION = '23505',
  FOREIGN_KEY_VIOLATION = '23503',
  INVALID_TEXT_REPRESENTATION = '22P02',
  // add more when needed
}

// Default mapping per context for common PG error codes
export const defaultContextCodeToKey: Record<
  ErrorContextName,
  Partial<Record<PostgresErrorCode, ErrorKey>>
> = {
  CREATE_GAME: {
    [PostgresErrorCode.UNIQUE_VIOLATION]: ErrorKey.GAME_ALREADY_EXISTS,
    [PostgresErrorCode.FOREIGN_KEY_VIOLATION]: ErrorKey.VALIDATION_FAILED,
    [PostgresErrorCode.INVALID_TEXT_REPRESENTATION]: ErrorKey.VALIDATION_FAILED,
  },
  UPSERT_SET: {
    [PostgresErrorCode.FOREIGN_KEY_VIOLATION]: ErrorKey.VALIDATION_FAILED,
    [PostgresErrorCode.INVALID_TEXT_REPRESENTATION]: ErrorKey.VALIDATION_FAILED,
  },
  CREATE_CARD: {
    [PostgresErrorCode.FOREIGN_KEY_VIOLATION]: ErrorKey.VALIDATION_FAILED,
    [PostgresErrorCode.INVALID_TEXT_REPRESENTATION]: ErrorKey.VALIDATION_FAILED,
  },
  DEFAULT: {
    [PostgresErrorCode.FOREIGN_KEY_VIOLATION]: ErrorKey.VALIDATION_FAILED,
    [PostgresErrorCode.INVALID_TEXT_REPRESENTATION]: ErrorKey.VALIDATION_FAILED,
  },
};