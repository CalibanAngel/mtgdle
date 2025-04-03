import { Module } from '@nestjs/common';
import { ModelsModule } from '../../models/models.module';
import { CardController } from './card.controller';

@Module({
  imports: [ModelsModule],
  controllers: [CardController],
  exports: [],
})
export class CardModule {}
