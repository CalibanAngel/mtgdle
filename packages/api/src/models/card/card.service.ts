import { Injectable } from '@nestjs/common';
import { Card } from './card';
import { Observable } from 'rxjs';
import { ScryfallCardService } from '../../infrastructure/external/scryfall/card/scryfall-card.service';
import { CardRepository } from './card.repository';
import { ScryfallBulkDataService } from '../../infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.service';
import { scryfallAnyCardToCard } from '../../infrastructure/external/scryfall/card/scryfall-card-to-card.mapper';
import { ScryfallCard } from '@scryfall/api-types';
import { SETS_TYPE_HANDLED } from '../set/set.constant';
import { IImportStats, SetType } from '@mtgdle/shared-types';
import { WithLogger } from '../../infrastructure/logging/with-logger.abstract';

@Injectable()
export class CardService extends WithLogger {
  constructor(
    private readonly scryfallCardService: ScryfallCardService,
    private readonly scryfallBulkDataService: ScryfallBulkDataService,
    private readonly cardRepository: CardRepository,
  ) {
    super();
  }

  getRandomCardFromScryfallApi(): Observable<Card> {
    return this.scryfallCardService.getRandomCard();
  }

  getFromScryfallId(id: string): Observable<Card> {
    return this.scryfallCardService.getCardById(id);
  }

  createCard(card: Card): Promise<Card[]> {
    this.logger.debug(
      `Creating card ${card.name} with id ${card.id} for set ${card.setId}`,
    );

    return this.cardRepository.createCards([card]);
  }

  createCards(cards: Card[]): Promise<Card[]> {
    this.logger.debug(`Creating ${cards.length} cards`);

    return this.cardRepository.createCards(cards);
  }

  createCardsFromScryfallCards(cards: ScryfallCard.Any[]): Promise<Card[]> {
    const mappedCards = cards.map(scryfallAnyCardToCard);
    return this.createCards(mappedCards);
  }

  shouldInsert(card: ScryfallCard.Any): boolean {
    return (
      card.layout === 'normal' &&
      SETS_TYPE_HANDLED.includes(card.set_type as SetType)
    );
  }

  filteredCards(cards: ScryfallCard.Any[]): ScryfallCard.Any[] {
    return cards.filter((card) => this.shouldInsert(card));
  }

  insertHandler(
    onBatch: (cards: ScryfallCard.Any[]) => Promise<unknown>,
  ): (cards: ScryfallCard.Any[]) => Promise<void> {
    return async (cards: ScryfallCard.Any[]) => {
      const filteredCards = this.filteredCards(cards);
      if (!filteredCards.length) return;
      await onBatch(filteredCards);
    };
  }

  async importAllFromScryfall(local: boolean): Promise<IImportStats> {
    return this.scryfallBulkDataService.importCardsFromFile(
      local,
      this.insertHandler(this.createCardsFromScryfallCards.bind(this)),
    );
  }
}
