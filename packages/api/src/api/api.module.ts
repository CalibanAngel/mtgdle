import { Module } from '@nestjs/common';
import { HealthApiModule } from './health/health.api-module';
import { CardApiModule } from './card/card.api-module';
import { SetApiModule } from './set/set.api-module';
import { ModelsModule } from '../models/models.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ConfigurationModule } from '../config/config.module';

@Module({
  imports: [
    HealthApiModule,
    CardApiModule,
    SetApiModule,
    ModelsModule,
    InfrastructureModule,
    ConfigurationModule
  ],
})
export class ApiModule {}
