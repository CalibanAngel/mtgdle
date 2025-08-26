import { registerAs } from '@nestjs/config';

export const httpConfig = registerAs('http', () => ({
  api_host: process.env.BACK_API_HOST!,
  api_port: Number(process.env.BACK_API_PORT) || 3000,
  front_host: process.env.FRONT_API_HOST!,
  front_port: Number(process.env.FRONT_API_PORT) || 5173,
}));

// TS will infer this type for you:
export type HttpConfig = ReturnType<typeof httpConfig>;
