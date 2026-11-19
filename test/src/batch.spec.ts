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
  it('synchronizes the development schema from the registered TypeORM models', async () => {
    await batch.run('database:sync');
    expect(db.synchronize).toHaveBeenCalledWith(false);
  });
  it('uses the same bulk import service as the HTTP controller', async () => {
    importer.importAll.mockResolvedValue({
      cards: { totalItems: 500 },
      playableCards: { inserted: [] },
    });
    await batch.run('scryfall:import');
    expect(importer.importAll).toHaveBeenCalledWith(true, true);
  });
  it('uses the Scryfall service to download the snapshot', async () => {
    await batch.run('scryfall:download');
    expect(bulk.downloadDefaultCards).toHaveBeenCalledTimes(1);
  });
  it('passes check-only mode to the catalogue service', async () => {
    await batch.run('classic:prepare', true);
    expect(catalogue.prepare).toHaveBeenCalledWith(true);
  });
});
