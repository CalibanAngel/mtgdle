import { maskCardName } from '../../packages/api/src/api/game/classic.store';
import {
  compareCard,
  matchSet,
  nextMidnight,
  parisDay,
  period,
} from '../../packages/api/src/api/game/classic.rules';
import type { ClassicCard } from '@mtgdle/shared-types';

const card: ClassicCard = {
  id: 'a',
  name: 'A',
  image: null,
  identity: [],
  mana: 2,
  types: ['Artifact'],
  edition: 'Alpha',
  released: '2001-01-01',
  keywords: [],
  activated: false,
};
describe('Classic comparisons', () => {
  it('compares identities as sets, including the empty identity', () => {
    expect(matchSet([], [])).toBe('exact');
    expect(matchSet(['W', 'U'], ['U', 'W'])).toBe('exact');
    expect(matchSet(['W'], ['W', 'U'])).toBe('partial');
    expect(matchSet([], ['U'])).toBe('different');
  });
  it('points toward the target value and uses non-overlapping two-year periods', () => {
    const result = compareCard(
      card,
      { ...card, id: 'b', mana: 4, released: '2002-01-01' },
      'request',
    );
    expect(result.won).toBe(false);
    expect(result.matches.mana).toBe('higher');
    expect(result.matches.period).toBe('higher');
    expect(period(2001)).toBe('2000–2001');
    expect(period(2002)).toBe('2002–2003');
  });
  it('never treats identical characteristics as a win for a different card', () => {
    expect(compareCard(card, { ...card, id: 'b' }, 'request').won).toBe(false);
    expect(compareCard(card, card, 'request').won).toBe(true);
  });
  it('compares types and keywords partially and activated abilities exactly', () => {
    const result = compareCard(
      { ...card, types: ['Artifact', 'Creature'], keywords: ['Flying'] },
      {
        ...card,
        types: ['Creature'],
        keywords: ['Flying', 'Haste'],
        activated: true,
      },
      'request',
    );
    expect(result.matches).toMatchObject({
      types: 'partial',
      keywords: 'partial',
      activated: 'different',
    });
  });
  it('keeps the same period across different years inside its range', () => {
    expect(
      compareCard(card, { ...card, released: '2000-01-01' }, 'request').matches
        .period,
    ).toBe('exact');
  });
  it('uses Paris dates and handles daylight-saving boundaries at midnight', () => {
    expect(parisDay(new Date('2026-10-28T23:30:00Z'))).toBe('2026-10-29');
    expect(nextMidnight('2026-03-28')).toBe('2026-03-28T23:00:00.000Z');
    expect(nextMidnight('2026-03-29')).toBe('2026-03-29T22:00:00.000Z');
    expect(nextMidnight('2026-10-25')).toBe('2026-10-25T23:00:00.000Z');
  });
});

describe('Rules-text hint redaction', () => {
  it('masks the full card name and its shortened legendary reference', () => {
    expect(
      maskCardName(
        'Atraxa, Praetors’ Voice has flying. Whenever Atraxa attacks, draw a card.',
        'Atraxa, Praetors’ Voice',
      ),
    ).toBe(
      '[cette carte] has flying. Whenever [cette carte] attacks, draw a card.',
    );
  });
  it('handles regex characters in names literally', () => {
    expect(maskCardName('A+B deals damage. AAB stays.', 'A+B')).toBe(
      '[cette carte] deals damage. AAB stays.',
    );
  });
});
