import { BatchService } from '../../packages/api/src/batches/batch.service';

describe('Nest batch operations', () => {
  const db = { synchronize: jest.fn() };
  const bulk = { downloadDefaultCards: jest.fn() };
  const importer = { importAll: jest.fn() };
  const catalogue = { prepare: jest.fn() };
  const batch = new BatchService(
    db as never,
    bulk as never,
    importer as never,
    catalogue as never,
  );
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('should synchronize registered TypeORM models when the development schema batch runs', async () => {
    await batch.run('database:sync');
    expect(db.synchronize).toHaveBeenCalledWith(false);
  });
  it('should use the existing bulk import service when the import batch runs', async () => {
    importer.importAll.mockResolvedValue({
      cards: { totalItems: 500 },
      playableCards: { inserted: [] },
    });
    await batch.run('scryfall:import');
    expect(importer.importAll).toHaveBeenCalledWith(true, true);
  });
  it('should use the Scryfall service when the download batch runs', async () => {
    await batch.run('scryfall:download');
    expect(bulk.downloadDefaultCards).toHaveBeenCalledTimes(1);
  });
  it('should preserve check-only mode when preparing the catalogue', async () => {
    await batch.run('classic:prepare', true);
    expect(catalogue.prepare).toHaveBeenCalledWith(true);
  });
});
