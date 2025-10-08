import { Module } from '@nestjs/common';
import { PlayableCardController } from './playable-card.controller';
import { PlayableCardApiService } from './playable-card.api-service';
import { ModelsModule } from '../../models/models.module';

@Module({
  imports: [ModelsModule],
  exports: [PlayableCardApiService],
  controllers: [PlayableCardController],
  providers: [PlayableCardApiService],
})
export class PlayableCardApiModule {}