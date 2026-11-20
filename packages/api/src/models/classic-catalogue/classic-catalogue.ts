import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ClassicCard } from './classic-card';

export class ClassicCatalogue {
  @ApiProperty({
    description: 'Scryfall oracle ID of the prepared catalogue entry.',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Prepared card and comparison attributes.',
    type: () => ClassicCard,
  })
  @Type(() => ClassicCard)
  data: ClassicCard;
}

export class ClassicCataloguePreparation {
  @ApiProperty({
    description: 'Number of eligible logical cards prepared from the snapshot.',
    minimum: 1,
    example: 474,
  })
  cards: number;

  @ApiProperty({
    description: 'Number of playable card names considered for preparation.',
    minimum: 1,
    example: 474,
  })
  selectedNames: number;
}
