import { CardSet } from '../../../../../../src/models/set/set';
import { scryfallSetToSetMapper } from '../../../../../../src/infrastructure/external/scryfall/set/scryfall-set-to-set.mapper';
import { ScryfallSet } from '@scryfall/api-types';

describe('scryfallSetToSetMapper', () => {
  it('should correctly map a ScryfallSet to a CardSet', () => {
    const fakeScryfallSet = {
      id: 'set1',
      name: 'Test Set',
      code: 'TS1',
      released_at: '2023-01-01',
      card_count: 100,
      set_type: 'core', // adjust if you have a specific enum
      scryfall_uri: 'http://scryfall.com/set1',
      icon_svg_uri: 'http://scryfall.com/set1/icon.svg',
    } as ScryfallSet;

    const result: CardSet = scryfallSetToSetMapper(fakeScryfallSet);

    expect(result.id).toEqual(fakeScryfallSet.id);
    expect(result.name).toEqual(fakeScryfallSet.name);
    expect(result.code).toEqual(fakeScryfallSet.code);
    expect(result.releasedAt).toEqual(fakeScryfallSet.released_at);
    expect(result.cardCount).toEqual(fakeScryfallSet.card_count);
    expect(result.setType).toEqual(fakeScryfallSet.set_type);
    expect(result.scryfallUri).toEqual(fakeScryfallSet.scryfall_uri);
    expect(result.iconSVGuri).toEqual(fakeScryfallSet.icon_svg_uri);
  });
});
