import { EntitySchema } from 'typeorm';
import { ClassicCatalogue } from './classic-catalogue';

export const ClassicCatalogueEntity = new EntitySchema<ClassicCatalogue>({
  name: 'ClassicCatalogue',
  tableName: 'classic_catalogue',
  columns: {
    id: { type: 'uuid', primary: true },
    data: { type: 'jsonb' },
  },
});
