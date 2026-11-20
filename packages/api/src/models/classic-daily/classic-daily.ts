import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import type { ClassicCard } from '../classic-catalogue/classic-card';

export class ClassicDaily {
  @ApiProperty({
    description: 'Day of the shared challenge in Europe/Paris.',
    format: 'date',
    example: '2026-11-19',
  })
  day: string;

  /** The stored answer must never be exposed as part of the daily model. */
  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  answerId: string;

  /** Internal snapshot, including comparison attributes and private hint sources. */
  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  cards: ClassicCard[];

  @ApiProperty({
    description: 'Comparison rules version stored with this challenge.',
    minimum: 1,
    example: 1,
  })
  rulesVersion: number;
}
