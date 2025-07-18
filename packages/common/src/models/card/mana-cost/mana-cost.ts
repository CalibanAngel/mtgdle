import { ApiProperty } from '@nestjs/swagger';
import { Color } from '../card.enum';
import { Exclude } from 'class-transformer';
import { Card } from '../card';

export class ManaCost {
  @Exclude()
  id: string;

  @ApiProperty({
    description:
      'The normalized cost, with correctly-ordered and wrapped mana symbols.',
  })
  cost: string;

  @ApiProperty({
    description: 'True if the cost is colorless.',
    type: 'boolean',
  })
  colorless: boolean;

  @ApiProperty({
    description: 'True if the cost is multicolored.',
    type: 'boolean',
  })
  multicolored: boolean;

  @ApiProperty({
    description: 'True if the cost is monocolored.',
    type: 'boolean',
  })
  monocolored: boolean;

  @ApiProperty({
    description: 'The colors of the given cost.',
  })
  colors: Color[];

  @ApiProperty({
    description:
      'The mana value. If you submit Un-set mana symbols, this decimal could include fractional parts.',
  })
  convertedManaCost: number;

  @Exclude()
  card: Card;

  @Exclude()
  createdAt: string;

  @Exclude()
  updatedAt: string;
}
