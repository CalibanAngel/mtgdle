import { registerAs } from '@nestjs/config';

export const adminConfig = registerAs('admin', () => ({
  token: process.env.ADMIN_API_TOKEN || '',
}));
export type AdminConfig = ReturnType<typeof adminConfig>;
