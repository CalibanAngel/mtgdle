import { ApiProperty } from '@nestjs/swagger';

export enum ColorIdentity {
  WHITE = 'W',
  BLUE = 'U',
  BLACK = 'B',
  RED = 'R',
  GREEN = 'G',
}

export class ManaCost {
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
  colors: ColorIdentity[];

  @ApiProperty({
    description:
      'The mana value. If you submit Un-set mana symbols, this decimal could include fractional parts.',
  })
  convertedManaCost: number;
}
