import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseConfiguration } from './configuration';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseConfiguration,
      dataSourceFactory: async (options) => {
        return new DataSource(options!).initialize();
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
