import { EntitySchema } from 'typeorm';
import { ManaCost } from './mana-cost';

export const ManaCostEntity = new EntitySchema<ManaCost>({
  name: 'ManaCost',
  tableName: 'mana_cost',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    cost: {
      // The normalized cost, with correctly-ordered and wrapped mana symbols.
      type: 'text',
    },
    colorless: {
      // True if the cost is colorless.
      type: 'boolean',
    },
    multicolored: {
      // True if the cost is multicolored.
      type: 'boolean',
    },
    monocolored: {
      // True if the cost is monocolored.
      type: 'boolean',
    },
    colors: {
      // The colors are stored as a simple comma-separated string.
      type: 'simple-array',
    },
    convertedManaCost: {
      // The mana cost as a numeric value, may include fractional parts.
      type: 'float',
      name: 'converted_mana_cost',
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
      type: 'one-to-one',
      target: 'Card', // Ensure this matches the registered name for CardFaceEntity.
      inverseSide: 'detailedManaCost', // This should be the property on the CardFace entity that holds the relation (if any).
      onDelete: 'CASCADE',
    },
  },
});
