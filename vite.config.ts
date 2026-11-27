import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The student application is a static site. GitHub Pages project sites need a
// base path (for example "/STRANDPATH/"); the workflow sets VITE_BASE_PATH.
// The optional Node API can still be used in development with VITE_API_MODE=server,
// in which case `npm run dev:api` serves it on port 8787 and this proxy forwards /api.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Development-only host allowance, supplied per process (for example by a
    // cloud preview). No hostnames are committed, and the build is unaffected.
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? process.env.VITE_ALLOWED_HOSTS.split(',').map((host) => host.trim())
      : undefined,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: false
      }
    }
  }
});
