import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayableCardEntity } from './playable-card.schema';
import { PlayableCardService } from './playable-card.service';
import { createCustomRepositoryProvider } from '../../repository/custom-repository.helper';
import { PlayableCardRepository } from './playable-card.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PlayableCardEntity])],
  providers: [PlayableCardService, createCustomRepositoryProvider(PlayableCardRepository)],
  exports: [PlayableCardService],
})
export class PlayableCardModule {}
