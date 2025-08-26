import { DataSource, ObjectLiteral, Repository } from 'typeorm';
import {
  CUSTOM_REPOSITORY_ENTITY,
  RepositoryEntity,
} from './custom-repository.type';

export abstract class CustomRepositoryBase<
  T extends ObjectLiteral = ObjectLiteral,
> extends Repository<T> {
  constructor(dataSource: DataSource) {
    const entity = Reflect.getMetadata(
      CUSTOM_REPOSITORY_ENTITY,
      new.target,
    ) as RepositoryEntity<T>;
    if (!entity) {
      throw new Error(
        `Missing entity metadata in repository ${new.target.name}. Did you forget to use @CustomRepository()?`,
      );
    }
    super(entity, dataSource.createEntityManager());
  }
}
