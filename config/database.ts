import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import { ConfigService } from '@nestjs/config';
import { Configuration } from './configuration';

export default (
  configService: ConfigService<Configuration>,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  database: configService.get('database.databaseName', { infer: true }),
  host: configService.get('database.host', { infer: true }),
  port: configService.get('database.port', { infer: true }),
  username: configService.get('database.username', { infer: true }),
  password: configService.get('database.password', { infer: true }),
  synchronize: configService.get('database.synchronize', { infer: true }),
});
