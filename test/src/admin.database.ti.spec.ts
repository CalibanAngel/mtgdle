import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Entities } from '../../packages/api/src/infrastructure/database/entities';
import { AdminRepository } from '../../packages/api/src/models/classic-progress/admin.repository';
import { ClassicDailyEntity } from '../../packages/api/src/models/classic-daily/classic-daily.schema';
import { ClassicProgressEntity } from '../../packages/api/src/models/classic-progress/classic-progress.schema';
import { ClassicCatalogueEntity } from '../../packages/api/src/models/classic-catalogue/classic-catalogue.schema';
import { ClassicStatus } from '@mtgdle/shared-types';

const database = process.env.CLASSIC_TEST_DATABASE;
const integration = database ? describe : describe.skip;
integration('Administrator read-only database repository', () => {
  let db: DataSource;
  let repository: AdminRepository;
  const session = randomUUID();
  const cardId = randomUUID();
  beforeAll(async () => {
    if (
      !database ||
      !/^[a-zA-Z0-9_]+_classic_test$/.test(database) ||
      database === process.env.DATABASE_NAME
    )
      throw new Error('Refusing to use a non-test database.');
    db = await new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT || 5432),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database,
      entities: Entities,
      synchronize: false,
    }).initialize();
    await db.synchronize();
    repository = new AdminRepository(db);
  });
  beforeEach(async () => {
    await db.getRepository(ClassicProgressEntity).clear();
    await db
      .getRepository(ClassicDailyEntity)
      .createQueryBuilder()
      .delete()
      .execute();
    await db.getRepository(ClassicCatalogueEntity).clear();
    await db
      .getRepository(ClassicDailyEntity)
      .insert({ day: '2026-11-01', answerId: cardId, cards: [] });
    await db.getRepository(ClassicProgressEntity).insert([
      {
        day: '2026-11-01',
        sessionId: session,
        status: ClassicStatus.Won,
        guesses: [{}, {}] as never,
        hintUsed: true,
      },
      {
        day: '2026-11-01',
        sessionId: randomUUID(),
        status: ClassicStatus.Playing,
        guesses: [],
      },
      {
        day: '2026-11-01',
        sessionId: randomUUID(),
        status: ClassicStatus.Abandoned,
        guesses: [{}] as never,
        textUsed: true,
      },
    ]);
    await db.getRepository(ClassicCatalogueEntity).insert({
      id: cardId,
      data: {
        id: cardId,
        name: '100% Test Card',
        oracleText: 'x'.repeat(2000),
      } as never,
    });
  });
  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
  });
  const options = { page: 1, pageSize: 20, q: '', order: 'ASC' as const };
  it('should aggregate sessions separately from players when some visitors have no guesses', async () => {
    const stats = await repository.statistics('2026-11-01', '2026-11-30');
    expect(stats.days).toEqual([
      expect.objectContaining({
        sessions: 3,
        players: 2,
        won: 1,
        abandoned: 1,
        guesses: 3,
        winningGuesses: 2,
        reduceHints: 1,
        textHints: 1,
      }),
    ]);
    expect(stats.distribution).toEqual([{ guesses: 2, count: 1 }]);
  });
  it('should paginate deterministically when multiple application rows are present', async () => {
    const first = await repository.rows('classic_progress', {
      ...options,
      pageSize: 1,
    });
    const second = await repository.rows('classic_progress', {
      ...options,
      pageSize: 1,
      page: 2,
    });
    expect(first.total).toBe(3);
    expect(first.rows).toHaveLength(1);
    expect(first.rows[0].sessionId).not.toBe(second.rows[0].sessionId);
  });
  it('should return complete JSON only in the detail when a value exceeds the preview size', async () => {
    const rows = await repository.rows('classic_catalogue', options);
    expect(String(rows.rows[0].data).length).toBeLessThan(250);
    const detail = await repository.row(
      'classic_catalogue',
      JSON.stringify({ id: cardId }),
    );
    expect((detail.data as { oracleText: string }).oracleText).toHaveLength(
      2000,
    );
  });
  it('should search catalogue names literally when the query contains wildcard characters', async () => {
    await db
      .getRepository(ClassicCatalogueEntity)
      .insert({ id: randomUUID(), data: { name: '100 alternative' } as never });
    expect(
      (await repository.rows('classic_catalogue', { ...options, q: '100%' }))
        .total,
    ).toBe(1);
    expect(
      (
        await repository.rows('classic_catalogue', {
          ...options,
          q: "' OR 1=1 --",
        })
      ).total,
    ).toBe(0);
  });
  it('should reject non-application tables and injected columns when explorer parameters are manipulated', async () => {
    await expect(repository.rows('pg_authid', options)).rejects.toThrow(
      'non disponible',
    );
    await expect(
      repository.rows('classic_progress', {
        ...options,
        sort: 'day; DROP TABLE classic_progress',
      }),
    ).rejects.toThrow('tri inconnue');
    await expect(repository.row('classic_progress', 'null')).rejects.toThrow(
      'Clé invalide',
    );
    await expect(repository.row('classic_progress', '"text"')).rejects.toThrow(
      'Clé invalide',
    );
    await expect(
      repository.row(
        'classic_progress',
        JSON.stringify({ day: '2026-11-01', sessionId: 'invalid' }),
      ),
    ).rejects.toThrow('Clé invalide');
  });
  it('should list only the allowlisted application tables when metadata is requested', async () => {
    const tables = await repository.tables();
    expect(tables).toHaveLength(10);
    expect(
      tables.find((table) => table.name === 'classic_progress')?.count,
    ).toBe(3);
    expect(tables.some((table) => table.name.startsWith('pg_'))).toBe(false);
  });
  it('should support every application schema when its rows include relation columns', async () => {
    for (const table of await repository.tables()) {
      const result = await repository.rows(table.name, {
        ...options,
        pageSize: 1,
      });
      expect(result.columns.map((column) => column.name)).toEqual(
        table.columns.map((column) => column.name),
      );
      expect(result.rows.length).toBeLessThanOrEqual(1);
    }
  });
});
