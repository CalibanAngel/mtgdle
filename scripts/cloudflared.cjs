const { spawnSync } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

// Immutable official release; hashes published by Cloudflare on the release page.
const version = '2026.10.6';
const releases = {
  'win32-x64': [
    'cloudflared-windows-amd64.exe',
    'd521b3bf68982165f0d06d76732f22d9a105ef057ff3ae4c0986f3a23190950f',
  ],
  'linux-x64': [
    'cloudflared-linux-amd64',
    '1d356dac769d0dbf62ebe588c4034824bbff98d5790c2f844cc99e0e2f57462d',
  ],
  'linux-arm64': [
    'cloudflared-linux-arm64',
    '0ae0e179475b2c77651a718d2b376e0151f4fca5954702a84f02843a4d5fcac0',
  ],
};
async function ensureCloudflared(root, signal) {
  const command = process.env.CLOUDFLARED_PATH || 'cloudflared';
  const installed = spawnSync(command, ['--version'], {
    windowsHide: true,
    timeout: 5000,
    stdio: 'ignore',
  });
  if (installed.status === 0) return command;
  if (process.env.CLOUDFLARED_PATH)
    throw new Error(
      'CLOUDFLARED_PATH ne désigne pas un exécutable cloudflared valide.',
    );
  const release = releases[`${process.platform}-${process.arch}`];
  if (!release)
    throw new Error(
      'Installe cloudflared depuis https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/ puis relance la commande.',
    );
  const [asset, checksum] = release;
  const folder = path.join(root, '.tools', 'cloudflared', version);
  const binary = path.join(folder, asset);
  let data;
  try {
    data = await fs.readFile(binary);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (!data) {
    console.log(
      `Téléchargement de cloudflared ${version} depuis la publication officielle Cloudflare…`,
    );
    const response = await fetch(
      `https://github.com/cloudflare/cloudflared/releases/download/${version}/${asset}`,
      {
        signal: AbortSignal.any([signal, AbortSignal.timeout(120000)]),
      },
    );
    if (!response.ok)
      throw new Error(
        `Téléchargement cloudflared impossible (${response.status}).`,
      );
    data = Buffer.from(await response.arrayBuffer());
    if (createHash('sha256').update(data).digest('hex') !== checksum)
      throw new Error(
        'Empreinte cloudflared incorrecte : téléchargement refusé.',
      );
    await fs.mkdir(folder, { recursive: true });
    const temporary = binary + `.download-${process.pid}`;
    await fs.writeFile(temporary, data, { mode: 0o755 });
    await fs.rename(temporary, binary);
  }
  if (createHash('sha256').update(data).digest('hex') !== checksum)
    throw new Error(
      'Le binaire cloudflared en cache est modifié. Retire-le de .tools/cloudflared puis relance.',
    );
  return binary;
}
module.exports = { ensureCloudflared };
