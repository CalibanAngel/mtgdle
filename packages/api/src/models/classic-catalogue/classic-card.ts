import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import type { ClassicCard as ClassicCardContract } from '@mtgdle/shared-types';

export class ClassicCard implements ClassicCardContract {
  @ApiProperty({
    description:
      'Scryfall oracle ID identifying the logical card across printings.',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'English name of the logical card.',
    example: 'Path to Exile',
  })
  name: string;

  @ApiProperty({
    description: 'Small image of the selected reference printing.',
    type: String,
    nullable: true,
  })
  image: string | null;

  @ApiPropertyOptional({
    description: 'Larger image used in card previews.',
    type: String,
    nullable: true,
  })
  previewImage?: string | null;

  @ApiProperty({
    description: 'Color identity; an empty array means colorless.',
    type: [String],
    example: ['W'],
  })
  identity: string[];

  @ApiProperty({
    description: 'Mana value used for the comparison.',
    minimum: 0,
    example: 1,
  })
  mana: number;

  @ApiProperty({
    description:
      'Card types used for the comparison, without supertypes or subtypes.',
    type: [String],
    example: ['Instant'],
  })
  types: string[];

  @ApiProperty({
    description: 'First eligible edition in the supplied Scryfall snapshot.',
    example: 'Conflux',
  })
  edition: string;

  @ApiProperty({
    description: 'Rarity of the selected standard reference printing.',
    example: 'uncommon',
  })
  rarity: string;

  @ApiProperty({
    description: 'Release date used for edition and period comparisons.',
    format: 'date',
    example: '2009-02-06',
  })
  released: string;

  @ApiProperty({
    description: 'Keyword abilities used for the comparison.',
    type: [String],
    example: ['Flying'],
  })
  keywords: string[];

  @ApiProperty({
    description: 'Whether the card has an activated ability.',
    example: false,
  })
  activated: boolean;

  /** Private source for the illustration hint, served through its authorized route. */
  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  artCrop?: string | null;

  /** Private Oracle text; the hint exposes a separately masked text. */
  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  oracleText?: string;
}
