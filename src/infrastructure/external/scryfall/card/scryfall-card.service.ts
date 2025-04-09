import { Injectable, Logger } from '@nestjs/common';
import { ScrayfallCardDao } from './scrayfall-card.dao';
import { map, Observable } from 'rxjs';
import { scryfallAnyCardToCard } from './scryfall-card-to-card.mapper';
import { Card } from '../../../../models/card/card';

@Injectable()
export class ScryfallCardService {
  private readonly logger = new Logger(ScryfallCardService.name);

  constructor(private readonly scryfallCardDao: ScrayfallCardDao) {}

  getRandomCard(): Observable<Card> {
    return this.scryfallCardDao
      .getRandomCard()
      .pipe(map(({ data }) => scryfallAnyCardToCard(data)));
  }
}
