import { ApiProperty } from '@nestjs/swagger';
import { Color } from '../card.enum';
import { CardImageUris } from '../card-image-uris/card-image-uris';

export class CardFace {
  @ApiProperty({
    description: 'A unique ID for this card in MTGdle’s database.',
    type: 'string',
    example: 'bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd',
  })
  id: string;

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
      'This card’s colors, if the overall card has colors defined by the rules. Empty array if the card has no colors.',
    isArray: true,
    enumName: 'ColorIdentity',
    example: [],
  })
  colors: Color[];

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
  flavorText: string;
}
