import { Injectable, Logger } from '@nestjs/common';
import { Card } from './card';
import { Observable } from 'rxjs';
import { ScryfallCardService } from '../../infrastructure/external/scryfall/card/scryfall-card.service';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(private readonly scryfallCardService: ScryfallCardService) {}

  getRandomCardFromScryfallApi(): Observable<Card> {
    return this.scryfallCardService.getRandomCard();
  }

  getFromScryfallId(id: string): Observable<Card> {
    return this.scryfallCardService.getCardById(id);
  }

  createFromScryfallId(id: string): Card {
    this.logger.debug('createFromScryfallId', id);
    return new Card();
  }
}
