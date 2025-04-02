import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { validate } from '../config/env.validation';
import { CardModule } from './card/card.module';
import { SetModule } from './set/set.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validate,
    }),
    CardModule,
    SetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
