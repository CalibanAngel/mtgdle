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
} from '@mtgdle/shared-types';
import {
  compareCard,
  HINT_THRESHOLD,
  nextMidnight,
  parisDay,
} from './classic.rules';

interface Daily {
  day: string;
  answer_id: string;
  cards: ClassicCard[];
}
interface Progress {
  status: ClassicState['status'];
  guesses: ClassicGuess[];
  removed: string[];
  hint_used: boolean;
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
  ): Promise<ClassicState> {
    if (day !== parisDay())
      throw new ConflictException(
        'Ce défi est terminé. Charge le nouveau défi.',
      );
    return this.db.transaction(async (manager) => {
      const daily = await this.daily(manager, day);
      const progress = await this.progress(manager, day, session);
      if (day !== parisDay())
        throw new ConflictException('Le défi a changé. Recharge la page.');
      if (
        action === 'guess' &&
        progress.guesses.some((g) => g.requestId === requestId)
      ) {
        const original = progress.guesses.find(
          (g) => g.requestId === requestId,
        )!;
        if (original.card.id !== cardId)
          throw new ConflictException(
            'Cette requête correspond à une autre carte.',
          );
        return this.present(daily, progress);
      }
      if (action === 'hint' && progress.hint_used)
        return this.present(daily, progress);
      if (action === 'abandon' && progress.status === 'abandoned')
        return this.present(daily, progress);
      if (progress.status !== 'playing')
        throw new ConflictException('Cette partie est déjà terminée.');
      const target = daily.cards.find((card) => card.id === daily.answer_id)!;
      if (action === 'guess') {
        const card = daily.cards.find((c) => c.id === cardId);
        if (!card)
          throw new NotFoundException(
            'Cette carte ne fait pas partie du défi.',
          );
        if (
          progress.guesses.some((g) => g.card.id === cardId) ||
          progress.removed.includes(card.id)
        )
          throw new ConflictException('Cette carte ne peut plus être choisie.');
        const guess = compareCard(card, target, requestId!);
        progress.guesses.push(guess);
        if (guess.won) progress.status = 'won';
      } else if (action === 'hint') {
        if (progress.guesses.length < HINT_THRESHOLD)
          throw new ConflictException('L’indice se débloque après 10 erreurs.');
        const remaining = daily.cards.filter(
          (c) => !progress.guesses.some((g) => g.card.id === c.id),
        );
        const removable = remaining.filter((c) => c.id !== target.id);
        const count = Math.floor(remaining.length / 2);
        if (!count)
          throw new ConflictException(
            'Il ne reste pas assez de cartes à retirer.',
          );
        for (let i = removable.length - 1; i > 0; i--) {
          const j = randomInt(i + 1);
          [removable[i], removable[j]] = [removable[j], removable[i]];
        }
        progress.removed = removable.slice(0, count).map((c) => c.id);
        progress.hint_used = true;
      } else progress.status = 'abandoned';
      await manager.query(
        'UPDATE classic_progress SET status=$3, guesses=$4::jsonb, removed=$5::jsonb, hint_used=$6 WHERE day=$1 AND session_id=$2',
        [
          day,
          session,
          progress.status,
          JSON.stringify(progress.guesses),
          JSON.stringify(progress.removed),
          progress.hint_used,
        ],
      );
      return this.present(daily, progress);
    });
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
      throw new ServiceUnavailableException(
        'Le catalogue de jeu doit être préparé.',
      );
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
    if (!rows[0]) throw new NotFoundException('Défi introuvable.');
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
      'SELECT status, guesses, removed, hint_used FROM classic_progress WHERE day=$1 AND session_id=$2 FOR UPDATE',
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
      guesses: progress.guesses,
      choices:
        progress.status === 'playing'
          ? daily.cards
              .filter(
                (c) =>
                  !progress.removed.includes(c.id) &&
                  !progress.guesses.some((g) => g.card.id === c.id),
              )
              .map(({ id, name, image }) => ({ id, name, image }))
          : [],
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
        : { answer: daily.cards.find((c) => c.id === daily.answer_id)! }),
    };
  }
}
