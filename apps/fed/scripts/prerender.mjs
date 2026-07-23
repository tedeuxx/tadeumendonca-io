// Build-time prerender. Snapshots each public route to static HTML so crawlers (LinkedIn/WhatsApp/
// Google) read the per-route <head> (OG/Twitter/JSON-LD) without running JS. Requires a prior
// `vite build` (it serves dist/ with `vite preview`, drives it with the headless browser we already
// use for e2e, and writes dist/<route>/index.html). Run: `npm run prerender` (or `build:static`).
import { preview } from 'vite';
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { publicRoutes, canonicalFor } from './routes.mjs';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');

// Shared with the sitemap generator so the snapshotted routes and the advertised URLs can't drift.
const routes = publicRoutes();

const port = 4183;
const server = await preview({ preview: { port, strictPort: true } });
const base = `http://localhost:${port}`;
const browser = await chromium.launch();
const page = await browser.newPage();

try {
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: 'load' });
    // The head is set in an effect (meta tags are in <head>, never "visible"). Wait until this route's
    // canonical link lands, which confirms the correct route's head fully applied, then let data settle.
    await page.waitForFunction(
      // eslint-disable-next-line no-undef -- this callback is serialized and runs in the browser page
      (href) => document.querySelector('link[rel="canonical"]')?.getAttribute('href') === href,
      canonicalFor(route),
      { timeout: 15000 },
    );
    await page.waitForTimeout(400);
    const html = await page.content();
    const outDir = route === '/' ? dist : join(dist, route);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html);
    console.log(`prerendered ${route}`);
  }
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
console.log(`\nPrerendered ${routes.length} routes into dist/.`);
