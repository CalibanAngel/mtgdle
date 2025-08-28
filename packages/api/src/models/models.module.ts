import { Module } from '@nestjs/common';
import { CardModule } from './card/card.module';
import { SetModule } from './set/set.module';

@Module({
  imports: [CardModule, SetModule],
  exports: [CardModule, SetModule],
})
export class ModelsModule {}
