import { registerAs } from '@nestjs/config';

export const scryfallConfig = registerAs('scryfall', () => ({
  host: process.env.SCRYFALL_API_HOST!,
}));

// TS will infer this type for you:
export type ScryfallConfig = ReturnType<typeof scryfallConfig>;
