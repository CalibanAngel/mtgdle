import { registerAs } from '@nestjs/config';

export const httpConfig = registerAs('http', () => ({
  host: process.env.APP_HOST!,
  port: Number(process.env.APP_PORT) || 3000,
}));

// TS will infer this type for you:
export type HttpConfig = ReturnType<typeof httpConfig>;
