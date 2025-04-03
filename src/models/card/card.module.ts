import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardImageUrisModule } from './card-image-uris/card-image-uris.module';

@Module({
  imports: [CardImageUrisModule],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}
