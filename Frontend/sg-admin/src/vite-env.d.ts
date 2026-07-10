/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_API?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_JWT_SECRET?: string;
  readonly VITE_JWT_ISSUER?: string;
  readonly VITE_JWT_AUDIENCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
