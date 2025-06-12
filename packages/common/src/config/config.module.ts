import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './env.validation';
import { databaseConfig } from './database.config';
import { httpConfig } from './http.config';
import { scryfallConfig } from './scryfall.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig, httpConfig, scryfallConfig],
      isGlobal: true,
      validationSchema: envValidationSchema,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV}`],
    }),
  ],
  exports: [ConfigModule],
})
export class CommonConfigModule {}
