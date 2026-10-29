const { spawn } = require('node:child_process');
const { port, available } = require('./ports.cjs');
const path = require('node:path');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');
const { createPreviewServer } = require('./classic-preview.cjs');
const { ensureCloudflared } = require('./cloudflared.cjs');
const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env'), quiet: true });
require('dotenv').config({
  path: path.join(root, 'packages/api/.env'),
  quiet: true,
});
const distant = process.argv.includes('--distant');
const children = new Set();
const cancellation = new AbortController();
let server;
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  cancellation.abort();
  if (server) {
    server.close();
    server.closeAllConnections();
  }
  for (const child of children) child.kill();
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
function launch(command, args, options = {}, persistent = false) {
  if (stopping) throw new Error('Démarrage interrompu.');
  const child = spawn(command, args, {
    cwd: root,
    env,
    windowsHide: true,
    stdio: 'inherit',
    ...options,
  });
  children.add(child);
  child.once('exit', () => children.delete(child));
  if (persistent) {
    child.once('error', (error) => {
      console.error(error.message);
      stop(1);
    });
    child.once('exit', (code) => {
      if (!stopping) {
        console.error(
          'Un service s’est arrêté. Fermeture du démarrage complet.',
        );
        stop(code || 1);
      }
    });
  }
  return child;
}
async function runNode(args, cwd = root) {
  const child = launch(process.execPath, args, { cwd });
  const [code] = await once(child, 'exit');
  if (code !== 0 || stopping)
    throw new Error('La compilation a échoué ou a été interrompue.');
}
async function ready(url) {
  const deadline = Date.now() + 60000;
  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.any([
          cancellation.signal,
          AbortSignal.timeout(2000),
        ]),
      });
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      /* Service still starting. */
    }
    await delay(250, undefined, { signal: cancellation.signal });
  }
  throw new Error(`Le service ne répond pas : ${url}`);
}
// Separate remote ports allow sharing while the local development instance runs.
const apiPort = port(
  distant
    ? process.env.SHARE_API_PORT || 3003
    : process.env.BACK_API_PORT || 3000,
  'API',
);
const frontPort = port(
  distant ? process.env.SHARE_PORT || 5180 : process.env.FRONT_API_PORT || 5173,
  'frontend',
);
const apiOrigin = `http://127.0.0.1:${apiPort}`;
const frontOrigin = `http://${distant ? '127.0.0.1' : 'localhost'}:${frontPort}`;
const env = {
  ...process.env,
  NODE_ENV: distant ? 'production' : 'development',
  BACK_API_HOST: '127.0.0.1',
  BACK_API_PORT: String(apiPort),
  FRONT_API_HOST: '127.0.0.1',
  FRONT_API_PORT: String(frontPort),
  API_BIND_HOST: '127.0.0.1',
  TRUST_LOCAL_PROXY: 'true',
  VITE_API_URL: '/api',
  DATABASE_SYNCHRONIZE: 'false',
  DATABASE_DROP_SCHEMA: 'false',
  SCHEDULE_ENABLED: 'false',
  TS_NODE_PREFER_TS_EXTS: 'true',
};
async function main() {
  if (apiPort === frontPort)
    throw new Error('Les ports API et frontend doivent être différents.');
  await Promise.all([available(apiPort), available(frontPort)]);
  const cloudflared = distant
    ? await ensureCloudflared(root, cancellation.signal)
    : undefined;
  await runNode([
    path.join(root, 'node_modules/typescript/bin/tsc'),
    '-p',
    path.join(root, 'packages/shared-types/tsconfig.json'),
  ]);
  if (distant) {
    console.log('Compilation du jeu à partager…');
    await runNode(
      [
        path.join(root, 'node_modules/vite/bin/vite.js'),
        'build',
        '--mode',
        'production',
        '--outDir',
        'dist-shared',
      ],
      path.join(root, 'packages/front'),
    );
  }
  launch(
    process.execPath,
    [
      '-r',
      'ts-node/register/transpile-only',
      '-r',
      'tsconfig-paths/register',
      'src/main.ts',
    ],
    {
      cwd: path.join(root, 'packages/api'),
    },
    true,
  );
  await ready(`${apiOrigin}/classic/today`);
  if (!distant) {
    launch(
      process.execPath,
      [
        path.join(root, 'node_modules/vite/bin/vite.js'),
        '--host',
        '127.0.0.1',
        '--port',
        String(frontPort),
        '--strictPort',
      ],
      {
        cwd: path.join(root, 'packages/front'),
      },
      true,
    );
    await ready(frontOrigin);
    console.log(`\nJeu local : ${frontOrigin}\nCtrl+C pour arrêter.\n`);
    return;
  }
  server = createPreviewServer({
    directory: path.join(root, 'packages/front/dist-shared'),
    apiOrigin,
  });
  server.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  server.listen(frontPort, '127.0.0.1');
  await once(server, 'listening');
  console.log(
    `\nAperçu local : ${frontOrigin}\nOuverture du tunnel temporaire…`,
  );
  const fs = require('node:fs/promises');
  const config = path.join(root, '.tools/quick-tunnel.yml');
  await fs.mkdir(path.dirname(config), { recursive: true });
  await fs.writeFile(config, '{}\n');
  const tunnel = launch(
    cloudflared,
    ['tunnel', '--config', config, '--url', frontOrigin, '--no-autoupdate'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    },
    true,
  );
  let announced = false;
  let tail = '';
  function output(chunk) {
    const line = chunk.toString();
    tail = (tail + line).slice(-4096);
    const address = tail.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (address && !announced) {
      announced = true;
      console.log(
        `\nLien à partager : ${address[0]}\nGarde ce terminal et ton PC allumés. Ctrl+C coupe le partage.\n`,
      );
    }
    if (/ERR|error/i.test(line)) process.stderr.write(line);
  }
  tunnel.stdout.on('data', output);
  tunnel.stderr.on('data', output);
  const timeout = setTimeout(() => {
    if (!announced) {
      console.error(
        'Impossible d’obtenir une adresse de partage Cloudflare. Vérifie la connexion Internet.',
      );
      stop(1);
    }
  }, 60000);
  timeout.unref();
  tunnel.once('exit', () => clearTimeout(timeout));
}
main().catch((error) => {
  if (!stopping) console.error(error.message);
  stop(1);
});
