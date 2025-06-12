import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './api.module';
import {
  CommonConfigModule,
  InfrastructureModule,
  ModelsModule,
} from '@mtgdle/common';

@Module({
  imports: [CommonConfigModule, ModelsModule, ApiModule, InfrastructureModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {}
}
