import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BulkApiService } from '../api/bulk/bulk.api-service';
import { ScryfallBulkDataService } from '../infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.service';
import { ClassicCatalogueService } from '../models/classic-catalogue/classic-catalogue.service';

export const batchCommands = [
  'database:init',
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
      case 'database:init': {
        const [{ count }]: { count: number }[] = await this.db.query(
          "SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
        );
        if (count !== 0)
          throw new Error(
            'Initialization refused: database is not empty. Use migrations for an existing installation.',
          );
        await this.db.synchronize(false);
        await this.db.runMigrations();
        this.logger.log(
          'Empty database initialized; automatic synchronization remains disabled.',
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
