import { GameController } from './game.controller';
import { GameApiService } from './game.api-service';
import { Module } from '@nestjs/common';
import { GameModule } from '../../models/game/game.module';
import { ClassicController } from './classic.controller';
import { ClassicStore } from './classic.store';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassicCatalogueEntity } from '../../models/classic-catalogue/classic-catalogue.schema';
import { ClassicDailyEntity } from '../../models/classic-daily/classic-daily.schema';
import { ClassicProgressEntity } from '../../models/classic-progress/classic-progress.schema';
import { ClassicRepository } from '../../models/classic-progress/classic.repository';
import { createCustomRepositoryProvider } from '../../repository/custom-repository.helper';

@Module({
  controllers: [GameController, ClassicController],
  providers: [
    GameApiService,
    ClassicStore,
    createCustomRepositoryProvider(ClassicRepository),
  ],
  imports: [
    GameModule,
    TypeOrmModule.forFeature([
      ClassicCatalogueEntity,
      ClassicDailyEntity,
      ClassicProgressEntity,
    ]),
  ],
})
export class GameApiModule {}
