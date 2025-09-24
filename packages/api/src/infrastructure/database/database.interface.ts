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

export enum InsertedStatus {
  INSERTED = 'INSERTED',
  ALREADY_PRESENT = 'ALREADY_PRESENT',
  NOT_FOUND = 'NOT_FOUND'
}

export class InsertedResult {
  @ApiProperty({
    description: 'Inserted in database',
  })
  inserted: string[];

  @ApiProperty({
    description: 'Already in database',
  })
  alreadyPresent: string[];

  @ApiProperty({
    description: 'Don\'t exist in related tables in database',
  })
  notFound: string[];
}