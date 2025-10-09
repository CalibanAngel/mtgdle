import { Module } from '@nestjs/common';
import { CardModule } from './card/card.module';
import { SetModule } from './set/set.module';
import { PlayableCardModule } from './playable-card/playable-card.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [CardModule, SetModule, PlayableCardModule, GameModule],
  exports: [CardModule, SetModule, PlayableCardModule, GameModule],
})
export class ModelsModule {}
