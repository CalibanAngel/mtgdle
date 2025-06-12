import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST!,
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  databaseName: process.env.DATABASE_NAME!,
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
