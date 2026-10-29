const { Client } = require('pg');
const path = require('node:path');
require('dotenv').config({
  path: path.join(__dirname, '../.env'),
  quiet: true,
});
require('dotenv').config({
  path: path.join(__dirname, '../packages/api/.env'),
  quiet: true,
});
const name = process.env.CLASSIC_TEST_DATABASE;
if (
  !name ||
  !/^[a-zA-Z0-9_]+_classic_test$/.test(name) ||
  name === process.env.DATABASE_NAME
)
  throw new Error(
    'Set CLASSIC_TEST_DATABASE to a dedicated database name ending with _classic_test.',
  );
const client = new Client({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});
async function main() {
  await client.connect();
  try {
    const found = await client.query(
      'SELECT 1 FROM pg_database WHERE datname=$1',
      [name],
    );
    if (!found.rowCount) await client.query(`CREATE DATABASE "${name}"`);
    console.log(`Dedicated test database ready: ${name}`);
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
