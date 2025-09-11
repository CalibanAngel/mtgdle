import { Injectable, Logger } from '@nestjs/common';
import { Card } from './card';
import { Observable } from 'rxjs';
import { ScryfallCardService } from '../../infrastructure/external/scryfall/card/scryfall-card.service';
import { CardRepository } from './card.repository';
import { ScryfallBulkDataService } from '../../infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.service';
import { scryfallAnyCardToCard } from '../../infrastructure/external/scryfall/card/scryfall-card-to-card.mapper';
import { ScryfallCard } from '@scryfall/api-types';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private readonly scryfallCardService: ScryfallCardService,
    private readonly scryfallBulkDataService: ScryfallBulkDataService,
    private readonly cardRepository: CardRepository,
  ) {}

  getRandomCardFromScryfallApi(): Observable<Card> {
    return this.scryfallCardService.getRandomCard();
  }

  getFromScryfallId(id: string): Observable<Card> {
    return this.scryfallCardService.getCardById(id);
  }

  createCard(card: Card): Promise<Card> {
    this.logger.debug(`Creating card ${card.name} with id ${card.id} for set ${card.setId}`);

    return this.cardRepository.createCard(card);
  }

  createCardFromScryfallCard(card: ScryfallCard.Any): Promise<Card> {
    return this.createCard(scryfallAnyCardToCard(card));
  }

  async importAllFromScryfall(local: boolean): Promise<void> {
    return this.scryfallBulkDataService.importCardsFromFile(local, this.createCardFromScryfallCard.bind(this))
  }
}
