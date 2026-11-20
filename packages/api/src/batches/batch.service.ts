import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BulkApiService } from '../api/bulk/bulk.api-service';
import { ScryfallBulkDataService } from '../infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.service';
import { ClassicCatalogueService } from '../models/classic-catalogue/classic-catalogue.service';

export const batchCommands = [
  'database:sync',
  'scryfall:download',
  'scryfall:import',
  'classic:prepare',
] as const;
export type BatchCommand = (typeof batchCommands)[number];

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);
  constructor(
    private readonly db: DataSource,
    private readonly bulk: ScryfallBulkDataService,
    private readonly importer: BulkApiService,
    private readonly catalogue: ClassicCatalogueService,
  ) {}

  async run(command: BatchCommand, checkOnly = false): Promise<void> {
    switch (command) {
      case 'database:sync': {
        await this.db.synchronize(false);
        this.logger.log(
          'Development schema synchronized from the TypeORM models.',
        );
        break;
      }
      case 'scryfall:download':
        await this.bulk.downloadDefaultCards();
        break;
      case 'scryfall:import': {
        const result = await this.importer.importAll(true, true);
        this.logger.log(
          `Imported ${result.cards.totalItems} source cards; ${result.playableCards.inserted.length} new playable names.`,
        );
        break;
      }
      case 'classic:prepare':
        await this.catalogue.prepare(checkOnly);
        break;
    }
  }
}
