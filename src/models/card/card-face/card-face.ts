import { ApiProperty } from '@nestjs/swagger';
import { CardImageUris } from '../card-image-uris/card-image-uris';
import { Exclude } from 'class-transformer';
import { Card } from '../card';

export class CardFace {
  @Exclude()
  id: string;

  @Exclude()
  cardId: string;

  @ApiProperty({
    description:
      'The name of this card. If this card has multiple faces, this field will contain both names separated by ␣//␣.',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: 'The type line of this card.',
    type: 'string',
    example: 'Artifact',
  })
  typeLine: string;

  @ApiProperty({
    description:
      'The mana cost for this card. This value will be any empty string "" if the cost is absent. Remember that per the game rules, a missing mana cost and a mana cost of {0} are different values. Multi-faced cards will report this value in card faces.',
    type: 'string',
    example: '{0}',
  })
  manaCost: string;

  @ApiProperty({
    description:
      'The mana value. If you submit Un-set mana symbols, this decimal could include fractional parts.',
  })
  imageUris: CardImageUris;

  @ApiProperty({
    description:
      'This card’s power, if any. Note that some cards have powers that are not numeric, such as *.',
  })
  power?: string;

  @ApiProperty({
    description:
      'This card’s toughness, if any. Note that some cards have toughnesses that are not numeric, such as *.',
  })
  toughness?: string;

  @ApiProperty({
    description:
      'This loyalty if any. Note that some cards have loyalties that are not numeric, such as X.',
  })
  loyalty?: string;

  @ApiProperty({
    description: 'The full text for this card, if any.',
    example: '{T}, Sacrifice this artifact: Add three mana of any one color.',
  })
  description?: string;

  @ApiProperty({
    description: 'The flavor text, if any.',
    type: 'string',
  })
  flavorText?: string;

  @Exclude()
  card: Card;

  @Exclude()
  createdAt: string;

  @Exclude()
  updatedAt: string;
}
