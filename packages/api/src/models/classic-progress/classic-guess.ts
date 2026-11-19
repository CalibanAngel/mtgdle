import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type {
  ClassicGuess as ClassicGuessContract,
  Criterion,
  Match,
} from '@mtgdle/shared-types';
import { ClassicCard } from '../classic-catalogue/classic-card';

const matchValues: Match[] = [
  'exact',
  'partial',
  'different',
  'higher',
  'lower',
];

export class ClassicComparison implements Record<Criterion, Match> {
  @ApiProperty({ description: 'Color identity comparison.', enum: matchValues })
  identity: Match;

  @ApiProperty({
    description:
      'Mana value comparison; higher/lower gives the direction of the answer.',
    enum: matchValues,
  })
  mana: Match;

  @ApiProperty({ description: 'Card type comparison.', enum: matchValues })
  types: Match;

  @ApiProperty({ description: 'Edition comparison.', enum: matchValues })
  edition: Match;

  @ApiProperty({ description: 'Release period comparison.', enum: matchValues })
  period: Match;

  @ApiProperty({
    description: 'Keyword ability comparison.',
    enum: matchValues,
  })
  keywords: Match;

  @ApiProperty({
    description: 'Activated ability comparison.',
    enum: matchValues,
  })
  activated: Match;

  @ApiProperty({
    description: 'Reference printing rarity comparison.',
    enum: matchValues,
  })
  rarity: Match;
}

export class ClassicGuess implements ClassicGuessContract {
  @ApiProperty({
    description: 'Client request ID used to make retries idempotent.',
    format: 'uuid',
  })
  requestId: string;

  @ApiProperty({
    description: 'The card submitted by the player.',
    type: () => ClassicCard,
  })
  @Type(() => ClassicCard)
  card: ClassicCard;

  @ApiProperty({
    description: 'Comparison with the daily answer for each criterion.',
    type: () => ClassicComparison,
  })
  @Type(() => ClassicComparison)
  matches: ClassicComparison;

  @ApiProperty({
    description: 'Whether this guess solved the daily challenge.',
  })
  won: boolean;
}
