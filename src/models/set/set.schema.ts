import { EntitySchema } from 'typeorm';
import { Set } from './set';
import { SetType } from '@scryfall/api-types';

export const SetEntity = new EntitySchema<Set>({
  name: 'Set',
  tableName: 'sets',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
    },
    name: {
      type: String,
    },
    code: {
      type: String,
      length: 10,
    },
    releasedAt: {
      type: String,
      nullable: true,
    },
    cardCount: {
      type: Number,
    },
    setType: {
      type: 'enum',
      enum: SetType,
    },
    scryfallUri: {
      type: String,
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
