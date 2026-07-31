// Generates the site-wide default OG image, ONE PER LOCALE (public/og-default.png for en,
// og-default.pt.png for pt — 1200x630) — the fallback og:image when a page has no explicit one.
//
// It sells the PROMISE, not the person. The site's thesis is reader-first (the reader learning is the
// product; self-promotion is a by-product), so the card carries the hero's promise as a hook — a portrait
// + name card reads as a business card and contradicts that positioning. Composition is tuned for the size
// an unfurl is actually seen (~320px wide, a 1:4 downscale): one dominant line, everything else subordinate.
//
// PER LOCALE SINCE #167. This file used to say "copy is English because the crawlable/OG baseline is
// pinned to English (ADR-0032)" — and ADR-0036 retired that clause of 0032, which is why the comment is
// quoted here instead of deleted: it was the stale justification for the exact defect #167 fixes. #162
// gave a shared /pt/* link Portuguese og:title and og:description; the IMAGE stayed English, so a pt
// reader got a card whose text disagreed with its own picture.
//
// Carries the same brand mark ("T-block") as public/favicon.svg and the app icon, so the identity is one
// system across every surface. Rendered as HTML and screenshotted with Playwright (already a devDependency
// — the same headless Chromium the prerender uses), so no image/canvas library is needed; the site fonts
// are embedded as data: URIs so it renders identically everywhere. Run: `npm run gen-og`.
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { CARD_COPY, META_LINE, LOCALES, defaultCardFile } from './og-copy.mjs';

const root = resolve(import.meta.dirname, '..');
const fontsDir = join(root, 'node_modules', '@fontsource');

const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(fontsDir, pkg, 'files', file)).toString('base64')}`;
const grotesk = font('space-grotesk', 'space-grotesk-latin-700-normal.woff2');
const mono = font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2');

// The brand mark, inline — same 512-space geometry as favicon.svg / gen-icons.mjs.
const mark = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="#FF5A00"/><g fill="#0A0A0A"><rect x="112" y="140" width="288" height="72"/><rect x="220" y="140" width="72" height="232"/></g></svg>`;

// Brutalist mono: near-black canvas, one safety-orange accent, radius 0, no shadow/gradient.
// NOT exported: this module launches a browser at top level, so importing it to read a string would run
// the generator. The words are asserted where they are authored — og-copy.mjs — and og-copy.test.ts reads
// this file as TEXT to prove the generator still interpolates them.
const cardHtml = (locale) => {
  const copy = CARD_COPY[locale];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family:'Space Grotesk'; font-weight:700; src:url('${grotesk}') format('woff2'); }
  @font-face { font-family:'JetBrains Mono'; font-weight:500; src:url('${mono}') format('woff2'); }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1200px; height:630px; }
  body { background:#0A0A0A; color:#F5F4EF; overflow:hidden; padding:56px 76px;
    border-top:6px solid #2A2A2A; border-bottom:6px solid #2A2A2A; }
  .wm { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:26px; letter-spacing:0.04em;
    display:flex; align-items:center; gap:12px; }
  .wm .badge { width:42px; height:42px; flex:none; display:block; }
  .wm .io { color:#FF5A00; }
  .hook { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:118px; line-height:0.92;
    letter-spacing:-0.04em; text-transform:uppercase; margin-top:30px; }
  .hook .ac { color:#FF5A00; }
  .sub { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:31px; letter-spacing:0.03em;
    margin-top:22px; }
  .meta { position:absolute; left:76px; bottom:44px; font-family:'JetBrains Mono',monospace; font-weight:500;
    font-size:20px; letter-spacing:0.1em; text-transform:uppercase; color:#B8B6AE; }
</style></head><body>
  <div class="wm"><span class="badge">${mark}</span>tadeumendonca<span class="io">.io</span></div>
  <div class="hook">${copy.lines.join('<br>')}<br>${copy.tail} <span class="ac">${copy.accent}</span></div>
  <div class="sub">${copy.sub}</div>
  <div class="meta">${META_LINE}</div>
</body></html>`;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
mkdirSync(join(root, 'public'), { recursive: true });

for (const locale of LOCALES) {
  await page.setContent(cardHtml(locale), { waitUntil: 'networkidle' });
  // eslint-disable-next-line no-undef -- this callback is serialized and runs in the browser page
  await page.evaluate(() => document.fonts.ready);

  // The same refusal ADR-0041 put on the article cards, here for the same reason: the hook's first
  // line WRAPS (the pt edition renders in three lines, not the two its `<br>` authors), so the layout
  // depends on how wide the words come out — and `overflow:hidden` turns "too long" into a valid PNG
  // with the words sliced off rather than into an error. Both axes: the ladder that catches a tall
  // card is blind to a single word running past the right edge.
  const overflow = await page.evaluate(() => ({
    // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
    down: document.body.scrollHeight > document.body.clientHeight,
    // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
    across: document.body.scrollWidth > document.body.clientWidth,
  }));
  if (overflow.down || overflow.across) {
    throw new Error(
      `og-default.${locale}: the copy overflows the card ${overflow.down ? 'vertically' : 'horizontally'} — ` +
        'shorten the hero tagline it derives from, or drop the hook size. Shipping it would crop the ' +
        'words, and a scraper pins whatever it fetched first.',
    );
  }

  const out = join(root, 'public', defaultCardFile(locale));
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log(`Wrote ${out} (1200x630, ${locale})`);
}

await browser.close();
