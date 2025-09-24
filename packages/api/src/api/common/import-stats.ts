import { ApiProperty } from '@nestjs/swagger';
import { IImportStats } from '@mtgdle/shared-types';

export class ImportStats implements IImportStats {
  @ApiProperty({
    description: 'Total items imported',
    type: 'number',
  })
  totalItems: number;

  @ApiProperty({
    description: 'Number of batches',
    type: 'number',
  })
  batchCount: number;

  @ApiProperty({
    description: 'Total time in ms',
    type: 'number',
  })
  durationMs: number;

  @ApiProperty({
    description: 'Started at',
    type: 'string',
  })
  startedAt: string;

  @ApiProperty({
    description: 'Finished at',
    type: 'string',
  })
  finishedAt: string;
}
