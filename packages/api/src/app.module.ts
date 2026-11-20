import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { ConfigurationModule } from './config/config.module';
import { ModelsModule } from './models/models.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ScheduleModule } from './schedule/schedule.module';
import { AuthModule } from './auth/auth.module';
import { ClassicCatalogueModule } from './models/classic-catalogue/classic-catalogue.module';

@Module({
  imports: [
    ConfigurationModule,
    AuthModule,
    ClassicCatalogueModule,
    ModelsModule,
    ApiModule,
    InfrastructureModule,
    ScheduleModule,
  ],
})
export class AppModule {
  constructor() {}
}
