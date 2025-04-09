import { ApiProperty } from '@nestjs/swagger';
import { Legality } from './card.enum';

export class Legalities {
  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Standard format.',
  })
  standard: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.NotLegal,
    description: 'Legal status for Future format.',
  })
  future: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Restricted,
    description: 'Legal status for Historic format.',
  })
  historic: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Gladiator format.',
  })
  gladiator: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Pioneer format.',
  })
  pioneer: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Explorer format.',
  })
  explorer: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Modern format.',
  })
  modern: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Banned,
    description: 'Legal status for Legacy format.',
  })
  legacy: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Pauper format.',
  })
  pauper: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Vintage format.',
  })
  vintage: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Penny format.',
  })
  penny: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Commander format.',
  })
  commander: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.NotLegal,
    description: 'Legal status for Oathbreaker format.',
  })
  oathbreaker: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Brawl format.',
  })
  brawl: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Historic Brawl format.',
  })
  historicbrawl: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Alchemy format.',
  })
  alchemy: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.NotLegal,
    description: 'Legal status for Pauper Commander format.',
  })
  paupercommander: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Duel format.',
  })
  duel: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.NotLegal,
    description: 'Legal status for Old School format.',
  })
  oldschool: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Premodern format.',
  })
  premodern: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Predh format.',
  })
  predh: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Timeless format.',
  })
  timeless: Legality;

  @ApiProperty({
    enum: Legality,
    example: Legality.Legal,
    description: 'Legal status for Standard brawl format.',
  })
  standardbrawl: Legality;
}
