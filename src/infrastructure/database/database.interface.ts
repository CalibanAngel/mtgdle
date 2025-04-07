import { ApiProperty } from '@nestjs/swagger';

export class UpsertResult<T> {
  @ApiProperty({
    description: 'Inserted row',
  })
  inserted: T[];

  @ApiProperty({
    description: 'Updated row',
  })
  updated: T[];
}
