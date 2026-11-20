import {
  Injectable,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ClassicRepository,
  ClassicTransaction,
} from '../../models/classic-progress/classic.repository';
import { ClassicDaily as Daily } from '../../models/classic-daily/classic-daily';
import { ClassicProgress as Progress } from '../../models/classic-progress/classic-progress';
import type { ClassicCard as StoredCard } from '../../models/classic-catalogue/classic-card';
import { randomInt } from 'node:crypto';
import { ClassicStatus } from '@mtgdle/shared-types';
import type {
  ClassicCard,
  ClassicState,
  ClassicStatistics,
  HintKind,
} from '@mtgdle/shared-types';
import {
  compareCard,
  HINT_THRESHOLD,
  HINT_THRESHOLDS,
  nextMidnight,
  parisDay,
} from './classic.rules';

@Injectable()
export class ClassicStore {
  constructor(private readonly repository: ClassicRepository) {}

  async state(session: string): Promise<ClassicState> {
    return this.repository.transaction(async (manager) => {
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
    return this.repository.transaction(async (manager) => {
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
        return this.present(manager, daily, progress);
      }
      const hintUsed =
        hintKind === 'reduce'
          ? progress.hintUsed
          : hintKind === 'art'
            ? progress.artUsed
            : progress.textUsed;
      if (action === 'hint' && hintUsed)
        return this.present(manager, daily, progress);
      if (action === 'abandon' && progress.status === ClassicStatus.Abandoned)
        return this.present(manager, daily, progress);
      if (progress.status !== ClassicStatus.Playing)
        throw new ConflictException({
          code: 'errorFinished',
          message: 'Cette partie est déjà terminée.',
        });
      const target = daily.cards.find((card) => card.id === daily.answerId)!;
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
        if (guess.won) progress.status = ClassicStatus.Won;
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
          progress.artUsed = true;
        } else if (hintKind === 'text') {
          if (target.oracleText === undefined || target.oracleText === null)
            throw new ConflictException({
              code: 'errorText',
              message: 'Texte de règles indisponible.',
            });
          progress.textUsed = true;
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
          progress.hintUsed = true;
        }
      } else progress.status = ClassicStatus.Abandoned;
      await manager.saveProgress(progress);
      return this.present(manager, daily, progress);
    });
  }

  // Authorize the crop separately so its source URL/printing ID is never in public state.
  async artSource(day: string, session: string): Promise<string> {
    return this.repository.transaction(async (manager) => {
      const daily = await this.daily(manager, day);
      const progress = await this.progress(manager, day, session);
      if (!progress.artUsed)
        throw new ConflictException({
          code: 'errorHint',
          message: 'Débloque d’abord l’indice illustration.',
        });
      const source = daily.cards.find((c) => c.id === daily.answerId)?.artCrop;
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

  private async ensureDay(
    manager: ClassicTransaction,
    day: string,
  ): Promise<void> {
    if (await manager.findDaily(day)) return;
    const cards = await manager.catalogueCards();
    if (!cards.length)
      throw new ServiceUnavailableException({
        code: 'errorCatalogue',
        message: 'Le catalogue de jeu doit être préparé.',
      });
    await manager.insertDaily(day, cards[randomInt(cards.length)].id, cards);
  }

  private async daily(
    manager: ClassicTransaction,
    day: string,
  ): Promise<Daily> {
    const daily = await manager.findDaily(day);
    if (!daily)
      throw new NotFoundException({
        code: 'errorChallenge',
        message: 'Défi introuvable.',
      });
    return daily;
  }

  private progress(
    manager: ClassicTransaction,
    day: string,
    session: string,
  ): Promise<Progress> {
    return manager.progressForUpdate(day, session);
  }
  private async read(
    manager: ClassicTransaction,
    day: string,
    session: string,
  ): Promise<ClassicState> {
    return this.present(
      manager,
      await this.daily(manager, day),
      await this.progress(manager, day, session),
    );
  }

  private async statistics(
    manager: ClassicTransaction,
    day: string,
    progress: Progress,
  ): Promise<ClassicStatistics> {
    const players = await manager.listProgress(day);
    const participants = players.filter(
      (player) => player.guesses.length > 0,
    ).length;
    const winners = players.filter(
      (player) => player.status === ClassicStatus.Won,
    );
    const counts = new Map<string, number>();
    const selected = new Set(progress.guesses.map((guess) => guess.card.id));
    for (const player of players) {
      for (const cardId of new Set(
        player.guesses.map((guess) => guess.card.id),
      )) {
        if (selected.has(cardId))
          counts.set(cardId, (counts.get(cardId) || 0) + 1);
      }
    }
    return {
      participants,
      solved: winners.length,
      abandoned: players.filter(
        (player) => player.status === ClassicStatus.Abandoned,
      ).length,
      averageWinningGuesses: winners.length
        ? winners.reduce((sum, player) => sum + player.guesses.length, 0) /
          winners.length
        : null,
      guessPercentages: Object.fromEntries(
        [...counts].map(([id, count]) => [
          id,
          participants ? (100 * count) / participants : 0,
        ]),
      ),
    };
  }
  private async present(
    manager: ClassicTransaction,
    daily: Daily,
    progress: Progress,
  ): Promise<ClassicState> {
    return {
      ...(progress.status === ClassicStatus.Playing
        ? {}
        : { statistics: await this.statistics(manager, daily.day, progress) }),
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
        const target = daily.cards.find((c) => c.id === daily.answerId)!;
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
        progress.status === ClassicStatus.Playing
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
            ? progress.hintUsed
            : kind === 'art'
              ? progress.artUsed
              : progress.textUsed;
        const target = daily.cards.find((c) => c.id === daily.answerId)!;
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
            progress.status === ClassicStatus.Playing &&
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
          progress.status === ClassicStatus.Playing &&
          progress.guesses.length >= HINT_THRESHOLD &&
          !progress.hintUsed,
        used: progress.hintUsed,
        removed: progress.removed.length,
      },
      ...(progress.status === ClassicStatus.Playing
        ? {}
        : {
            answer: this.publicCard(
              daily.cards.find((c) => c.id === daily.answerId)!,
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
