import { registerAs } from '@nestjs/config';
import * as process from 'node:process';

export const scryfallConfig = registerAs('scryfall', () => ({
  host: process.env.SCRYFALL_API_HOST!,
}));

export type ScryfallConfig = ReturnType<typeof scryfallConfig>;
