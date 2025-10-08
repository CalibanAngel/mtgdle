import { Injectable } from '@nestjs/common';
import { from, map, Observable, switchMap } from 'rxjs';
import { ScryfallSetService } from '../../infrastructure/external/scryfall/set/scryfall-set.service';
import { SetService } from '../../models/set/set.service';
import { CardSet } from '../../models/set/set';
import { SETS_TYPE_HANDLED } from '../../models/set/set.constant';
import { WithLogger } from '../../infrastructure/logging/with-logger.abstract';
import { UpsertResult } from '../../infrastructure/database/database.interface';

@Injectable()
export class SetApiService extends WithLogger {
  constructor(
    private readonly scryfallSetService: ScryfallSetService,
    private readonly setService: SetService,
  ) {
    super();
  }

  private getAllSetFromScryfall(): Observable<CardSet[]> {
    return this.scryfallSetService.getAllSets();
  }

  importScryfallSetToDatabase(onlyExpansion: boolean): Observable<UpsertResult<CardSet>> {
    this.logger.log(
      `Start importing Scryfall set (onlyExpansion: ${onlyExpansion}) to database`,
    );

    return this.getAllSetFromScryfall().pipe(
      map((sets) =>
        onlyExpansion
          ? sets.filter((set) => SETS_TYPE_HANDLED.includes(set.setType))
          : sets,
      ),
      switchMap((data) => from(this.setService.bulkInsert(data))),
    );
  }

  getAll(): Promise<CardSet[]> {
    return this.setService.getAll();
  }
}
