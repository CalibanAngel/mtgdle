import { Module } from '@nestjs/common';
import { CardController } from './card.controller';
import { ModelsModule } from '../../models/models.module';

@Module({
  imports: [ModelsModule],
  controllers: [CardController],
  exports: [],
})
export class CardApiModule {}
