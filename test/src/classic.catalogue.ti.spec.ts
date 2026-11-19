import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { ClassicCatalogueService } from '../../packages/api/src/models/classic-catalogue/classic-catalogue.service';
import { ClassicSchema1761955200000 } from '../../packages/api/src/infrastructure/database/migrations/classic-schema.migration';

const database = process.env.CLASSIC_TEST_DATABASE;
const integration = database ? describe : describe.skip;
integration('Catalogue preparation with PostgreSQL', () => {
  let db: DataSource;
  const oracleId = randomUUID();
  const player = randomUUID();
  const printing = {
    id: randomUUID(),
    oracle_id: oracleId,
    name: 'Example Card',
    layout: 'normal',
    lang: 'en',
    games: ['paper'],
    released_at: '2000-01-01',
    set_name: 'Example Set',
    type_line: 'Instant',
    color_identity: ['U'],
    cmc: 1,
    rarity: 'common',
    image_uris: {
      small: '/new-small.jpg',
      normal: '/new-normal.jpg',
      art_crop: '/new-art.jpg',
    },
  };
  const bulk = { importCardsFromFile: jest.fn() };
  let catalogue: ClassicCatalogueService;
  beforeAll(async () => {
    if (
      !database ||
      !/^[a-zA-Z0-9_]+_classic_test$/.test(database) ||
      database === process.env.DATABASE_NAME
    ) {
      throw new Error('Refusing to use a non-test database.');
    }
    db = await new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT || 5432),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database,
      migrations: [ClassicSchema1761955200000],
      synchronize: false,
    }).initialize();
    await db.runMigrations();
    await db.query(
      'CREATE TABLE IF NOT EXISTS playable_card(name text PRIMARY KEY)',
    );
    catalogue = new ClassicCatalogueService(db, bulk as never);
  });
  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
  });
  beforeEach(async () => {
    await db.query(
      'TRUNCATE classic_progress, classic_daily, classic_catalogue, playable_card',
    );
    await db.query('INSERT INTO playable_card(name) VALUES($1)', [
      printing.name,
    ]);
    await db.query(
      'INSERT INTO classic_daily(day,answer_id,cards) VALUES($1,$2,$3)',
      [
        '2000-01-01',
        oracleId,
        JSON.stringify([{ id: oracleId, name: printing.name, mana: 9 }]),
      ],
    );
    await db.query(
      "INSERT INTO classic_progress(day,session_id,guesses,status) VALUES($1,$2,$3,'won')",
      ['2000-01-01', player, JSON.stringify([{ requestId: 'original' }])],
    );
    bulk.importCardsFromFile.mockImplementation(async (_local, callback) => {
      await callback([printing]);
    });
  });
  it('refreshes media while preserving the answer, original criteria and player progress', async () => {
    await expect(catalogue.prepare()).resolves.toMatchObject({ cards: 1 });
    const [daily] = await db.query('SELECT answer_id,cards FROM classic_daily');
    expect(daily.answer_id).toBe(oracleId);
    expect(daily.cards[0]).toMatchObject({
      mana: 9,
      previewImage: '/new-normal.jpg',
    });
    const [progress] = await db.query(
      'SELECT status,guesses FROM classic_progress',
    );
    expect(progress).toMatchObject({
      status: 'won',
      guesses: [{ requestId: 'original' }],
    });
  });
  it('does not write during check-only mode', async () => {
    await catalogue.prepare(true);
    expect(await db.query('SELECT * FROM classic_catalogue')).toHaveLength(0);
    expect(
      (await db.query('SELECT cards FROM classic_daily'))[0].cards[0],
    ).toEqual({ id: oracleId, name: printing.name, mana: 9 });
  });
  it('preserves the existing catalogue when no eligible printing is found', async () => {
    await catalogue.prepare();
    bulk.importCardsFromFile.mockImplementation(async (_local, callback) => {
      await callback([]);
    });
    await expect(catalogue.prepare()).rejects.toThrow('No eligible cards');
    expect(await db.query('SELECT * FROM classic_catalogue')).toHaveLength(1);
  });
});
