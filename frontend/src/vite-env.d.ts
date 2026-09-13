/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional override for the backend origin (e.g. https://api.example.com). Leave unset in dev to use the Vite proxy. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
