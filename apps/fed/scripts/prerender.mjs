// Build-time prerender. Snapshots each public route to static HTML so crawlers (LinkedIn/WhatsApp/
// Google) read the per-route <head> (OG/Twitter/JSON-LD) without running JS. Requires a prior
// `vite build` (it serves dist/ with `vite preview`, drives it with the headless browser we already
// use for e2e, and writes dist/<route>/index.html). Run: `npm run prerender` (or `build:static`).
//
// Per-locale prerender (ADR-0036): every logical route is snapshotted in BOTH locales — the locale is
// carried in the URL PATH, which the app treats as authoritative, so navigating to `/pt/me` renders the
// Portuguese edition regardless of the browser language. That determinism is why one browser context
// suffices: the path pins the locale, not `navigator.language`. Each snapshot lands its own <head>
// (og:locale, self-canonical, hreflang), written to `dist/<locale>/<route>/index.html`.
//
// PLUS a bare-root x-default snapshot at `dist/index.html`: navigating `/` with an English browser context
// triggers the client-side redirect to `/en`, so we capture the English landing — OG-complete, og:locale
// en_US, hreflang x-default → the bare origin — for the JS-less crawler that never runs the redirect.
import { preview } from 'vite';
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { localizedRoutes, canonicalFor, localePath } from './routes.mjs';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');

// Shared with the sitemap generator so the snapshotted routes and the advertised URLs can't drift.
const targets = localizedRoutes();

const port = 4183;
const server = await preview({ preview: { port, strictPort: true } });
const base = `http://localhost:${port}`;
const browser = await chromium.launch();
// English browser context: it only matters for the bare-root x-default capture (which follows the client
// redirect); the prefixed routes derive their locale from the path, independent of this.
const context = await browser.newContext({ locale: 'en-US' });
const page = await context.newPage();

// Snapshot the page currently loaded once its canonical matches `expectedCanonical`, writing to `outDir`.
async function snapshot(navUrl, expectedCanonical, outDir) {
  await page.goto(base + navUrl, { waitUntil: 'load' });
  // The head is set in an effect (meta tags are in <head>, never "visible"). Wait until the canonical link
  // matches the target, which confirms the correct route's head fully applied (and, for the bare root,
  // that the client redirect settled), then let data settle.
  await page.waitForFunction(
    // eslint-disable-next-line no-undef -- this callback is serialized and runs in the browser page
    (href) => document.querySelector('link[rel="canonical"]')?.getAttribute('href') === href,
    expectedCanonical,
    { timeout: 15000 },
  );
  await page.waitForTimeout(400);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), await page.content());
}

try {
  for (const { locale, route, url } of targets) {
    const outDir = route === '/' ? join(dist, locale) : join(dist, locale, route);
    await snapshot(url, canonicalFor(locale, route), outDir);
    console.log(`prerendered ${url}`);

    // Build-time CV export (#140), emitted ONCE from the English canonical CV (/en/me, ADR-0024) — the PDF
    // is the English edition, so pt/me must not re-emit it. `page.pdf()` is headless-chromium only — which
    // this pass already is — so no new dependency. Print-media emulation drives @media print (chrome
    // hidden, mono palette on paper); printBackground keeps the orange accents + filled LevelMeter squares.
    if (locale === 'en' && route === '/me') {
      await page.pdf({
        path: join(dist, 'cv.pdf'),
        printBackground: true,
        format: 'A4',
        margin: { top: '1.5cm', bottom: '1.5cm', left: '1.5cm', right: '1.5cm' },
      });
      console.log('  emitted dist/cv.pdf');
    }
  }

  // The x-default bare-root snapshot → dist/index.html. Navigating `/` redirects to `/en` (English
  // context), so the captured canonical is the English landing's.
  await snapshot('/', canonicalFor('en', '/'), dist);
  console.log(`prerendered / (x-default → ${localePath('en', '/')})`);
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
console.log(`\nPrerendered ${targets.length} localized routes (+ x-default root) into dist/.`);
