import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import { ConfigService } from '@nestjs/config';
import { Entities } from './entities';
import { Configuration } from '@mtgdle/common/config';

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
    autoLoadEntities: false,
    migrations: [],
  };
};
