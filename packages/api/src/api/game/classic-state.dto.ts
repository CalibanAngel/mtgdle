import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ClassicStatus } from '@mtgdle/shared-types';
import type {
  ClassicHint,
  ClassicState,
  ClassicStatistics,
  HintKind,
} from '@mtgdle/shared-types';
import { ClassicCard } from '../../models/classic-catalogue/classic-card';
import { ClassicGuess } from '../../models/classic-progress/classic-guess';

export class ClassicChoiceDto extends PickType(ClassicCard, [
  'id',
  'name',
  'image',
  'previewImage',
] as const) {}

export class ClassicHintResultDto implements ClassicHint {
  @ApiProperty({
    description: 'Hint category.',
    enum: ['reduce', 'art', 'text'],
  })
  kind: HintKind;

  @ApiProperty({
    description: 'Number of incorrect guesses required to unlock this hint.',
    minimum: 0,
    example: 10,
  })
  threshold: number;

  @ApiProperty({
    description: 'Whether the player can currently activate this hint.',
  })
  available: boolean;

  @ApiProperty({ description: 'Whether the hint has already been activated.' })
  used: boolean;

  @ApiPropertyOptional({
    description:
      'Present when the illustration hint has been activated. The pixels are served by the art endpoint.',
  })
  hasImage?: boolean;

  @ApiPropertyOptional({
    description:
      'Oracle text with the card name masked; only present after the text hint is activated.',
  })
  text?: string;
}

export class ClassicReductionHintDto {
  @ApiProperty({
    description:
      'Whether the choice reduction hint can currently be activated.',
  })
  available: boolean;

  @ApiProperty({
    description: 'Whether the choice reduction hint has been activated.',
  })
  used: boolean;

  @ApiProperty({
    description: 'Number of choices removed by the hint.',
    minimum: 0,
  })
  removed: number;
}

export class ClassicStatisticsDto implements ClassicStatistics {
  @ApiProperty({
    description: 'Sessions with at least one guess on this day.',
    minimum: 0,
  })
  participants: number;

  @ApiProperty({
    description: 'Sessions that solved this daily challenge.',
    minimum: 0,
  })
  solved: number;

  @ApiProperty({
    description:
      'Abandoned sessions, including abandonment before the first guess.',
    minimum: 0,
  })
  abandoned: number;

  @ApiProperty({
    description:
      'Average guess count among winning sessions, or null if no one has won.',
    type: Number,
    nullable: true,
  })
  averageWinningGuesses: number | null;

  @ApiProperty({
    description:
      'Percentage of participants who submitted each card guessed by this session, indexed by card ID.',
    type: 'object',
    additionalProperties: { type: 'number', minimum: 0, maximum: 100 },
  })
  guessPercentages: Record<string, number>;
}

export class ClassicStateDto implements ClassicState {
  @ApiProperty({
    description: 'Day of the shared challenge in Europe/Paris.',
    format: 'date',
    example: '2026-11-19',
  })
  day: string;

  @ApiProperty({
    description: 'Instant at which the next daily challenge starts.',
    format: 'date-time',
  })
  expiresAt: string;

  @ApiProperty({
    description: 'Result for the current anonymous session.',
    enum: ClassicStatus,
    enumName: 'ClassicStatus',
  })
  status: ClassicStatus;

  @ApiProperty({
    description: 'Submitted guesses and their comparisons.',
    type: () => [ClassicGuess],
  })
  @Type(() => ClassicGuess)
  guesses: ClassicGuess[];

  @ApiProperty({
    description:
      'Remaining selectable cards. Comparison attributes and hint sources are not returned here.',
    type: () => [ClassicChoiceDto],
  })
  @Type(() => ClassicChoiceDto)
  choices: ClassicChoiceDto[];

  @ApiProperty({
    description: 'Choice reduction hint state.',
    type: () => ClassicReductionHintDto,
  })
  @Type(() => ClassicReductionHintDto)
  hint: ClassicReductionHintDto;

  @ApiProperty({
    description: 'Availability and activation state of each hint.',
    type: () => [ClassicHintResultDto],
  })
  @Type(() => ClassicHintResultDto)
  hints: ClassicHintResultDto[];

  @ApiPropertyOptional({
    description: 'Revealed answer; only present after victory or abandonment.',
    type: () => ClassicCard,
  })
  @Type(() => ClassicCard)
  answer?: ClassicCard;

  @ApiPropertyOptional({
    description: 'Daily statistics; only present after victory or abandonment.',
    type: () => ClassicStatisticsDto,
  })
  @Type(() => ClassicStatisticsDto)
  statistics?: ClassicStatisticsDto;
}
