import { Module } from '@nestjs/common';
import { ScryfallBulkDataModule } from '../../infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.module';
import { ClassicCatalogueService } from './classic-catalogue.service';
import { ClassicCatalogueController } from './classic-catalogue.controller';

@Module({
  imports: [ScryfallBulkDataModule],
  controllers: [ClassicCatalogueController],
  providers: [ClassicCatalogueService],
  exports: [ClassicCatalogueService],
})
export class ClassicCatalogueModule {}
