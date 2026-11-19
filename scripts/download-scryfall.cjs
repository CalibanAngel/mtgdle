const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { createGunzip } = require('node:zlib');
const { createInterface } = require('node:readline');
const { createWriteStream } = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');
async function main() {
  const headers = { 'User-Agent': 'MTGdle/1.0 (self-hosted catalogue initialization)', Accept: 'application/json' };
  const metadata = await fetch('https://api.scryfall.com/bulk-data/default-cards', { headers, signal: AbortSignal.timeout(30000) });
  if (!metadata.ok) throw new Error(`Scryfall metadata: HTTP ${metadata.status}`);
  const info = await metadata.json();
  const jsonl = !info.download_uri && !!info.jsonl_download_uri;
  const url = new URL(info.download_uri || info.jsonl_download_uri);
  if (url.protocol !== 'https:' || url.hostname !== 'data.scryfall.io') throw new Error('Unexpected Scryfall bulk host');
  const file = process.env.SCRYFALL_BULK_FILE || '/data/default-cards.json';
  await fs.mkdir(path.dirname(file), { recursive: true });
  console.log(`Downloading Scryfall default_cards snapshot dated ${info.updated_at}`);
  const response = await fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(1800000) });
  if (!response.ok || !response.body) throw new Error(`Bulk download: HTTP ${response.status}`);
  let source = Readable.fromWeb(response.body);
  if (jsonl) {
    const lines = createInterface({ input: url.pathname.endsWith('.gz') ? source.pipe(createGunzip()) : source, crlfDelay: Infinity });
    source = Readable.from((async function* () {
      yield '[';
      let first = true;
      for await (const line of lines) {
        if (!line.trim()) continue;
        JSON.parse(line); // Validate each object before committing the snapshot.
        yield (first ? '' : ',') + line;
        first = false;
      }
      yield ']';
    })());
  }
  await pipeline(source, createWriteStream(file + '.tmp', { mode: 0o644 }));
  if ((await fs.stat(file + '.tmp')).size < 1000000) throw new Error('Unexpectedly small bulk file');
  await fs.rename(file + '.tmp', file);
  console.log('Scryfall bulk snapshot saved.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
