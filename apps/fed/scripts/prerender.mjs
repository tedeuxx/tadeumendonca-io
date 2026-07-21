// Build-time prerender. Snapshots each public route to static HTML so crawlers (LinkedIn/WhatsApp/
// Google) read the per-route <head> (OG/Twitter/JSON-LD) without running JS. Requires a prior
// `vite build` (it serves dist/ with `vite preview`, drives it with the headless browser we already
// use for e2e, and writes dist/<route>/index.html). Run: `npm run prerender` (or `build:static`).
import { preview } from 'vite';
import { chromium } from '@playwright/test';
import { load } from 'js-yaml';
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const contentDir = join(root, 'src', 'content', 'blog');

// Slug from frontmatter (falls back to filename) — must match src/lib/content.ts.
function slugOf(file) {
  const raw = readFileSync(join(contentDir, file), 'utf8');
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  const fm = m ? load(m[1]) : null;
  return (fm && fm.slug) || file.replace(/\.md$/, '');
}

const slugs = readdirSync(contentDir)
  .filter((f) => f.endsWith('.md'))
  .map(slugOf);
const routes = ['/', '/portfolio', '/blog', ...slugs.map((s) => `/blog/${s}`)];

const SITE_URL = process.env.VITE_SITE_URL?.replace(/\/$/, '') ?? 'https://tadeumendonca.io';
const canonicalFor = (route) => (route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`);

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
