import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { SetType } from './set.enum';
import { Card } from '../card/card';

export class CardSet {
  @ApiProperty({
    description: 'The name of the set.',
    type: 'string',
    example: 'Vintage Masters',
  })
  name: string;

  @ApiProperty({
    description: 'This card’s Set object UUID.',
    type: 'string',
    example: 'a944551a-73fa-41cd-9159-e8d0e4674403',
  })
  id: string;

  @ApiProperty({
    description: 'This card’s set code.',
    type: 'string',
    example: 'vma',
  })
  code: string;

  @ApiProperty({
    description:
      'The date the set was released or the first card was printed in the set (in GMT-8 Pacific time).',
    type: 'string',
    required: false,
  })
  releasedAt?: string;

  @ApiProperty({
    description: 'The number of cards in this set.',
    type: 'number',
  })
  cardCount: number;

  @ApiProperty({
    description: 'The number of cards in this set.',
    enumName: 'SetType',
    enum: SetType,
  })
  setType: SetType;

  @ApiProperty({
    description: 'A link to this set’s permapage on Scryfall’s website.',
    type: 'string',
  })
  scryfallUri: string;

  @ApiProperty({
    description:
      'A URI to an SVG file for this set’s icon on Scryfall’s CDN. Hotlinking this image isn’t recommended, because it may change slightly over time. You should download it and use it locally for your particular user interface needs.',
    type: 'string',
  })
  iconSVGuri: string;

  @Exclude()
  cards: Card[];

  @Exclude()
  createdAt: string;

  @Exclude()
  updatedAt: string;
}
