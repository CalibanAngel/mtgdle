import { EntitySchema } from 'typeorm';

export const CUSTOM_REPOSITORY_ENTITY = 'CUSTOM_REPOSITORY_ENTITY';

export type Constructor<T = unknown> = new (...args: any[]) => T;

export type RepositoryEntity<T = unknown> = Constructor<T> | EntitySchema<T>;
