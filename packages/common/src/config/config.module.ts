import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './env.validation';
import { databaseConfig } from './database.config';
import { httpConfig } from './http.config';
import { scryfallConfig } from './scryfall.config';
import * as path from 'node:path';
import * as fs from 'node:fs';

// Resolve paths independently of where the process is started
const commonConfigDir = __dirname; // .../packages/common/src/config
const repoRoot = path.resolve(commonConfigDir, '../../../..'); // up to repo root
const apiRoot = path.resolve(repoRoot, 'packages/api');

function existing(files: string[]) {
  return files.filter((p) => fs.existsSync(p));
}


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig, httpConfig, scryfallConfig],
      isGlobal: true,
      validationSchema: envValidationSchema,
      envFilePath: existing([
        path.resolve(repoRoot, '.env'),
        path.resolve(repoRoot, `.env.${process.env.NODE_ENV ?? 'development'}`),
        path.resolve(apiRoot, '.env'),
        path.resolve(apiRoot, `.env.${process.env.NODE_ENV ?? 'development'}`),
      ]),
    }),
  ],
  exports: [ConfigModule],
})
export class CommonConfigModule {}
