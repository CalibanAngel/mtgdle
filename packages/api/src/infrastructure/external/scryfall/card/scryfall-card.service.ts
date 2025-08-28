import { Injectable, Logger } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { scryfallAnyCardToCard } from './scryfall-card-to-card.mapper';
import { Card } from '../../../../models/card/card';
import { ScryfallCardDao } from './scryfall-card.dao';

@Injectable()
export class ScryfallCardService {
  private readonly logger = new Logger(ScryfallCardService.name);

  constructor(private readonly scryfallCardDao: ScryfallCardDao) {}

  getRandomCard(): Observable<Card> {
    return this.scryfallCardDao
      .getRandomCard()
      .pipe(map(({ data }) => scryfallAnyCardToCard(data)));
  }

  getCardById(id: string): Observable<Card> {
    return this.scryfallCardDao
      .getCardById(id)
      .pipe(map(({ data }) => scryfallAnyCardToCard(data)));
  }
}
