// The catalogue script is also used as a pure mapping helper in these tests.
const { hasActivated, standard, toClassicCard } =
  require('../../scripts/prepare-classic.cjs') as {
    toClassicCard: (
      id: string,
      first: object,
      art: object,
    ) => { rarity: string; image: string; edition: string; released: string };
    hasActivated: (card: {
      oracle_text?: string;
      keywords?: string[];
    }) => boolean;
    standard: (card: {
      promo?: boolean;
      full_art?: boolean;
      border_color?: string;
      frame_effects?: string[];
    }) => boolean;
  };

describe('Classic catalogue eligibility', () => {
  it('uses the displayed standard printing rarity when an earlier promo has a different rarity', () => {
    const promo = {
      name: 'Go for the Throat',
      rarity: 'rare',
      set_name: 'Friday Night Magic 2011',
      released_at: '2011-01-01',
      type_line: 'Instant',
    };
    const standardPrinting = {
      rarity: 'uncommon',
      image_uris: { small: '/mbs-small.jpg', normal: '/mbs-normal.jpg' },
    };
    expect(toClassicCard('oracle-id', promo, standardPrinting)).toMatchObject({
      rarity: 'uncommon',
      image: '/mbs-small.jpg',
      edition: 'Friday Night Magic 2011',
      released: '2011-01-01',
    });
  });
  it('keeps standard art and rejects special treatments', () => {
    expect(standard({ border_color: 'black' })).toBe(true);
    expect(standard({ border_color: 'white' })).toBe(true);
    expect(standard({ border_color: 'borderless' })).toBe(false);
    expect(standard({ frame_effects: ['showcase'] })).toBe(false);
    expect(standard({ frame_effects: ['extendedart'] })).toBe(false);
    expect(standard({ full_art: true })).toBe(false);
    expect(standard({ promo: true })).toBe(false);
  });
  it('distinguishes activated abilities from granted abilities and reminder text', () => {
    expect(hasActivated({ oracle_text: '{T}: Add {U}.' })).toBe(true);
    expect(
      hasActivated({
        oracle_text: 'Creatures you control have "{T}: Add {G}."',
      }),
    ).toBe(false);
    expect(
      hasActivated({
        oracle_text: 'Flying (This is reminder text: not an ability.)',
      }),
    ).toBe(false);
    expect(
      hasActivated({
        oracle_text: 'Whenever this creature attacks, draw a card.',
      }),
    ).toBe(false);
    expect(
      hasActivated({ keywords: ['Equip'], oracle_text: 'Equip {2}' }),
    ).toBe(true);
    expect(hasActivated({ keywords: ['Ward'], oracle_text: 'Ward {2}' })).toBe(
      false,
    );
  });
});
