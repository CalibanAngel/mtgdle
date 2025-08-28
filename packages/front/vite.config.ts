import path from 'node:path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

function mergedClientEnv(mode: string) {
  // 1) Load env from repo root
  const repoRoot = path.resolve(__dirname, '../../'); // adjust if your monorepo depth differs
  const rootEnv = loadEnv(mode, repoRoot, 'BACK_'); // only VITE_* keys

  // 2) Load env from the front package directory (local)
  const localEnv = loadEnv(mode, __dirname, 'VITE_');

  // 3) Merge with localEnv overriding rootEnv
  const merged = { ...rootEnv, ...localEnv };

  // 4) Convert to define entries so they become available as import.meta.env.*
  const defineEntries = Object.fromEntries(
    Object.entries(merged).map(([k, v]) => [
      `import.meta.env.${k}`,
      JSON.stringify(v),
    ]),
  );

  return defineEntries;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  define: {
    ...mergedClientEnv(mode),
  },
}));
