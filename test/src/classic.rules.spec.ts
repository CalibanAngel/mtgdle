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
  rarity: 'rare',
  released: '2001-01-01',
  keywords: [],
  activated: false,
};
describe('Classic comparisons', () => {
  it('should compare rarity without ranking when evaluating card guesses', () => {
    expect(compareCard(card, card, 'request').matches.rarity).toBe('exact');
    expect(
      compareCard(card, { ...card, rarity: 'common' }, 'request').matches
        .rarity,
    ).toBe('different');
    expect(
      compareCard(card, { ...card, rarity: 'mythic' }, 'request').matches
        .rarity,
    ).toBe('different');
  });
  it('should compare identities as sets when colors are reordered, missing or empty', () => {
    expect(matchSet([], [])).toBe('exact');
    expect(matchSet(['W', 'U'], ['U', 'W'])).toBe('exact');
    expect(matchSet(['W'], ['W', 'U'])).toBe('partial');
    expect(matchSet([], ['U'])).toBe('different');
  });
  it('should indicate the target direction when comparing mana values and two-year periods', () => {
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
  it('should reject a false victory when different cards have identical characteristics', () => {
    expect(compareCard(card, { ...card, id: 'b' }, 'request').won).toBe(false);
    expect(compareCard(card, card, 'request').won).toBe(true);
  });
  it('should distinguish partial and exact matches when comparing abilities and card types', () => {
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
  it('should match the release period when both years belong to the same range', () => {
    expect(
      compareCard(card, { ...card, released: '2000-01-01' }, 'request').matches
        .period,
    ).toBe('exact');
  });
  it('should use Paris midnight when calculating daily boundaries across daylight-saving changes', () => {
    expect(parisDay(new Date('2026-10-28T23:30:00Z'))).toBe('2026-10-29');
    expect(nextMidnight('2026-03-28')).toBe('2026-03-28T23:00:00.000Z');
    expect(nextMidnight('2026-03-29')).toBe('2026-03-29T22:00:00.000Z');
    expect(nextMidnight('2026-10-25')).toBe('2026-10-25T23:00:00.000Z');
  });
});

describe('Rules-text hint redaction', () => {
  it('should mask full and shortened names when redacting legendary card text', () => {
    expect(
      maskCardName(
        'Atraxa, Praetors’ Voice has flying. Whenever Atraxa attacks, draw a card.',
        'Atraxa, Praetors’ Voice',
      ),
    ).toBe(
      '[cette carte] has flying. Whenever [cette carte] attacks, draw a card.',
    );
  });
  it('should treat regex characters literally when redacting card names', () => {
    expect(maskCardName('A+B deals damage. AAB stays.', 'A+B')).toBe(
      '[cette carte] deals damage. AAB stays.',
    );
  });
});
