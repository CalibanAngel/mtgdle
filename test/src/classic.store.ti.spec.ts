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
  const cards: (ClassicCard & { artCrop: string; oracleText: string })[] =
    Array.from({ length: 64 }, (_, i) => ({
      id: randomUUID(),
      name: `Card ${i}`,
      image: null,
      artCrop: 'https://cards.scryfall.io/art_crop/front/test.jpg',
      oracleText: `Card ${i} deals 2 damage to any target.`,
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
    expect(hinted.hint.removed).toBe(27);
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
  it('gates illustration and text independently at 20 and 30 errors, without exposing private data', async () => {
    const initial = await store.state(session);
    const target = await answer();
    const wrong = cards.filter((c) => c.id !== target);
    expect(initial.hints.every((h) => !h.used)).toBe(true);
    expect(JSON.stringify(initial)).not.toContain('art_crop');
    expect(JSON.stringify(initial)).not.toContain('deals 2 damage');
    await expect(store.artSource(initial.day, session)).rejects.toThrow();
    for (const card of wrong.slice(0, 19))
      await store.act(initial.day, session, 'guess', card.id, randomUUID());
    await expect(
      store.act(initial.day, session, 'hint', undefined, undefined, 'art'),
    ).rejects.toThrow();
    await store.act(initial.day, session, 'guess', wrong[19].id, randomUUID());
    const art = await store.act(
      initial.day,
      session,
      'hint',
      undefined,
      undefined,
      'art',
    );
    expect(art.hints.find((h) => h.kind === 'art')).toMatchObject({
      used: true,
      hasImage: true,
    });
    expect(await store.artSource(initial.day, session)).toContain('/art_crop/');
    expect(
      await store.act(
        initial.day,
        session,
        'hint',
        undefined,
        undefined,
        'art',
      ),
    ).toEqual(art);
    await expect(store.artSource(initial.day, randomUUID())).rejects.toThrow();
    for (const card of wrong.slice(20, 29))
      await store.act(initial.day, session, 'guess', card.id, randomUUID());
    await expect(
      store.act(initial.day, session, 'hint', undefined, undefined, 'text'),
    ).rejects.toThrow();
    await store.act(initial.day, session, 'guess', wrong[29].id, randomUUID());
    const revealed = await store.act(
      initial.day,
      session,
      'hint',
      undefined,
      undefined,
      'text',
    );
    expect(revealed.hints.find((h) => h.kind === 'text')?.text).toBe(
      '[cette carte] deals 2 damage to any target.',
    );
    expect(revealed).not.toHaveProperty('answer');
    expect(await store.state(session)).toEqual(revealed);
    expect(JSON.stringify(revealed)).not.toContain('art_crop');
    expect(revealed.guesses[0].card).not.toHaveProperty('oracleText');
  });
});
