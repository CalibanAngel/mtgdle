import { ScryfallCard } from '@scryfall/api-types';
import { Card } from '../../../../../../src/models/card/card';
import { scryfallAnyCardToCard } from '../../../../../../src/infrastructure/external/scryfall/card/scryfall-card-to-card.mapper';
import {
  BorderColor,
  Color,
  GameName,
  Layout,
  Rarity,
} from '../../../../../../src/models/card/card.enum';
import { scryfallSplitCard } from './multi-face-card.fake-data';
import { scryfallNormalCard } from './single-face-card.fake-data';

type EachType = {
  param: ScryfallCard.Any;
  expected: Partial<Card>;
};

const splitCard = {
  borderColor: BorderColor.BLACK,
  layout: Layout.Split,
  cardFaces: [
    {
      imageUris: {
        borderCrop:
          'https://cards.scryfall.io/border_crop/front/4/b/4bb07091-86d6-4735-82b6-6e71e26710f4.jpg?1593273942',
        large:
          'https://cards.scryfall.io/large/front/4/b/4bb07091-86d6-4735-82b6-6e71e26710f4.jpg?1593273942',
        normal:
          'https://cards.scryfall.io/normal/front/4/b/4bb07091-86d6-4735-82b6-6e71e26710f4.jpg?1593273942',
        png: 'https://cards.scryfall.io/png/front/4/b/4bb07091-86d6-4735-82b6-6e71e26710f4.png?1593273942',
        small:
          'https://cards.scryfall.io/small/front/4/b/4bb07091-86d6-4735-82b6-6e71e26710f4.jpg?1593273942',
      },
      manaCost: '{U}{R} // {3}{R}{W}',
      typeLine: 'Instant // Instant',
    },
  ],
  colorIdentity: [Color.RED, Color.BLUE, Color.WHITE],
  convertedManaCost: 7,
  games: [GameName.PAPER, GameName.MTGO],
  id: '4bb07091-86d6-4735-82b6-6e71e26710f4',
  keywords: [],
  legalities: {
    alchemy: 'not_legal',
    brawl: 'not_legal',
    commander: 'legal',
    duel: 'legal',
    explorer: 'not_legal',
    future: 'not_legal',
    gladiator: 'not_legal',
    historic: 'not_legal',
    legacy: 'legal',
    modern: 'legal',
    oathbreaker: 'legal',
    oldschool: 'not_legal',
    pauper: 'not_legal',
    paupercommander: 'not_legal',
    penny: 'legal',
    pioneer: 'not_legal',
    predh: 'legal',
    premodern: 'not_legal',
    standard: 'not_legal',
    standardbrawl: 'not_legal',
    timeless: 'not_legal',
    vintage: 'legal',
  },
  name: 'Odds // Ends',
  rarity: Rarity.RARE,
  releasedDate: '2006-05-05',
  reprint: false,
  scryfallUri: 'https://scryfall.com/card/dis/153/odds-ends?utm_source=api',
  setId: 'fdebeda1-b95f-4343-8a94-d125821e6b5c',
} as unknown as Card;

const normaleCard = {
  id: 'f57fd4c9-0004-4f71-a30f-2720943f57ca',
  name: 'Strip Mine',
  releasedDate: '2014-06-16',
  scryfallUri: 'https://scryfall.com/card/vma/316/strip-mine?utm_source=api',
  rarity: 'rare',
  convertedManaCost: 0,
  detailedManaCost: undefined,
  setId: 'a944551a-73fa-41cd-9159-e8d0e4674403',
  set: undefined,
  legalities: {
    standard: 'not_legal',
    future: 'not_legal',
    historic: 'not_legal',
    timeless: 'not_legal',
    gladiator: 'not_legal',
    pioneer: 'not_legal',
    explorer: 'not_legal',
    modern: 'not_legal',
    legacy: 'banned',
    pauper: 'not_legal',
    vintage: 'restricted',
    penny: 'not_legal',
    commander: 'legal',
    oathbreaker: 'legal',
    standardbrawl: 'not_legal',
    brawl: 'not_legal',
    alchemy: 'not_legal',
    paupercommander: 'not_legal',
    duel: 'banned',
    oldschool: 'not_legal',
    premodern: 'banned',
    predh: 'legal',
  },
  keywords: [],
  reprint: true,
  borderColor: 'black',
  colors: [],
  colorIdentity: [],
  layout: 'normal',
  games: ['mtgo'],
  cardFaces: [
    {
      id: undefined,
      cardId: undefined,
      name: undefined,
      typeLine: 'Land',
      manaCost: '',
      imageUris: {
        borderCrop:
          'https://cards.scryfall.io/border_crop/front/f/5/f57fd4c9-0004-4f71-a30f-2720943f57ca.jpg?1562944463',
        large:
          'https://cards.scryfall.io/large/front/f/5/f57fd4c9-0004-4f71-a30f-2720943f57ca.jpg?1562944463',
        normal:
          'https://cards.scryfall.io/normal/front/f/5/f57fd4c9-0004-4f71-a30f-2720943f57ca.jpg?1562944463',
        png: 'https://cards.scryfall.io/png/front/f/5/f57fd4c9-0004-4f71-a30f-2720943f57ca.png?1562944463',
        small:
          'https://cards.scryfall.io/small/front/f/5/f57fd4c9-0004-4f71-a30f-2720943f57ca.jpg?1562944463',
      },
      power: undefined,
      toughness: undefined,
      loyalty: undefined,
      description:
        '{T}: Add {C}.\n{T}, Sacrifice this land: Destroy target land.',
      flavorText:
        'Unlike previous conflicts, the war between Urza and Mishra made Dominaria itself a casualty of war.',
    },
  ],
} as unknown as Card;

describe('Scryfall Card Mapper', () => {
  it.each<EachType>([
    { param: scryfallSplitCard, expected: splitCard },
    { param: scryfallNormalCard, expected: normaleCard },
  ])('should parse a $param.layout card', ({ param, expected }) => {
    const result = scryfallAnyCardToCard(param);

    expect(result).toEqual(expect.objectContaining(expected));
  });
});
