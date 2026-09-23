/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_MODE?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_TOKEN_ACCESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
