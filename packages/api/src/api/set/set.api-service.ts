import { Injectable, Logger } from '@nestjs/common';
import { from, Observable, switchMap } from 'rxjs';
import { ScryfallSetService } from '../../infrastructure/external/scryfall/set/scryfall-set.service';
import { SetService } from '../../models/set/set.service';
import { CardSet } from '../../models/set/set';

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

  importScryfallSetToDatabase() {
    this.logger.debug('Start importing Sryfall set');

    return this.getAllSetFromScryfall().pipe(
      switchMap((data) => from(this.setService.bulkInsert(data))),
    );
  }

  getAll(): Promise<CardSet[]> {
    return this.setService.getAll();
  }
}
