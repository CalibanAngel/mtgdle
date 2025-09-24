import { IInsertManualCardsDto } from '@mtgdle/shared-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class InsertManualCardsDto implements IInsertManualCardsDto {
  @ApiProperty({
    description: 'Names of the cards to insert',
    type: 'array',
    items: {
      type: 'string',
    }
  })
  @IsArray()
  cardsName: string[];
}