import 'reflect-metadata';
import {
  CUSTOM_REPOSITORY_ENTITY,
  RepositoryEntity,
} from './custom-repository.type';
import { EntitySchema } from 'typeorm';

export function CustomRepository<T = unknown>(
  entity: RepositoryEntity<T> | EntitySchema<T>,
): ClassDecorator {
  const decorator = <TFunction extends RepositoryEntity<unknown>>(
    target: TFunction,
  ): TFunction => {
    Reflect.defineMetadata(CUSTOM_REPOSITORY_ENTITY, entity, target);
    return target;
  };

  return decorator as ClassDecorator;
}
