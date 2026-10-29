import { ApiProperty, PickType } from '@nestjs/swagger';
import { Card } from '../card/card';
import { Exclude } from 'class-transformer';
import { InsertType } from './playable-card.enum';
import { CardFace } from '../card/card-face/card-face';
import { IPlayableCard } from '@mtgdle/shared-types';

export class PlayableCard extends PickType(CardFace, ['imageUris'] as const) implements IPlayableCard {
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
  @Exclude()
  insertType: InsertType;

  @Exclude()
  card: Card;

  @Exclude()
  createdAt: string;

  @Exclude()
  updatedAt: string;
}