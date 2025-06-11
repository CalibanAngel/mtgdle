import { EntitySchema } from 'typeorm';
import { CardImageUris } from './card-image-uris';

export const CardImageUrisEntity = new EntitySchema<CardImageUris>({
  name: 'CardImageUris',
  tableName: 'card_image_uris',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    small: {
      type: 'text',
    },
    normal: {
      type: 'text',
    },
    large: {
      type: 'text',
    },
    png: {
      type: 'text',
    },
    borderCrop: {
      type: 'text',
      name: 'border_crop',
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
      name: 'created_at',
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
      name: 'updated_at',
    },
  },
  relations: {
    cardFace: {
      type: 'one-to-one',
      target: 'CardFace',
      inverseSide: 'imageUris',
    },
  },
});
