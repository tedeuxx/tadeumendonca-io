import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Content-hashed assets (immutable) — cache split + invalidation handled by the fed deploy
// (/workflow/github-actions). Build-time config via VITE_* (/frontend/environment-config).
//
// No PWA: the site is a plain static SPA (no service worker, no manifest, no offline shell).
// Returning visitors who still carry the retired service worker are cleaned up by the
// unregister shim in src/lib/serviceWorker.ts.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
