/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KASANE_API_BASE_URL: string;
  readonly VITE_KASANE_USERNAME: string;
  readonly VITE_KASANE_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
