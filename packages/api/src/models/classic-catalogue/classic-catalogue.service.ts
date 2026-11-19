import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
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
    private readonly db: DataSource,
    private readonly bulk: ScryfallBulkDataService,
  ) {}

  async prepare(
    checkOnly = false,
  ): Promise<{ cards: number; selectedNames: number }> {
    const rows: { name: string }[] = await this.db.query(
      'SELECT name FROM playable_card',
    );
    const names = new Set(rows.map((row) => row.name));
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
    if (!checkOnly) {
      await this.db.runMigrations();
      await this.db.transaction(async (manager) => {
        for (const card of cards) {
          await manager.query(
            'INSERT INTO classic_catalogue(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data',
            [card.id, card],
          );
        }
        await manager.query(`UPDATE classic_daily d SET cards = (
          SELECT jsonb_agg(item || jsonb_build_object(
            'previewImage', c.data->'previewImage', 'artCrop', c.data->'artCrop',
            'oracleText', c.data->'oracleText', 'rarity', c.data->'rarity'
          ) ORDER BY position)
          FROM jsonb_array_elements(d.cards) WITH ORDINALITY AS items(item, position)
          LEFT JOIN classic_catalogue c ON c.id::text = item->>'id'
        )`);
      });
    }
    return { cards: cards.length, selectedNames: names.size };
  }
}
