const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env'), quiet: true });
require('dotenv').config({
  path: path.join(root, 'packages/api/.env'),
  quiet: true,
});
const build = spawnSync(
  process.execPath,
  [
    path.join(root, 'node_modules/typescript/bin/tsc'),
    '-p',
    path.join(root, 'packages/shared-types/tsconfig.json'),
  ],
  { stdio: 'inherit' },
);
if (build.status !== 0) process.exit(build.status || 1);
const env = {
  ...process.env,
  DATABASE_SYNCHRONIZE: 'false',
  DATABASE_DROP_SCHEMA: 'false',
  SCHEDULE_ENABLED: 'false',
  TS_NODE_PREFER_TS_EXTS: 'true',
};
const api = spawn(
  process.execPath,
  [
    '-r',
    'ts-node/register/transpile-only',
    '-r',
    'tsconfig-paths/register',
    'src/main.ts',
  ],
  { cwd: path.join(root, 'packages/api'), env, stdio: 'inherit' },
);
const front = spawn(
  process.execPath,
  [
    path.join(root, 'node_modules/vite/bin/vite.js'),
    '--host',
    env.FRONT_API_HOST || 'localhost',
    '--port',
    env.FRONT_API_PORT || '5173',
    '--strictPort',
  ],
  { cwd: path.join(root, 'packages/front'), env, stdio: 'inherit' },
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill();
  front.kill();
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
api.on('exit', (code) => stop(code || 0));
front.on('exit', (code) => stop(code || 0));
api.on('error', (error) => {
  console.error(error.message);
  stop(1);
});
front.on('error', (error) => {
  console.error(error.message);
  stop(1);
});
