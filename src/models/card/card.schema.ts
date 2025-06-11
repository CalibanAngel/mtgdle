import { EntitySchema } from 'typeorm';
import { Card } from './card';

export const CardEntity = new EntitySchema<Card>({
  name: 'Card',
  tableName: 'card',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    name: {
      type: 'text',
    },
    releasedDate: {
      type: 'date',
      name: 'released_date',
    },
    scryfallUri: {
      type: 'text',
      name: 'scryfall_uri',
    },
    rarity: {
      type: 'text',
    },
    convertedManaCost: {
      type: 'float',
      name: 'converted_mana_cost',
    },
    legalities: {
      type: 'json',
    },
    keywords: {
      type: 'simple-array',
    },
    reprint: {
      type: 'boolean',
    },
    borderColor: {
      type: 'text',
      name: 'border_color',
    },
    colors: {
      type: 'simple-array',
    },
    colorIdentity: {
      type: 'simple-array',
      name: 'color_identity',
    },
    games: {
      type: 'simple-array',
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
    // Existing one-to-one relation with ManaCost.
    detailedManaCost: {
      type: 'one-to-one',
      target: 'ManaCost',
      joinColumn: {
        name: 'mana_cost_id',
      },
      cascade: true,
      inverseSide: 'card',
    },
    cardFaces: {
      type: 'one-to-many',
      target: 'CardFace',
      inverseSide: 'card',
      cascade: true,
    },
    set: {
      type: 'many-to-one',
      target: 'Set',
      joinColumn: {
        name: 'set_id',
      },
      onDelete: 'CASCADE',
      inverseSide: 'cards',
    },
  },
});
