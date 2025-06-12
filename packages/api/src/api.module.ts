import { Module } from '@nestjs/common';
import { HealthApModule } from './health/health.api-module';
import { CardApiModule } from './card/card.api-module';
import { SetApiModule } from './set/set.api-module';
import { ModelsModule } from '@mtgdle/common/dist/models/models.module';
import { InfrastructureModule } from '@mtgdle/common/dist/infrastructure/infrastructure.module';

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
