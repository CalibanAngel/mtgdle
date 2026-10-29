import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEntity } from './game.schema';
import { GameService } from './game.service';
import { createCustomRepositoryProvider } from '../../repository/custom-repository.helper';
import { GameRepository } from './game.repository';
import { PlayableCardModule } from '../playable-card/playable-card.module';

@Module({
  imports: [TypeOrmModule.forFeature([GameEntity]), PlayableCardModule],
  providers: [GameService, createCustomRepositoryProvider(GameRepository)],
  exports: [GameService],
})
export class GameModule {}