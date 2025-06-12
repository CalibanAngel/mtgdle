import { Module } from '@nestjs/common';
import { HealthApModule } from './health/health.api-module';
import { CardApiModule } from './card/card.api-module';
import { SetApiModule } from './set/set.api-module';
import { ModelsModule } from '../models/models.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  imports: [
    HealthApModule,
    CardApiModule,
    SetApiModule,
    ModelsModule,
    InfrastructureModule,
  ],
})
export class ApiModule {}
