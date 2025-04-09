import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class CardImageUris {
  @Exclude()
  id: string;

  @Exclude()
  cardFaceId: string;

  @ApiProperty({
    description:
      'A small full card image. Designed for use as thumbnail or list icon. 146 × 204',
  })
  small: string;

  @ApiProperty({
    description: 'A medium-sized full card image. 488 × 680',
  })
  normal: string;

  @ApiProperty({
    description: 'A large full card image. 672 × 936',
  })
  large: string;

  @ApiProperty({
    description:
      'A transparent, rounded full card PNG. This is the best image to use for videos or other high-quality content. 745 × 1040',
  })
  png: string;

  @ApiProperty({
    description:
      'A full card image with the rounded corners and the majority of the border cropped off. Designed for dated contexts where rounded images can’t be used. 480 × 680',
  })
  borderCrop: string;
}
