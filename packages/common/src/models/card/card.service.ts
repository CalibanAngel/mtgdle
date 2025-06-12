import { Injectable, Logger } from '@nestjs/common';
import { Card } from './card';
import { Observable } from 'rxjs';
import { ScryfallCardService } from '../../infrastructure/external/scryfall/card/scryfall-card.service';
import { CardRepository } from './card.repository';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private readonly scryfallCardService: ScryfallCardService,
    private readonly cardRepository: CardRepository,
  ) {}

  getRandomCardFromScryfallApi(): Observable<Card> {
    return this.scryfallCardService.getRandomCard();
  }

  getFromScryfallId(id: string): Observable<Card> {
    return this.scryfallCardService.getCardById(id);
  }

  createCard(card: Card): Promise<Card> {
    return this.cardRepository.createCard(card);
  }
}
