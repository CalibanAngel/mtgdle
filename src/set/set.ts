import { ApiProperty } from '@nestjs/swagger';

export class Set {
  @ApiProperty({
    description: 'The name of the set.',
    type: 'string',
    example: 'Vintage Masters',
  })
  name: string;

  @ApiProperty({
    description: 'This card’s Set object UUID.',
    type: 'string',
    example: 'a944551a-73fa-41cd-9159-e8d0e4674403',
  })
  setId: string;

  @ApiProperty({
    description: 'This card’s set code.',
    type: 'string',
    example: 'vma',
  })
  code: string;
}
