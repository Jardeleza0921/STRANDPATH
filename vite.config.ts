import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app is served by the Node API server in production (see server/index.js).
// During development, `npm run dev` proxies /api to the API server on port 8787.
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: false
      }
    }
  }
});
