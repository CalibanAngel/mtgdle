import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/config.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { BulkApiModule } from '../api/bulk/bulk.api-module';
import { ScryfallBulkDataModule } from '../infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.module';
import { ClassicCatalogueModule } from '../models/classic-catalogue/classic-catalogue.module';
import { BatchService } from './batch.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigurationModule,
    AuthModule,
    DatabaseModule,
    BulkApiModule,
    ScryfallBulkDataModule,
    ClassicCatalogueModule,
  ],
  providers: [BatchService],
})
export class BatchModule {}
