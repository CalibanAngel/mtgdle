import { EntitySchema } from 'typeorm';
import { PlayableCard } from './playable-card';
import { InsertType } from './playable-card.enum';

export const PlayableCardEntity = new EntitySchema<PlayableCard>({
  name: 'PlayableCard',
  tableName: 'playable_card',
  columns: {
    cardId: {
      type: 'uuid',
      name: 'card_id',
      nullable: false,
    },
    name: {
      type: 'text',
      name: 'name',
      primary: true,
    },
    insertType: {
      type: 'enum',
      name: 'insert_type',
      enum: InsertType,
      enumName: 'insert_type_enum',
      nullable: false,
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
    }
  },
  relations: {
    card: {
      type: 'one-to-one',
      target: 'Card',
      joinColumn: {
        name: 'card_id',
      },
      onDelete: 'CASCADE',
      inverseSide: 'playableCard',
    }
  }
});