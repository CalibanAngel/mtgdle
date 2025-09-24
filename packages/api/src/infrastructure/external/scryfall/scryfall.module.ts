import { Module } from '@nestjs/common';
import { ScryfallCardModule } from './card/scryfall-card.module';
import { ScryfallSetModule } from './set/scryfall-set.module';
import { ScryfallBulkDataModule } from './bulk-data/scryfall-bulk-data.module';

@Module({
  imports: [ScryfallCardModule, ScryfallSetModule, ScryfallBulkDataModule],
  exports: [ScryfallCardModule, ScryfallSetModule, ScryfallBulkDataModule],
})
export class ScryfallModule {}
