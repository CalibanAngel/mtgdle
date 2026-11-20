import { registerAs } from '@nestjs/config';
import * as process from 'node:process';
import { resolve } from 'node:path';

export const scryfallConfig = registerAs('scryfall', () => ({
  host: process.env.SCRYFALL_API_HOST!,
  bulkFile:
    process.env.SCRYFALL_BULK_FILE ||
    resolve(
      __dirname,
      '../../../../packages/api/src/infrastructure/external/scryfall/bulk-data/default-cards.json',
    ),
}));

export type ScryfallConfig = ReturnType<typeof scryfallConfig>;
