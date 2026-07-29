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
// Mark the snapshot browser (#172). Anything whose render depends on the VISITOR — not on the route —
// must opt out here, because this context is not a visitor: it is pinned to en-US and its output is
// served to everyone. The locale-suggestion notice is the case that forced this: on a `/pt` route the
// snapshot browser looks like an English speaker, so the offer rendered and BAKED into the Portuguese
// HTML, suggesting English to every pt reader until hydration removed it.
//
// A post-mount flag does NOT solve that here, which is the non-obvious part: this prerender snapshots a
// LIVE, already-hydrated page (`page.content()` after the head settles), so effects have run and any
// `mounted` gate is long since true. The signal has to be about WHO is rendering, not WHEN.
await context.addInitScript(() => {
  // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
  window.__PRERENDER__ = true;
});
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
        // 1cm, not the 1.5cm this used to carry: on A4 that recovers ~75px of usable height, which is a
        // meaningful fraction of the single sheet the CV has to fit (#161). Still inside what any printer
        // renders and what a reader reads as a margin. Must match the `@page` rule in styles/index.css,
        // or a browser-printed page and the build-time PDF lay out differently.
        margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
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
