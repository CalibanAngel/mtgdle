import {
  Injectable,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { randomInt } from 'node:crypto';
import type {
  ClassicCard,
  ClassicGuess,
  ClassicState,
  HintKind,
} from '@mtgdle/shared-types';
import {
  compareCard,
  HINT_THRESHOLD,
  HINT_THRESHOLDS,
  nextMidnight,
  parisDay,
} from './classic.rules';

interface StoredCard extends ClassicCard {
  artCrop?: string | null;
  oracleText?: string;
}
interface Daily {
  day: string;
  answer_id: string;
  cards: StoredCard[];
}
interface Progress {
  status: ClassicState['status'];
  guesses: ClassicGuess[];
  removed: string[];
  hint_used: boolean;
  art_used: boolean;
  text_used: boolean;
}

@Injectable()
export class ClassicStore {
  constructor(private readonly db: DataSource) {}

  async state(session: string): Promise<ClassicState> {
    return this.db.transaction(async (manager) => {
      const day = parisDay();
      await this.ensureDay(manager, day);
      return this.read(manager, day, session);
    });
  }

  async act(
    day: string,
    session: string,
    action: 'guess' | 'hint' | 'abandon',
    cardId?: string,
    requestId?: string,
    hintKind: HintKind = 'reduce',
  ): Promise<ClassicState> {
    if (day !== parisDay())
      throw new ConflictException({
        code: 'errorExpired',
        message: 'Ce défi est terminé. Charge le nouveau défi.',
      });
    return this.db.transaction(async (manager) => {
      const daily = await this.daily(manager, day);
      const progress = await this.progress(manager, day, session);
      if (day !== parisDay())
        throw new ConflictException({
          code: 'errorExpired',
          message: 'Le défi a changé. Recharge la page.',
        });
      if (
        action === 'guess' &&
        progress.guesses.some((g) => g.requestId === requestId)
      ) {
        const original = progress.guesses.find(
          (g) => g.requestId === requestId,
        )!;
        if (original.card.id !== cardId)
          throw new ConflictException({
            code: 'errorRequest',
            message: 'Cette requête correspond à une autre carte.',
          });
        return this.present(daily, progress);
      }
      const hintUsed =
        hintKind === 'reduce'
          ? progress.hint_used
          : hintKind === 'art'
            ? progress.art_used
            : progress.text_used;
      if (action === 'hint' && hintUsed) return this.present(daily, progress);
      if (action === 'abandon' && progress.status === 'abandoned')
        return this.present(daily, progress);
      if (progress.status !== 'playing')
        throw new ConflictException({
          code: 'errorFinished',
          message: 'Cette partie est déjà terminée.',
        });
      const target = daily.cards.find((card) => card.id === daily.answer_id)!;
      if (action === 'guess') {
        const card = daily.cards.find((c) => c.id === cardId);
        if (!card)
          throw new NotFoundException({
            code: 'errorCard',
            message: 'Cette carte ne fait pas partie du défi.',
          });
        if (
          progress.guesses.some((g) => g.card.id === cardId) ||
          progress.removed.includes(card.id)
        )
          throw new ConflictException({
            code: 'errorDuplicate',
            message: 'Cette carte ne peut plus être choisie.',
          });
        const guess = compareCard(card, target, requestId!);
        progress.guesses.push(guess);
        if (guess.won) progress.status = 'won';
      } else if (action === 'hint') {
        const threshold = HINT_THRESHOLDS[hintKind];
        if (progress.guesses.length < threshold)
          throw new ConflictException({
            code: 'errorHint',
            message: `Cet indice se débloque après ${threshold} erreurs.`,
          });
        if (hintKind === 'art') {
          if (!target.artCrop)
            throw new ConflictException({
              code: 'errorArt',
              message: 'Illustration indisponible pour cette carte.',
            });
          progress.art_used = true;
        } else if (hintKind === 'text') {
          if (target.oracleText === undefined || target.oracleText === null)
            throw new ConflictException({
              code: 'errorText',
              message: 'Texte de règles indisponible.',
            });
          progress.text_used = true;
        } else {
          const remaining = daily.cards.filter(
            (c) => !progress.guesses.some((g) => g.card.id === c.id),
          );
          const removable = remaining.filter((c) => c.id !== target.id);
          const count = Math.floor(remaining.length / 2);
          if (!count)
            throw new ConflictException({
              code: 'errorChoices',
              message: 'Il ne reste pas assez de cartes à retirer.',
            });
          for (let i = removable.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            [removable[i], removable[j]] = [removable[j], removable[i]];
          }
          progress.removed = removable.slice(0, count).map((c) => c.id);
          progress.hint_used = true;
        }
      } else progress.status = 'abandoned';
      await manager.query(
        'UPDATE classic_progress SET status=$3, guesses=$4::jsonb, removed=$5::jsonb, hint_used=$6, art_used=$7, text_used=$8 WHERE day=$1 AND session_id=$2',
        [
          day,
          session,
          progress.status,
          JSON.stringify(progress.guesses),
          JSON.stringify(progress.removed),
          progress.hint_used,
          progress.art_used,
          progress.text_used,
        ],
      );
      return this.present(daily, progress);
    });
  }

  // Authorize the crop separately so its source URL/printing ID is never in public state.
  async artSource(day: string, session: string): Promise<string> {
    return this.db.transaction(async (manager) => {
      const daily = await this.daily(manager, day);
      const progress = await this.progress(manager, day, session);
      if (!progress.art_used)
        throw new ConflictException({
          code: 'errorHint',
          message: 'Débloque d’abord l’indice illustration.',
        });
      const source = daily.cards.find((c) => c.id === daily.answer_id)?.artCrop;
      if (!source)
        throw new NotFoundException({
          code: 'errorArt',
          message: 'Illustration indisponible.',
        });
      return source;
    });
  }

  private publicCard(card: StoredCard): ClassicCard {
    const {
      id,
      name,
      image,
      previewImage,
      identity,
      mana,
      types,
      edition,
      rarity,
      released,
      keywords,
      activated,
    } = card;
    return {
      id,
      name,
      image,
      previewImage,
      identity,
      mana,
      types,
      edition,
      rarity,
      released,
      keywords,
      activated,
    };
  }

  private async ensureDay(manager: EntityManager, day: string): Promise<void> {
    // Advisory transaction lock makes the lazy daily creation safe across processes.
    await manager.query('SELECT pg_advisory_xact_lock(713294, hashtext($1))', [
      day,
    ]);
    const found: Daily[] = await manager.query(
      'SELECT day FROM classic_daily WHERE day=$1',
      [day],
    );
    if (found.length) return;
    const rows: { data: ClassicCard }[] = await manager.query(
      'SELECT data FROM classic_catalogue ORDER BY id',
    );
    if (!rows.length)
      throw new ServiceUnavailableException({
        code: 'errorCatalogue',
        message: 'Le catalogue de jeu doit être préparé.',
      });
    const cards = rows.map((row) => row.data);
    await manager.query(
      'INSERT INTO classic_daily(day, answer_id, cards) VALUES ($1,$2,$3::jsonb) ON CONFLICT DO NOTHING',
      [day, cards[randomInt(cards.length)].id, JSON.stringify(cards)],
    );
  }

  private async daily(manager: EntityManager, day: string): Promise<Daily> {
    const rows: Daily[] = await manager.query(
      'SELECT day, answer_id, cards FROM classic_daily WHERE day=$1',
      [day],
    );
    if (!rows[0])
      throw new NotFoundException({
        code: 'errorChallenge',
        message: 'Défi introuvable.',
      });
    return rows[0];
  }

  private async progress(
    manager: EntityManager,
    day: string,
    session: string,
  ): Promise<Progress> {
    await manager.query(
      'INSERT INTO classic_progress(day, session_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [day, session],
    );
    const rows: Progress[] = await manager.query(
      'SELECT status, guesses, removed, hint_used, art_used, text_used FROM classic_progress WHERE day=$1 AND session_id=$2 FOR UPDATE',
      [day, session],
    );
    return rows[0];
  }

  private async read(
    manager: EntityManager,
    day: string,
    session: string,
  ): Promise<ClassicState> {
    return this.present(
      await this.daily(manager, day),
      await this.progress(manager, day, session),
    );
  }

  private present(daily: Daily, progress: Progress): ClassicState {
    return {
      day: daily.day,
      expiresAt: nextMidnight(daily.day),
      status: progress.status,
      guesses: progress.guesses.map((g) => {
        const reference = daily.cards.find((c) => c.id === g.card.id);
        const card = this.publicCard({
          ...g.card,
          previewImage: reference?.previewImage,
          rarity: reference?.rarity ?? g.card.rarity,
        });
        const target = daily.cards.find((c) => c.id === daily.answer_id)!;
        return {
          ...g,
          card,
          matches: {
            ...g.matches,
            rarity: card.rarity === target.rarity ? 'exact' : 'different',
          },
        };
      }),
      choices:
        progress.status === 'playing'
          ? daily.cards
              .filter(
                (c) =>
                  !progress.removed.includes(c.id) &&
                  !progress.guesses.some((g) => g.card.id === c.id),
              )
              .map(({ id, name, image, previewImage }) => ({
                id,
                name,
                image,
                previewImage,
              }))
          : [],
      hints: (['reduce', 'art', 'text'] as const).map((kind) => {
        const used =
          kind === 'reduce'
            ? progress.hint_used
            : kind === 'art'
              ? progress.art_used
              : progress.text_used;
        const target = daily.cards.find((c) => c.id === daily.answer_id)!;
        const supported =
          kind === 'reduce'
            ? true
            : kind === 'art'
              ? !!target.artCrop
              : target.oracleText != null;
        return {
          kind,
          threshold: HINT_THRESHOLDS[kind],
          used,
          available:
            supported &&
            progress.status === 'playing' &&
            progress.guesses.length >= HINT_THRESHOLDS[kind] &&
            !used,
          ...(kind === 'art' && used ? { hasImage: true } : {}),
          ...(kind === 'text' && used
            ? {
                text: maskCardName(
                  target.oracleText || 'Aucun texte de règles.',
                  target.name,
                ),
              }
            : {}),
        };
      }),
      hint: {
        available:
          progress.status === 'playing' &&
          progress.guesses.length >= HINT_THRESHOLD &&
          !progress.hint_used,
        used: progress.hint_used,
        removed: progress.removed.length,
      },
      ...(progress.status === 'playing'
        ? {}
        : {
            answer: this.publicCard(
              daily.cards.find((c) => c.id === daily.answer_id)!,
            ),
          }),
    };
  }
}

export function maskCardName(text: string, name: string): string {
  const names = [
    name,
    ...(name.includes(',') ? [name.split(',')[0]] : []),
  ].sort((a, b) => b.length - a.length);
  for (const value of names)
    text = text.replace(
      new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      '[cette carte]',
    );
  return text;
}
