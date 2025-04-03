import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardImageUrisModule } from './card-image-uris/card-image-uris.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [CardImageUrisModule, HttpModule],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}
