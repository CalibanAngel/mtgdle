import { Module } from '@nestjs/common';
import { HealthApiModule } from './health/health.api-module';
import { CardApiModule } from './card/card.api-module';
import { SetApiModule } from './set/set.api-module';
import { ModelsModule } from '../models/models.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ConfigurationModule } from '../config/config.module';
import { PlayableCardApiModule } from './playable-card/playable-card.api-module';
import { BulkApiModule } from './bulk/bulk.api-module';
import { GameApiModule } from './game/game.api-module';

@Module({
  imports: [
    BulkApiModule,
    CardApiModule,
    ConfigurationModule,
    GameApiModule,
    HealthApiModule,
    ModelsModule,
    InfrastructureModule,
    PlayableCardApiModule,
    SetApiModule,
  ],
})
export class ApiModule {}
