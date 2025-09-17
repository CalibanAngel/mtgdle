import { Injectable } from '@nestjs/common';
import { ScryfallBulkDataDao } from './scryfall-bulk-data.dao';
import { ScryfallCard } from '@scryfall/api-types';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '../../../../config/config';
import { ImportStats } from '@mtgdle/shared-types';

@Injectable()
export class ScryfallBulkDataService {
  constructor(
    private readonly scryfallBulkDataDao: ScryfallBulkDataDao,
    private readonly configService: ConfigService<Configuration>,
  ) {}

  getDefaultCardFileInfo() {
    return this.scryfallBulkDataDao.getDefaultCardFileInfo();
  }

  async importCardsFromFile(
    local: boolean,
    onItem: (card: ScryfallCard.Any[]) => Promise<void>,
  ): Promise<IImportStats> {
    const batchSize = this.configService.getOrThrow('database.batchSize', {
      infer: true,
    });
    const stream = local
      ? this.scryfallBulkDataDao.getLocalStream()
      : await this.scryfallBulkDataDao.streamDefaultCards();

    return this.scryfallBulkDataDao.processInBatches(
      stream,
      batchSize,
      onItem,
    );
  }
}
