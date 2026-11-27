/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "server" keeps the optional Node API; anything else (the default) runs the static build. */
  readonly VITE_API_MODE?: 'static' | 'server';
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
