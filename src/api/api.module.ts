import { Module } from '@nestjs/common';
import { HealthApModule } from './health/health.api-module';
import { CardApiModule } from './card/card.api-module';
import { SetApiModule } from './set/set.api-module';
import { ModelsModule } from '../models/models.module';

@Module({
  imports: [HealthApModule, CardApiModule, SetApiModule, ModelsModule],
})
export class ApiModule {}
