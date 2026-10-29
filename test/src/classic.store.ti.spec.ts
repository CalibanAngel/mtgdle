import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import type { ClassicCard } from '@mtgdle/shared-types';
import { ClassicStore } from '../../packages/api/src/api/game/classic.store';

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('packages/api/.env') });
const database = process.env.CLASSIC_TEST_DATABASE;
const integration = database ? describe : describe.skip;
integration('Classic persistence (dedicated PostgreSQL)', () => {
  let db: DataSource;
  let store: ClassicStore;
  const session = randomUUID();
  const cards: ClassicCard[] = Array.from({ length: 24 }, (_, i) => ({
    id: randomUUID(),
    name: `Card ${i}`,
    image: null,
    identity: ['U'],
    mana: i,
    types: ['Creature'],
    edition: 'Test',
    released: '2000-01-01',
    keywords: [],
    activated: false,
  }));
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
      synchronize: false,
      entities: [],
    }).initialize();
    await db.query(
      readFileSync(path.resolve('scripts/classic-schema.sql'), 'utf8'),
    );
    store = new ClassicStore(db);
  });
  beforeEach(async () => {
    await db.query(
      'TRUNCATE classic_progress, classic_daily, classic_catalogue',
    );
    for (const card of cards)
      await db.query('INSERT INTO classic_catalogue(id,data) VALUES($1,$2)', [
        card.id,
        card,
      ]);
  });
  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
  });

  async function answer(): Promise<string> {
    const rows: { answer_id: string }[] = await db.query(
      'SELECT answer_id FROM classic_daily',
    );
    return rows[0].answer_id;
  }
  it('creates one shared daily challenge concurrently and never discloses its answer', async () => {
    const states = await Promise.all([
      store.state(session),
      store.state(randomUUID()),
    ]);
    expect(states[0].day).toBe(states[1].day);
    expect(states[0]).not.toHaveProperty('answer');
    expect(await db.query('SELECT day FROM classic_daily')).toHaveLength(1);
  });
  it('serializes duplicate guesses and preserves retry idempotence', async () => {
    const state = await store.state(session);
    const target = await answer();
    const wrong = cards.find((c) => c.id !== target)!;
    const id = randomUUID();
    const results = await Promise.all([
      store.act(state.day, session, 'guess', wrong.id, id),
      store.act(state.day, session, 'guess', wrong.id, id),
    ]);
    expect(results[0].guesses).toHaveLength(1);
    expect(results[1].guesses).toHaveLength(1);
    await expect(
      store.act(state.day, session, 'guess', wrong.id, randomUUID()),
    ).rejects.toThrow();
    expect(
      (await store.state(session)).choices.some((c) => c.id === wrong.id),
    ).toBe(false);
  });
  it('unlocks the hint at ten errors, removes half the choices and preserves the target', async () => {
    const state = await store.state(session);
    const target = await answer();
    await expect(store.act(state.day, session, 'hint')).rejects.toThrow();
    for (const card of cards.filter((c) => c.id !== target).slice(0, 9))
      await store.act(state.day, session, 'guess', card.id, randomUUID());
    expect((await store.state(session)).hint.available).toBe(false);
    const tenth = cards.filter((c) => c.id !== target)[9];
    await store.act(state.day, session, 'guess', tenth.id, randomUUID());
    expect((await store.state(session)).hint.available).toBe(true);
    const hinted = await store.act(state.day, session, 'hint');
    expect(hinted.hint.removed).toBe(7);
    expect(hinted.choices.some((c) => c.id === target)).toBe(true);
    expect(await store.act(state.day, session, 'hint')).toEqual(hinted);
    expect(await store.state(session)).toEqual(hinted);
    const excluded = cards.find(
      (c) =>
        c.id !== target &&
        !hinted.choices.some((choice) => choice.id === c.id) &&
        !hinted.guesses.some((g) => g.card.id === c.id),
    )!;
    await expect(
      store.act(state.day, session, 'guess', excluded.id, randomUUID()),
    ).rejects.toThrow();
  });
  it('accepts more than ten attempts, then reveals the answer only on victory', async () => {
    const state = await store.state(session);
    const target = await answer();
    for (const card of cards.filter((c) => c.id !== target).slice(0, 12))
      await store.act(state.day, session, 'guess', card.id, randomUUID());
    expect((await store.state(session)).status).toBe('playing');
    const won = await store.act(
      state.day,
      session,
      'guess',
      target,
      randomUUID(),
    );
    expect(won.status).toBe('won');
    expect(won.answer?.id).toBe(target);
    await expect(
      store.act(state.day, session, 'guess', cards[0].id, randomUUID()),
    ).rejects.toThrow();
  });
  it('isolates sessions, persists abandonment and rejects expired challenges', async () => {
    const state = await store.state(session);
    expect(
      (await store.act(state.day, session, 'abandon')).answer,
    ).toBeDefined();
    expect((await store.state(randomUUID())).status).toBe('playing');
    expect((await store.state(session)).status).toBe('abandoned');
    await expect(store.act('2000-01-01', session, 'hint')).rejects.toThrow();
  });
});
