import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Content-hashed assets (immutable) — cache split + invalidation handled by the fed deploy
// (/workflow/github-actions). Build-time config via VITE_* (/frontend/environment-config).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
