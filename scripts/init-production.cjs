// One-time initialization only. Never synchronize an existing database.
require('reflect-metadata');
const { DataSource } = require('typeorm');
const { Entities } = require('../packages/api/dist/infrastructure/database/entities');
const fs = require('node:fs');
const path = require('node:path');
async function main() {
  const db = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 5432),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: Entities,
    synchronize: false,
    dropSchema: false,
  });
  await db.initialize();
  try {
    const [{ count }] = await db.query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
    if (count !== 0) throw new Error('Initialization refused: database is not empty. Use reviewed migrations for an existing installation.');
    await db.synchronize(false);
    await db.query(fs.readFileSync(path.join(__dirname, 'classic-schema.sql'), 'utf8'));
    console.log('Empty production database initialized. Automatic synchronization remains disabled.');
  } finally { await db.destroy(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
