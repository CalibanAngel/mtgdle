import { EntitySchema } from 'typeorm';
import { CardSet } from './set';
import { SetType } from './set.enum';

export const SetEntity = new EntitySchema<CardSet>({
  name: 'Set',
  tableName: 'set',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
    },
    name: {
      type: 'text',
    },
    code: {
      type: 'varchar',
      length: 8,
      unique: true,
    },
    releasedAt: {
      type: 'text',
      name: 'released_at',
      nullable: true,
    },
    cardCount: {
      type: 'int',
    },
    setType: {
      type: 'enum',
      enum: SetType,
    },
    scryfallUri: {
      type: 'text',
      name: 'scryfall_uri',
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
    cards: {
      type: 'one-to-many',
      target: 'Card',
      inverseSide: 'set',
      cascade: true,
    },
  },
});
