import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './api/api.module';
import { ConfigurationModule } from './config/config.module';
import { ModelsModule } from './models/models.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

@Module({
  imports: [ConfigurationModule, ModelsModule, ApiModule, InfrastructureModule, ConfigurationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {}
}
