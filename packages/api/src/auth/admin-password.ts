import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}
export async function hashAdminPassword(password: string): Promise<string> {
  if (password.length < 12 || password.length > 256)
    throw new Error('Use a password between 12 and 256 characters.');
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}
export async function verifyAdminPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const match = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(hash);
  if (!match || password.length > 256) return false;
  return timingSafeEqual(
    await derive(password, Buffer.from(match[1], 'hex')),
    Buffer.from(match[2], 'hex'),
  );
}
