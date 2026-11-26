import { registerAs } from '@nestjs/config';

export const adminConfig = registerAs('admin', () => ({
  token: process.env.ADMIN_API_TOKEN || '',
  username: process.env.ADMIN_USERNAME || 'admin',
  passwordHash: process.env.ADMIN_PASSWORD_HASH || '',
}));
export type AdminConfig = ReturnType<typeof adminConfig>;
