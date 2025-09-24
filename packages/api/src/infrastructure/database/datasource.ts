import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Entities } from './entities';
import * as process from 'node:process';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: +process.env.DATABASE_PORT!,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  dropSchema: process.env.DATABASE_DROP_SCHEMA === 'true',
  entities: Entities,
  migrations: ['migrations/**/*.ts'],
});
