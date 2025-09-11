import { Injectable } from '@nestjs/common';
import { ScryfallBulkDataDao } from './scryfall-bulk-data.dao';
import { ScryfallCard } from '@scryfall/api-types';

@Injectable()
export class ScryfallBulkDataService {
  constructor(private readonly scryfallBulkDataDao: ScryfallBulkDataDao) {}

  getDefaultCardFileInfo() {
    return this.scryfallBulkDataDao.getDefaultCardFileInfo();

  }

  async importCardsFromFile(local: boolean, onItem: (card: ScryfallCard.Any) => void) {
    const stream = local ? this.scryfallBulkDataDao.getLocalStream() : await this.scryfallBulkDataDao.streamDefaultCards();

    return this.scryfallBulkDataDao.processDefaultCardsIncrementally(stream, onItem);
  }
}
