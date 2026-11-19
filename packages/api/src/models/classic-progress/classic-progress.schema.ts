import { EntitySchema } from 'typeorm';
import { ClassicProgress } from './classic-progress';

export const ClassicProgressEntity = new EntitySchema<ClassicProgress>({
  name: 'ClassicProgress',
  tableName: 'classic_progress',
  columns: {
    day: { type: 'text', primary: true },
    sessionId: { name: 'session_id', type: 'uuid', primary: true },
    status: { type: 'text', default: 'playing' },
    guesses: { type: 'jsonb', default: () => "'[]'::jsonb" },
    removed: { type: 'jsonb', default: () => "'[]'::jsonb" },
    hintUsed: { name: 'hint_used', type: 'boolean', default: false },
    artUsed: { name: 'art_used', type: 'boolean', default: false },
    textUsed: { name: 'text_used', type: 'boolean', default: false },
  },
  relations: {
    daily: {
      type: 'many-to-one',
      target: 'ClassicDaily',
      joinColumn: { name: 'day' },
      onDelete: 'CASCADE',
    },
  },
});
