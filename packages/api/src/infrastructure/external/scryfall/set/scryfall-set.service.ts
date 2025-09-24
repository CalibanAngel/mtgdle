import { Injectable } from '@nestjs/common';
import { ScrayfallSetDao } from './scrayfall-set.dao';
import { map, Observable } from 'rxjs';
import { CardSet } from '../../../../models/set/set';
import { scryfallSetToSetMapper } from './scryfall-set-to-set.mapper';
import { WithLogger } from '../../../logging/with-logger.abstract';

@Injectable()
export class ScryfallSetService extends WithLogger {
  constructor(private readonly scryfallCardDao: ScrayfallSetDao) {
    super();
  }

  getAllSets(): Observable<CardSet[]> {
    return this.scryfallCardDao.getAllSets().pipe(
      map(({ data }) => {
        this.logger.debug(
          `Got ${data.data.length} sets from Scryfall API, start mapping`,
        );

        return data.data.map((scryfallSet) =>
          scryfallSetToSetMapper(scryfallSet),
        );
      }),
    );
  }
}
