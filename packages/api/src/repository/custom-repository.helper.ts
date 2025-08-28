import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Constructor } from './custom-repository.type';

export function createCustomRepositoryProvider(
  repoClass: Constructor,
): Provider {
  return {
    provide: repoClass,
    useFactory: (dataSource: DataSource) => {
      return new repoClass(dataSource);
    },
    inject: [DataSource],
  };
}
