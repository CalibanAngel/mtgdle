import { EntitySchema } from 'typeorm';
import { CardSet } from './set';
import { SetType } from './set.enum';

export const SetEntity = new EntitySchema<CardSet>({
  name: 'Set',
  tableName: 'sets',
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
    },
    createdAt: {
      type: 'timestamp',
      createDate: true, // Automatically set when the entity is first saved.
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true, // Automatically updated each time the entity is updated.
    },
  },
});
