import { BatchService } from '../../packages/api/src/batches/batch.service';

describe('Nest batch operations', () => {
  const db = {
    query: jest.fn(),
    synchronize: jest.fn(),
    runMigrations: jest.fn(),
  };
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
  it('refuses schema initialization on an existing database', async () => {
    db.query.mockResolvedValue([{ count: 1 }]);
    await expect(batch.run('database:init')).rejects.toThrow('not empty');
    expect(db.synchronize).not.toHaveBeenCalled();
    expect(db.runMigrations).not.toHaveBeenCalled();
  });
  it('initializes an empty database and applies the registered migration', async () => {
    db.query.mockResolvedValue([{ count: 0 }]);
    await batch.run('database:init');
    expect(db.synchronize).toHaveBeenCalledWith(false);
    expect(db.runMigrations).toHaveBeenCalledTimes(1);
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
