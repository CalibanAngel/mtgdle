import { ScryfallSetService } from '../../infrastructure/external/scryfall/set/scryfall-set.service';
import { Observable } from 'rxjs';
import { CardSet } from './set';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SetService {
  private readonly logger = new Logger(SetService.name);

  constructor(private readonly scryfallSetService: ScryfallSetService) {}

  getAll(): Observable<CardSet[]> {
    return this.scryfallSetService.getAllSets();
  }
}
