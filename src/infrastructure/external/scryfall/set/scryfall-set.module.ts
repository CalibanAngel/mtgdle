import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScryfallSetService } from './scryfall-set.service';
import { ScrayfallSetDao } from './scrayfall-set.dao';

@Module({
  imports: [HttpModule],
  providers: [ScryfallSetService, ScrayfallSetDao],
  exports: [ScryfallSetService],
})
export class ScryfallSetModule {}
