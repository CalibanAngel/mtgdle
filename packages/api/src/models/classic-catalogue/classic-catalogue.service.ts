import { Injectable, Logger } from '@nestjs/common';
import { ClassicCatalogueRepository } from './classic-catalogue.repository';
import type { ClassicCataloguePreparation } from './classic-catalogue';
import type { ScryfallCard } from '@scryfall/api-types';
import { ScryfallBulkDataService } from '../../infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.service';
import { standard, toClassicCard } from './classic-catalogue.mapper';

type Printing = ScryfallCard.Normal;
const earlier = (a: Printing, b?: Printing) =>
  !b || `${a.released_at}/${a.id}` < `${b.released_at}/${b.id}`;

@Injectable()
export class ClassicCatalogueService {
  private readonly logger = new Logger(ClassicCatalogueService.name);
  constructor(
    private readonly repository: ClassicCatalogueRepository,
    private readonly bulk: ScryfallBulkDataService,
  ) {}

  async prepare(checkOnly = false): Promise<ClassicCataloguePreparation> {
    const names = new Set(await this.repository.selectedNames());
    const entries = new Map<string, { first?: Printing; art?: Printing }>();
    await this.bulk.importCardsFromFile(true, async (batch) => {
      for (const card of batch) {
        if (
          card.layout !== 'normal' ||
          !names.has(card.name) ||
          card.lang !== 'en' ||
          !card.games.includes('paper') ||
          !card.oracle_id
        )
          continue;
        const entry = entries.get(card.oracle_id) || {};
        if (earlier(card, entry.first)) entry.first = card;
        if (standard(card) && earlier(card, entry.art)) entry.art = card;
        entries.set(card.oracle_id, entry);
      }
    });
    const cards = [...entries].flatMap(([id, entry]) =>
      entry.first && entry.art
        ? [toClassicCard(id, entry.first, entry.art)]
        : [],
    );
    if (!cards.length)
      throw new Error('No eligible cards: nothing was changed.');
    this.logger.log(
      `Catalogue: ${cards.length} logical cards from ${names.size} selected names.`,
    );
    if (!checkOnly) await this.repository.refresh(cards);
    return { cards: cards.length, selectedNames: names.size };
  }
}
