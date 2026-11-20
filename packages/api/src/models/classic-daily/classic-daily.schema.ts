import { EntitySchema } from 'typeorm';
import { ClassicDaily } from './classic-daily';

export const ClassicDailyEntity = new EntitySchema<ClassicDaily>({
  name: 'ClassicDaily',
  tableName: 'classic_daily',
  columns: {
    day: { type: 'text', primary: true },
    answerId: { name: 'answer_id', type: 'uuid' },
    cards: { type: 'jsonb' },
    rulesVersion: { name: 'rules_version', type: 'integer', default: 1 },
  },
});
