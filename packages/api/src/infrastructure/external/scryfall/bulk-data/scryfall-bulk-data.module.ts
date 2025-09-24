import { Module } from '@nestjs/common';
import { ScryfallBulkDataService } from './scryfall-bulk-data.service';
import { HttpModule } from '@nestjs/axios';
import { ScryfallBulkDataDao } from './scryfall-bulk-data.dao';

@Module({
  imports: [HttpModule],
  exports: [ScryfallBulkDataService],
  providers: [ScryfallBulkDataService, ScryfallBulkDataDao],
})
export class ScryfallBulkDataModule {}