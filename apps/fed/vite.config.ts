import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Content-hashed assets (immutable) — cache split + invalidation handled by the fed deploy
// (/workflow/github-actions). Build-time config via VITE_* (/frontend/environment-config).
//
// PWA (vite-plugin-pwa / Workbox): installable, offline app-shell. `autoUpdate` ships a new service
// worker that activates on the next load; `injectRegister: 'auto'` wires the SW registration into the
// built HTML (no source code, so nothing new to unit-test). The OAuth callback is denylisted from the
// navigation fallback so a returning Cognito redirect always hits the network, never the cached shell.
// NOTE: the deploy must serve sw.js + manifest.webmanifest as no-cache (they are NOT content-hashed),
// otherwise clients get stuck on a stale service worker — handled in .github/workflows/deploy.yml.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Tadeu Mendonça',
        short_name: 'TM.io',
        description: 'Tadeu Mendonça — Software Engineer. CV, posts e artigos.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0A0A0A',
        theme_color: '#0A0A0A',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/callback/],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
