import { Module } from '@nestjs/common';
import { CardController } from './card.controller';
import { ModelsModule } from '../../models/models.module';
import { CardApiService } from './card.api-service';

@Module({
  imports: [ModelsModule],
  controllers: [CardController],
  providers: [CardApiService],
  exports: [],
})
export class CardApiModule {}
