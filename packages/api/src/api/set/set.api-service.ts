import { Injectable, Logger } from '@nestjs/common';
import { from, map, Observable, switchMap } from 'rxjs';
import { ScryfallSetService } from '../../infrastructure/external/scryfall/set/scryfall-set.service';
import { SetService } from '../../models/set/set.service';
import { CardSet } from '../../models/set/set';
import { SetType } from '@mtgdle/shared-types';

@Injectable()
export class SetApiService {
  private readonly logger = new Logger(SetApiService.name);

  constructor(
    private readonly scryfallSetService: ScryfallSetService,
    private readonly setService: SetService,
  ) {}

  private getAllSetFromScryfall(): Observable<CardSet[]> {
    this.logger.debug('Getting all sets from Scryfall API');

    return this.scryfallSetService.getAllSets();
  }

  importScryfallSetToDatabase(onlyExpansion: boolean) {
    this.logger.debug(`Start importing Scryfall set (onlyExpansion: ${onlyExpansion}) to database`);

    return this.getAllSetFromScryfall().pipe(
      map((sets) =>
        onlyExpansion
          ? sets.filter((set) => [SetType.Expansion, SetType.Core, SetType.Commander, SetType.Masters].includes(set.setType))
          : sets,
      ),
      switchMap((data) => from(this.setService.bulkInsert(data))),
    );
  }

  getAll(): Promise<CardSet[]> {
    return this.setService.getAll();
  }
}
