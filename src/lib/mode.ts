/**
 * The student application is static by default: it runs entirely in the
 * browser and stores records in localStorage. Setting VITE_API_MODE=server at
 * build time restores the optional Node API (useful for the school-hosted
 * version with shared accounts, email and the admin dashboard).
 */
export const API_MODE: 'static' | 'server' = import.meta.env.VITE_API_MODE === 'server' ? 'server' : 'static';

export const isStaticMode = (): boolean => API_MODE === 'static';

/** GitHub Pages cannot rewrite nested paths, so the static build uses hash routing. */
export const routerMode: 'hash' | 'browser' = isStaticMode() ? 'hash' : 'browser';

export const STATIC_STORAGE_NOTICE =
  'This static build saves your account and records in this browser only. Clearing site data, using private mode, or switching device or browser removes them, and this copy cannot be recovered from a server.';
