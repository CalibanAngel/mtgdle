import { Module } from '@nestjs/common';
import { HealthApiModule } from './health/health.api-module';
import { CardApiModule } from './card/card.api-module';
import { SetApiModule } from './set/set.api-module';
import { ModelsModule } from '@mtgdle/common/models/models.module';
import { InfrastructureModule } from '@mtgdle/common/infrastructure/infrastructure.module';
import { CommonConfigModule } from '@mtgdle/common';

@Module({
  imports: [
    HealthApiModule,
    CardApiModule,
    SetApiModule,
    ModelsModule,
    InfrastructureModule,
    CommonConfigModule
  ],
})
export class ApiModule {}
