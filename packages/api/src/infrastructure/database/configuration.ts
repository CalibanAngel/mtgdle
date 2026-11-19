import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import { ConfigService } from '@nestjs/config';
import { Entities } from './entities';
import { Configuration } from '../../config/config';
import { ClassicSchema1761955200000 } from './migrations/classic-schema.migration';

export const databaseConfiguration = (
  configService: ConfigService<Configuration>,
): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    applicationName: 'mtgdle',
    database: configService.getOrThrow('database.databaseName', {
      infer: true,
    }),
    host: configService.getOrThrow('database.host', { infer: true }),
    port: configService.getOrThrow('database.port', { infer: true }),
    username: configService.getOrThrow('database.username', { infer: true }),
    password: configService.getOrThrow('database.password', { infer: true }),
    synchronize: configService.getOrThrow('database.synchronize', {
      infer: true,
    }),
    entities: Entities,
    dropSchema: configService.getOrThrow('database.dropSchema', {
      infer: true,
    }),
    // autoLoadEntities: configService.getOrThrow('database.autoLoadEntities', {infer: true}),
    migrations: [ClassicSchema1761955200000],
  };
};
