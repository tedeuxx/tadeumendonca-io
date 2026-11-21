// Generates the vertical Story card, per article and per locale, at build time (#662).
// Run: `npm run gen-story-cards`. Output: public/story/<key>.<locale>.png, 1080×1920, committed.
//
// The second card class beside gen-og-articles.mjs (ADR-0005, *Per-article OG cards*, amended in #662), in the same shape:
// rendered in the Playwright Chromium the build already installs, committed, never rendered at runtime
// or in CI. Every decision — the set, the path, the QR payload, its geometry, the title fit, and the
// frame template itself — lives in story-cards.mjs and is unit-tested there; this file only drives the
// browser. The cards are consumed by the reader's share-to-Story (#789); the template is also the
// visual base of the short-video generator (#820).
//
// What the card carries, and nothing else (the owner's rulings on #662): the `tadeumendonca.io`
// wordmark in the display face with the accent, as on the OG cards (`«Domínio»`); the article title in
// the card's locale (`«Título no idioma»`, no new copy for the format); and a QR encoding the neutral
// article URL with the Story campaign tag. Nothing is overlaid on the QR.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

import { articleKeysIn } from './og-cards.mjs';
import {
  LOCALES,
  STORY_DIR,
  STORY_HEIGHT,
  STORY_WIDTH,
  TITLE_MAX_LINES,
  TITLE_SIZES,
  fitTitle,
  qrMatrix,
  storyFrameHtml,
  storyPayload,
  titleFrom,
} from './story-cards.mjs';

const root = resolve(import.meta.dirname, '..');
const blogDir = join(root, 'src', 'content', 'blog');
const outDir = join(root, 'public', STORY_DIR);
const fontsDir = join(root, 'node_modules', '@fontsource');

const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(fontsDir, pkg, 'files', file)).toString('base64')}`;
const grotesk = font('space-grotesk', 'space-grotesk-latin-700-normal.woff2');
const mono = font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2');

// The layout, the brand mark and the CSS are NOT here: they are `storyFrameHtml` in story-cards.mjs,
// the one template this generator and the short-video generator (#820) both draw through.
const fonts = { display: grotesk, mono };

const keys = articleKeysIn(blogDir);
if (keys.length === 0) {
  console.log('::notice::no articles found — no Story cards to generate');
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
// Regenerated from scratch: an incremental write would leave a retired article's card behind, and a
// printed QR for an article the site no longer lists is the stale artifact this feature cannot recall.
for (const f of readdirSync(outDir)) if (f.endsWith('.png')) rmSync(join(outDir, f));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: STORY_WIDTH, height: STORY_HEIGHT }, deviceScaleFactor: 1 });

// The browser's answer for one size: lines taken, and overflow on either axis of the fixed title box.
/* eslint-disable no-undef -- serialized and evaluated in the browser page, not in Node */
const measureIn = (size) =>
  page.evaluate((px) => {
    const t = document.getElementById('t');
    const box = t.parentElement;
    t.style.fontSize = `${px}px`;
    const lineHeight = Number.parseFloat(getComputedStyle(t).lineHeight);
    return {
      lines: Math.round(t.scrollHeight / lineHeight),
      overflowX: t.scrollWidth > t.clientWidth || box.scrollWidth > box.clientWidth,
      overflowY: t.scrollHeight > box.clientHeight,
    };
  }, size);
/* eslint-enable no-undef */

let written = 0;
for (const key of keys) {
  const qrPayload = storyPayload(key);
  const modules = qrMatrix(qrPayload).length;
  for (const locale of LOCALES) {
    const label = `${key}.${locale}`;
    const title = titleFrom(readFileSync(join(blogDir, `${label}.md`), 'utf8'), `${label}.md`);
    await page.setContent(storyFrameHtml({ title, locale, qrPayload, fonts }), { waitUntil: 'networkidle' });
    // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
    await page.evaluate(() => document.fonts.ready);

    // Measured, never trusted: `overflow:hidden` would crop a title that does not fit into a valid PNG
    // with its words cut off, and a screenshot cannot tell. fitTitle needs a synchronous measure, so
    // the ladder is measured first and then decided.
    const measured = new Map();
    for (const size of TITLE_SIZES) measured.set(size, await measureIn(size));
    const size = fitTitle((s) => measured.get(s));
    if (size === null) {
      const smallest = TITLE_SIZES.at(-1);
      throw new Error(
        `${label}: the title does not fit the Story card at ${smallest}px within ${TITLE_MAX_LINES} lines ` +
          `(${JSON.stringify(measured.get(smallest))}) — "${title}". Shorten it or rework the ladder; a ` +
          'printed card with its words cut cannot be taken back.',
      );
    }
    await measureIn(size);
    await page.screenshot({
      path: join(outDir, `${label}.png`),
      clip: { x: 0, y: 0, width: STORY_WIDTH, height: STORY_HEIGHT },
    });
    console.log(`${label}: ${size}px title, ${measured.get(size).lines} line(s); QR ${modules} modules`);
    written += 1;
  }
}

await browser.close();
writeFileSync(join(outDir, '.gitkeep'), '');
console.log(`Wrote ${written} Story card(s) to ${relative(root, outDir)}/ (${STORY_WIDTH}x${STORY_HEIGHT} each).`);
