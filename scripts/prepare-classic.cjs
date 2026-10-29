const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const { parser } = require('stream-json');
const { streamArray } = require('stream-json/streamers/StreamArray');
require('dotenv').config({
  path: path.join(__dirname, '../.env'),
  quiet: true,
});
require('dotenv').config({
  path: path.join(__dirname, '../packages/api/.env'),
  quiet: true,
});

// Only keyword abilities that define activated abilities, not triggered/static ones.
const activatedKeywords = new Set([
  'Equip',
  'Cycling',
  'Landcycling',
  'Basic landcycling',
  'Typecycling',
  'Transmute',
  'Transfigure',
  'Unearth',
  'Level up',
  'Outlast',
  'Ninjutsu',
  'Commander ninjutsu',
  'Reinforce',
  'Scavenge',
  'Embalm',
  'Eternalize',
  'Encore',
  'Crew',
  'Saddle',
  'Craft',
  'Fortify',
  'Reconfigure',
  'Boast',
  'Adapt',
]);
function hasActivated(card) {
  let text = card.oracle_text || '';
  // Remove reminder text and quoted abilities granted to other objects.
  let previous;
  do {
    previous = text;
    text = text.replace(/\([^()]*\)/g, '');
  } while (text !== previous);
  text = text.replace(/[“"][^”"]*[”"]/g, '');
  return (
    /(?:^|\n)[^\n:]+:/.test(text) ||
    (card.keywords || []).some((k) => activatedKeywords.has(k))
  );
}
function standard(card) {
  return (
    !card.promo &&
    !card.full_art &&
    !['borderless', 'silver', 'gold'].includes(card.border_color) &&
    !(card.frame_effects || []).some((f) =>
      ['showcase', 'extendedart', 'inverted'].includes(f),
    )
  );
}
const earlier = (a, b) =>
  !b || `${a.released_at}/${a.id}` < `${b.released_at}/${b.id}`;

async function main() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  await client.connect();
  try {
    const names = new Set(
      (await client.query('SELECT name FROM playable_card')).rows.map(
        (r) => r.name,
      ),
    );
    const entries = new Map();
    const file =
      process.env.SCRYFALL_BULK_FILE ||
      path.join(
        __dirname,
        '../packages/api/src/infrastructure/external/scryfall/bulk-data/default-cards.json',
      );
    const stream = fs.createReadStream(file).pipe(parser()).pipe(streamArray());
    for await (const { value: c } of stream) {
      if (
        !names.has(c.name) ||
        c.layout !== 'normal' ||
        c.lang !== 'en' ||
        !c.games.includes('paper') ||
        !c.oracle_id
      )
        continue;
      const e = entries.get(c.oracle_id) || {};
      if (earlier(c, e.first)) e.first = c;
      if (standard(c) && earlier(c, e.art)) e.art = c;
      entries.set(c.oracle_id, e);
    }
    const cards = [...entries.entries()]
      .filter(([, e]) => e.art)
      .map(([id, { first, art }]) => ({
        id,
        name: first.name,
        image: art.image_uris?.small || null,
        previewImage: art.image_uris?.normal || null,
        artCrop: art.image_uris?.art_crop || null,
        oracleText: first.oracle_text || '',
        identity: first.color_identity,
        mana: first.cmc,
        types: first.type_line
          .split(' — ')[0]
          .split(' ')
          .filter(
            (t) =>
              !['Basic', 'Legendary', 'Snow', 'World', 'Ongoing'].includes(t),
          ),
        edition: first.set_name,
        rarity: first.rarity,
        released: first.released_at,
        keywords: first.keywords || [],
        activated: hasActivated(first),
      }));
    if (!cards.length)
      throw new Error('No eligible cards: nothing was changed.');
    console.log(
      `Catalogue: ${cards.length} logical cards from ${names.size} selected names. Standard English paper art; dates reflect earliest English paper printing in the supplied bulk snapshot.`,
    );
    if (process.argv.includes('--check')) return;
    await client.query('BEGIN');
    await client.query(
      fs.readFileSync(path.join(__dirname, 'classic-schema.sql'), 'utf8'),
    );
    for (const card of cards)
      await client.query(
        'INSERT INTO classic_catalogue(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data',
        [card.id, card],
      );
    // Enrich media and the added rarity criterion only; preserve answers and all original criteria.
    await client.query(`UPDATE classic_daily d SET cards = (
      SELECT jsonb_agg(item || jsonb_build_object(
        'previewImage', c.data->'previewImage', 'artCrop', c.data->'artCrop', 'oracleText', c.data->'oracleText', 'rarity', c.data->'rarity'
      ) ORDER BY position)
      FROM jsonb_array_elements(d.cards) WITH ORDINALITY AS items(item, position)
      LEFT JOIN classic_catalogue c ON c.id::text = item->>'id'
    )`);
    await client.query('COMMIT');
    console.log(
      'Additive schema and catalogue ready. Existing daily snapshots and all original tables preserved.',
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { hasActivated, standard };
