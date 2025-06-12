import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Entities } from './entities';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: +process.env.DATABASE_PORT!,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
  dropSchema: false,
  entities: Entities,
  migrations: ['migrations/**/*.ts'],
});
