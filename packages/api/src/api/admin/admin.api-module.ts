import { Module } from '@nestjs/common';
import { AdminAuthController, AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from '../../models/classic-progress/admin.repository';
import { createCustomRepositoryProvider } from '../../repository/custom-repository.helper';
import { ClassicCatalogueModule } from '../../models/classic-catalogue/classic-catalogue.module';
import { ScryfallBulkDataModule } from '../../infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.module';
import { BulkApiModule } from '../bulk/bulk.api-module';
import { CardApiModule } from '../card/card.api-module';
import { SetApiModule } from '../set/set.api-module';
import { PlayableCardApiModule } from '../playable-card/playable-card.api-module';
import { HealthApiModule } from '../health/health.api-module';
@Module({
  imports: [
    ClassicCatalogueModule,
    ScryfallBulkDataModule,
    BulkApiModule,
    CardApiModule,
    SetApiModule,
    PlayableCardApiModule,
    HealthApiModule,
  ],
  controllers: [AdminAuthController, AdminController],
  providers: [AdminService, createCustomRepositoryProvider(AdminRepository)],
})
export class AdminApiModule {}
