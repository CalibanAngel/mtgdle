import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { ConfigurationModule } from './config/config.module';
import { ModelsModule } from './models/models.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [
    ConfigurationModule,
    ModelsModule,
    ApiModule,
    InfrastructureModule,
    ScheduleModule,
  ],
})
export class AppModule {
  constructor() {}
}
