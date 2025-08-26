import { Module } from '@nestjs/common';
import { CardController } from './card.controller';
import { CardApiService } from './card.api-service';
import { ModelsModule } from '@mtgdle/common/models/models.module';

@Module({
  imports: [ModelsModule],
  controllers: [CardController],
  providers: [CardApiService],
  exports: [],
})
export class CardApiModule {}
