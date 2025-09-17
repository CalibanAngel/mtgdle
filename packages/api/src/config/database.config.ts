import { registerAs } from '@nestjs/config';
import * as process from 'node:process';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST!,
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  databaseName: process.env.DATABASE_NAME!,
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  dropSchema: process.env.DATABASE_DROP_SCHEMA === 'true',
  autoLoadEntities: process.env.DATABASE_AUTO_LOAD_ENTITIES === 'true',
  batchSize: Number(process.env.DATABASE_BATCH_SIZE) || 500,
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
