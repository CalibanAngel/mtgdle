// Readiness must not create anonymous game sessions or depend on Scryfall uptime.
const { Client } = require('pg');
async function main() {
  const response = await fetch('http://127.0.0.1:3000/api-json', { signal: AbortSignal.timeout(3000) });
  await response.body?.cancel();
  if (!response.ok) throw new Error('API unavailable');
  const db = new Client({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionTimeoutMillis: 3000,
    query_timeout: 3000,
  });
  await db.connect();
  try {
    const { rows } = await db.query('SELECT EXISTS(SELECT 1 FROM classic_catalogue) AS ready');
    if (!rows[0].ready) throw new Error('Catalogue unavailable');
  } finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

