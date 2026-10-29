import { EntitySchema } from 'typeorm';
import { Card } from './card';
import { PlateformName, Layout } from './card.enum';

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
    layout: {
      type: 'enum',
      enum: Layout,
      enumName: 'card_layout_enum',
      name: 'layout'
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
    plateform: {
      type: 'enum',
      enum: PlateformName,
      array: true
    },
    edhrcRank: {
      type: 'smallint',
      name: 'edhrc_rank',
      nullable: true,
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
    setId: {
      type: 'uuid',
      name: 'set_id',
      nullable: false,
    }
  },
  relations: {
    // Existing one-to-one relation with ManaCost.
    detailedManaCost: {
      type: 'one-to-one',
      target: 'ManaCost',
      joinColumn: {
        name: 'mana_cost_id',
        foreignKeyConstraintName: 'FK_card_mana_cost_id',
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
    games: {
      type: 'one-to-many',
      target: 'Game',
      inverseSide: 'card',
      cascade: true,
    },
    set: {
      type: 'many-to-one',
      target: 'Set',
      joinColumn: {
        foreignKeyConstraintName: 'FK_card_set',
        name: 'set_id',
      },
      onDelete: 'CASCADE',
      inverseSide: 'cards',
    },
    playableCard: {
      type: 'one-to-one',
      target: 'PlayableCard',
      inverseSide: 'card',
      nullable: true,
    }

  }
});
