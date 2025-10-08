import { ApiProperty } from '@nestjs/swagger';
import { Card } from '../card/card';
import { Exclude } from 'class-transformer';
import { InsertType } from './playable-card.enum';

export class PlayableCard {
  @ApiProperty({
    description: 'Id of the referenced card',
  })
  cardId: string;

  @ApiProperty({
    description: 'Name of the referenced card',
  })
  name: string;

  @ApiProperty({
    description: 'Type of the insert',
    enum: InsertType,
    enumName: 'InsertType',
  })
  insertType: InsertType;

  @Exclude()
  card: Card;

  @Exclude()
  createdAt: string;

  @Exclude()
  updatedAt: string;
}