import { ApiProperty } from '@nestjs/swagger';
import { ManaCost } from './mana-cost/mana-cost';
import { CardSet } from '../set/set';
import { BorderColor, Color, GameName, Layout, Rarity } from './card.enum';
import { Legalities } from './card.interface';
import { Exclude } from 'class-transformer';
import { CardFace } from './card-face/card-face';
import { PlayableCard } from '../playable-card/playable-card';

export class Card {
  @ApiProperty({
    description: 'A unique ID for this card in Scryfall’s database.',
    type: 'string',
    example: 'bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd',
  })
  id: string;

  @ApiProperty({
    description:
      'The name of this card. If this card has multiple faces, this field will contain both names separated by ␣//␣.',
    type: 'string',
    example: 'Black Lotus',
  })
  name: string;

  @ApiProperty({
    description: 'The date this card was first released.',
    type: 'string',
    example: '2014-06-16',
  })
  releasedDate: string;

  @ApiProperty({
    description: 'A link to this card’s permapage on Scryfall’s website.',
    type: 'string',
    example: 'https://scryfall.com/card/vma/4/black-lotus?utm_source=api',
  })
  scryfallUri: string;

  @ApiProperty({
    description:
      'This card’s rarity. One of common, uncommon, rare, special, mythic, or bonus.',
    enum: Rarity,
    enumName: 'Rarity',
    example: Rarity.RARE,
  })
  rarity: Rarity;

  @ApiProperty({
    description:
      'The card’s mana value. Note that some funny cards have fractional mana costs.',
    type: 'number',
    example: 0,
  })
  convertedManaCost: number;

  @ApiProperty({
    description: '',
  })
  detailedManaCost: ManaCost;

  @Exclude()
  setId: string;

  @Exclude()
  set: CardSet;

  @ApiProperty({
    description:
      'An object describing the legality of this card across play formats.',
    type: Legalities,
  })
  legalities: Legalities;

  @ApiProperty({
    description:
      "An array of keywords that this card uses, such as 'Flying' and 'Cumulative upkeep'.",
    isArray: true,
    example: ['Flying'],
  })
  keywords: string[];

  @ApiProperty({
    description: 'True if this card is a reprint.',
    type: 'boolean',
  })
  reprint: boolean;

  @ApiProperty({
    description:
      'This card’s border color: black, white, borderless, yellow, silver, or gold.',
    enum: BorderColor,
    enumName: 'BorderColor',
  })
  borderColor: BorderColor;

  @ApiProperty({
    description:
      'This card’s colors, if the overall card has colors defined by the rules. Empty array if the card has no colors.',
    isArray: true,
    enumName: 'Color',
    example: [],
  })
  colors: Color[];

  @ApiProperty({
    description:
      'This card’s color identity. Empty array if the card has no colors.',
    isArray: true,
    enumName: 'Color',
    example: [],
  })
  colorIdentity: Color[];

  // we only take single sided cards for now
  @Exclude()
  layout: Layout;

  @ApiProperty({
    description: 'Rank of the card on EDHrc',
    type: 'number',
    nullable: true,
  })
  edhrcRank: number | null

  @ApiProperty({
    description:
      'A list of games that this card print is available in, paper, arena, and/or mtgo.',
    isArray: true,
    enumName: 'GameName',
    enum: GameName,
  })
  games: GameName[];

  @ApiProperty({
    description: 'Gameplay info of the card.',
    type: CardFace,
    isArray: true,
  })
  cardFaces: CardFace[];

  @Exclude()
  playableCard?: PlayableCard

  @ApiProperty({
    description: 'Is the card playable',
    type: 'boolean',
  })
  get isPlayable(): boolean {
    return !!this.playableCard;
  }

  @Exclude()
  createdAt: string;

  @Exclude()
  updatedAt: string;
}
