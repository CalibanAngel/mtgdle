import { Module } from '@nestjs/common';
import { ScryfallCardService } from './scryfall-card.service';
import { HttpModule } from '@nestjs/axios';
import { ScryfallCardDao } from './scryfall-card.dao';

@Module({
  imports: [HttpModule],
  providers: [ScryfallCardService, ScryfallCardDao],
  exports: [ScryfallCardService],
})
export class ScryfallCardModule {}
