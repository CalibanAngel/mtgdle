import { Module } from '@nestjs/common';
import { ScryfallCardService } from './scryfall-card.service';
import { ScrayfallCardDao } from './scrayfall-card.dao';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [ScryfallCardService, ScrayfallCardDao],
  exports: [ScryfallCardService],
})
export class ScryfallCardModule {}
