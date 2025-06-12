import { EntitySchema } from 'typeorm';
import { CardFace } from './card-face';

export const CardFaceEntity = new EntitySchema<CardFace>({
  name: 'CardFace',
  tableName: 'card_face',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    name: {
      type: 'text',
    },
    typeLine: {
      type: 'text',
      name: 'type_line',
    },
    power: {
      type: 'text',
      nullable: true,
    },
    toughness: {
      type: 'text',
      nullable: true,
    },
    loyalty: {
      type: 'text',
      nullable: true,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    flavorText: {
      type: 'text',
      nullable: true,
      name: 'flavor_text',
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
    card: {
      type: 'many-to-one',
      target: 'Card', // The target entity name. Update if your Card entity is registered with a different name.
      joinColumn: { name: 'card_id' },
      onDelete: 'CASCADE',
      inverseSide: 'cardFaces', // This should match the property on the Card entity that holds the relation.
    },
    imageUris: {
      type: 'one-to-one',
      target: 'CardImageUris',
      joinColumn: {
        name: 'card_image_uris_id',
      },
      onDelete: 'CASCADE',
      inverseSide: 'cardFace', // This property must be defined in the CardImageUris entity.
    },
  },
});
