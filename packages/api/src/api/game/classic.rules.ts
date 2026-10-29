import type { ClassicCard, ClassicGuess, Match } from '@mtgdle/shared-types';

export const HINT_THRESHOLD = 10;
export const HINT_THRESHOLDS = { reduce: 10, art: 15, text: 20 } as const;

export function matchSet(proposal: string[], target: string[]): Match {
  const a = new Set(proposal);
  const b = new Set(target);
  if (a.size === b.size && [...a].every((value) => b.has(value)))
    return 'exact';
  return [...a].some((value) => b.has(value)) ? 'partial' : 'different';
}

export function compareNumber(proposal: number, target: number): Match {
  return proposal === target ? 'exact' : target > proposal ? 'higher' : 'lower';
}

export function period(year: number): string {
  const start = 2 * Math.floor(year / 2);
  return `${start}–${start + 1}`;
}

export function compareCard(
  card: ClassicCard,
  target: ClassicCard,
  requestId: string,
): ClassicGuess {
  return {
    requestId,
    card,
    won: card.id === target.id,
    matches: {
      identity: matchSet(card.identity, target.identity),
      mana: compareNumber(card.mana, target.mana),
      types: matchSet(card.types, target.types),
      edition: card.edition === target.edition ? 'exact' : 'different',
      period: compareNumber(
        Math.floor(Number(card.released.slice(0, 4)) / 2),
        Math.floor(Number(target.released.slice(0, 4)) / 2),
      ),
      keywords: matchSet(card.keywords, target.keywords),
      activated: card.activated === target.activated ? 'exact' : 'different',
    },
  };
}

export function parisDay(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function nextMidnight(day: string): string {
  const nextUtc = new Date(`${day}T00:00:00Z`);
  nextUtc.setUTCDate(nextUtc.getUTCDate() + 1);
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(nextUtc);
  return new Date(nextUtc.getTime() - Number(hour) * 3600000).toISOString();
}
