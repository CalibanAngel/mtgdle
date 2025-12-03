export enum ErrorKey {
  GAME_ALREADY_EXISTS = 'GAME_ALREADY_EXISTS',
  CARD_NOT_FOUND = 'CARD_NOT_FOUND',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export type ErrorContextName = 'CREATE_GAME' | 'UPSERT_SET' | 'CREATE_CARD' | 'DEFAULT';

export class DomainException extends Error {
  constructor(
    public readonly errorKey: ErrorKey,
    public readonly description: string,
    public readonly details?: unknown,
  ) {
    super(description);
  }
}