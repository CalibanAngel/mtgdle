import { Injectable, Logger } from '@nestjs/common';
import { ScrayfallSetDao } from './scrayfall-set.dao';
import { map, Observable } from 'rxjs';
import { CardSet } from '../../../../models/set/set';
import { scryfallSetToSetMapper } from './scryfall-set-to-set.mapper';

@Injectable()
export class ScryfallSetService {
  private readonly logger = new Logger(ScryfallSetService.name);

  constructor(private readonly scryfallCardDao: ScrayfallSetDao) {}

  getAllSets(): Observable<CardSet[]> {
    return this.scryfallCardDao.getAllSets().pipe(
      map(({ data }) => {
        return data.data.map((scryfallSet) =>
          scryfallSetToSetMapper(scryfallSet),
        );
      }),
    );
  }
}
