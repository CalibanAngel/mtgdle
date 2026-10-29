import { EntitySchema } from 'typeorm';
import { Game } from './game';

export const GameEntity = new EntitySchema<Game>({
  name: 'Game',
  tableName: 'game',
  columns: {
    guessDate: {
      type: 'date',
      primary: true,
      default: () => 'CURRENT_DATE',
    },
    numberOfGuess: {
      type: 'smallint',
      default: 0,
    },
    cardId: {
      type: 'uuid',
      nullable: false,
      name: 'card_id',
    }
  },
  relations: {
    card: {
      type: 'many-to-one',
      target: 'Card', // The target entity name. Update if your Card entity is registered with a different name.
      joinColumn: { name: 'card_id' },
      onDelete: 'CASCADE',
      inverseSide: 'games', // This should match the property on the Card entity that holds the relation.
    },
  }
});
