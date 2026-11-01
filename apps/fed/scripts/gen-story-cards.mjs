// Generates the vertical Instagram Story card, per article and per locale, at build time (#662).
// Run: `npm run gen-story-cards`. Output: public/story/<key>.<locale>.png, 1080×1920, committed.
//
// The second card class beside gen-og-articles.mjs (ADR-0041, amended in #662), in the same shape:
// rendered in the Playwright Chromium the build already installs, committed, never rendered at runtime
// or in CI. Every decision — the set, the path, the QR payload, its geometry, the title fit — lives in
// story-cards.mjs and is unit-tested there; this file only draws.
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
  OVERLAY_INSET,
  QR_DARK,
  QR_LIGHT,
  STORY_DIR,
  STORY_HEIGHT,
  STORY_WIDTH,
  TITLE_MAX_LINES,
  TITLE_SIZES,
  fitTitle,
  qrGeometry,
  qrMatrix,
  qrSvg,
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

// The brand mark, inline — the same 512-space geometry as favicon.svg and the OG generators.
const mark = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="#FF5A00"/><g fill="#0A0A0A"><rect x="112" y="140" width="288" height="72"/><rect x="220" y="140" width="72" height="232"/></g></svg>`;

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.codePointAt(0)};`);

// The fixed boxes, in whole pixels. Everything readable sits between the two overlay insets.
const SIDE = 76;
const WORDMARK_TOP = OVERLAY_INSET + 30;
const WORDMARK_HEIGHT = 48;
const TITLE_TOP = WORDMARK_TOP + WORDMARK_HEIGHT + 48;
const RULE_GAP = 40; // rule bottom → QR panel top
const RULE_HEIGHT = 6;
const TITLE_GAP = 40; // title box bottom → rule top

function cardHtml(title, geometry, svg) {
  const ruleTop = geometry.top - RULE_GAP - RULE_HEIGHT;
  const titleHeight = ruleTop - TITLE_GAP - TITLE_TOP;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
  @font-face { font-family:'Space Grotesk'; font-weight:700; src:url('${grotesk}') format('woff2'); }
  @font-face { font-family:'JetBrains Mono'; font-weight:500; src:url('${mono}') format('woff2'); }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${STORY_WIDTH}px; height:${STORY_HEIGHT}px; }
  body { background:${QR_DARK}; color:${QR_LIGHT}; overflow:hidden; position:relative; }
  .wm { position:absolute; left:${SIDE}px; top:${WORDMARK_TOP}px; height:${WORDMARK_HEIGHT}px;
    font-family:'JetBrains Mono',monospace; font-weight:500; font-size:30px; letter-spacing:0.04em;
    display:flex; align-items:center; gap:14px; }
  .wm .badge { width:${WORDMARK_HEIGHT}px; height:${WORDMARK_HEIGHT}px; flex:none; display:block; }
  .wm .io { color:#FF5A00; }
  /* The title box is FIXED; the title sits at its bottom, on the rule, and the generator picks the
     largest size that fits it. line-height 1.06 for the same reason as the OG card: uppercase pt-BR
     keeps its diacritics, and below 1.0 a cedilla descends into the next line. */
  .tbox { position:absolute; left:${SIDE}px; top:${TITLE_TOP}px; width:${STORY_WIDTH - 2 * SIDE}px;
    height:${titleHeight}px; overflow:hidden; display:flex; flex-direction:column; justify-content:flex-end; }
  .title { font-family:'Space Grotesk',sans-serif; font-weight:700; line-height:1.06;
    letter-spacing:-0.035em; text-transform:uppercase; overflow:hidden; }
  .rule { position:absolute; left:${SIDE}px; top:${ruleTop}px; width:96px; height:${RULE_HEIGHT}px; background:#FF5A00; }
  .qr { position:absolute; left:${geometry.left}px; top:${geometry.top}px; width:${geometry.size}px;
    height:${geometry.size}px; }
  .qr svg { display:block; }
</style></head><body>
  <div class="wm"><span class="badge">${mark}</span>tadeumendonca<span class="io">.io</span></div>
  <div class="tbox"><div class="title" id="t">${escapeHtml(title)}</div></div>
  <div class="rule"></div>
  <div class="qr">${svg}</div>
</body></html>`;
}

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
  const matrix = qrMatrix(storyPayload(key));
  const geometry = qrGeometry(matrix.length);
  const svg = qrSvg(matrix, geometry.moduleSize);
  for (const locale of LOCALES) {
    const label = `${key}.${locale}`;
    const title = titleFrom(readFileSync(join(blogDir, `${label}.md`), 'utf8'), `${label}.md`);
    await page.setContent(cardHtml(title, geometry, svg), { waitUntil: 'networkidle' });
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
    console.log(`${label}: ${size}px title, ${measured.get(size).lines} line(s); QR ${matrix.length} modules × ${geometry.moduleSize}px`);
    written += 1;
  }
}

await browser.close();
writeFileSync(join(outDir, '.gitkeep'), '');
console.log(`Wrote ${written} Story card(s) to ${relative(root, outDir)}/ (${STORY_WIDTH}x${STORY_HEIGHT} each).`);
