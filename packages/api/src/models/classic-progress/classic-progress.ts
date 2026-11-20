import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { ClassicStatus } from '@mtgdle/shared-types';
import type { ClassicDaily } from '../classic-daily/classic-daily';
import { ClassicGuess } from './classic-guess';

export class ClassicProgress {
  @ApiProperty({
    description: 'Day of the challenge for this progression.',
    format: 'date',
  })
  day: string;

  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  sessionId: string;

  @ApiProperty({
    description: 'Current result of the player for this challenge.',
    enum: ClassicStatus,
    enumName: 'ClassicStatus',
  })
  status: ClassicStatus;

  @ApiProperty({
    description: 'Submitted guesses in chronological order.',
    type: () => [ClassicGuess],
  })
  @Type(() => ClassicGuess)
  guesses: ClassicGuess[];

  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  removed: string[];

  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  hintUsed: boolean;

  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  artUsed: boolean;

  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  textUsed: boolean;

  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  daily?: ClassicDaily;
}
