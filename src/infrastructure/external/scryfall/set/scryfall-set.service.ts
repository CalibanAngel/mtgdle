import { Injectable, Logger } from '@nestjs/common';
import { ScrayfallSetDao } from './scrayfall-set.dao';
import { map, Observable } from 'rxjs';
import { Set } from '../../../../models/set/set';
import { scryfallSetToSetMapper } from './scryfall-set-to-set.mapper';

@Injectable()
export class ScryfallSetService {
  private readonly logger = new Logger(ScryfallSetService.name);

  constructor(private readonly scryfallCardDao: ScrayfallSetDao) {}

  getAllSets(): Observable<Set> {
    return this.scryfallCardDao
      .getAllSets()
      .pipe(map(({ data }) => scryfallSetToSetMapper(data)));
  }
}
