/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly BACK_API_HOST: string;
  readonly BACK_API_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv & {
    readonly MODE: 'development' | 'production' | 'test';
  };
}
