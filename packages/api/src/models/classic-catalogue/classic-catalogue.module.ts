import { Module } from '@nestjs/common';
import { ScryfallBulkDataModule } from '../../infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.module';
import { ClassicCatalogueService } from './classic-catalogue.service';
import { ClassicCatalogueController } from './classic-catalogue.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassicCatalogueEntity } from './classic-catalogue.schema';
import { ClassicDailyEntity } from '../classic-daily/classic-daily.schema';
import { ClassicCatalogueRepository } from './classic-catalogue.repository';
import { createCustomRepositoryProvider } from '../../repository/custom-repository.helper';

@Module({
  imports: [
    ScryfallBulkDataModule,
    TypeOrmModule.forFeature([ClassicCatalogueEntity, ClassicDailyEntity]),
  ],
  controllers: [ClassicCatalogueController],
  providers: [
    ClassicCatalogueService,
    createCustomRepositoryProvider(ClassicCatalogueRepository),
  ],
  exports: [ClassicCatalogueService],
})
export class ClassicCatalogueModule {}
