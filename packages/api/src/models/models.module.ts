import { Module } from '@nestjs/common';
import { CardModule } from './card/card.module';
import { SetModule } from './set/set.module';
import { PlayableCardModule } from './playable-card/playable-card.module';

@Module({
  imports: [CardModule, SetModule, PlayableCardModule],
  exports: [CardModule, SetModule, PlayableCardModule],
})
export class ModelsModule {}
