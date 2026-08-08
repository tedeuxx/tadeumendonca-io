// Generates the video facade's poster art, one per embedded video, at build time.
// Run: `npm run gen-video-thumbs`. Output: public/video/<id>.png, committed — the same shape as
// public/og/<key>.<locale>.png.
//
// WHY IT IS DRAWN RATHER THAN DOWNLOADED: scripts/video-thumbs.mjs's header carries the whole argument
// (the ytimg request the facade used to make, and the licensing question that rules out committing
// YouTube's own thumbnail). Read it before changing anything here.
//
// Rendered in the Playwright Chromium already installed for the prerender, /cv.pdf, the OG cards and the
// E2E — the gen-og-articles.mjs pattern, and the layout is that card's, re-proportioned to 16:9 because
// the facade's box is `aspect-video`.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { videoIdsIn, readManifest, diffManifest, cardLines } from './video-thumbs.mjs';

const root = resolve(import.meta.dirname, '..');
const contentDir = join(root, 'src', 'content');
const manifestPath = join(contentDir, 'videos.json');
const outDir = join(root, 'public', 'video');
const fontsDir = join(root, 'node_modules', '@fontsource');

const WIDTH = 1280;
const HEIGHT = 720;

const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(fontsDir, pkg, 'files', file)).toString('base64')}`;
const grotesk = font('space-grotesk', 'space-grotesk-latin-700-normal.woff2');
const mono = font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2');

// The brand mark, inline — same 512-space geometry as favicon.svg / gen-og-articles.mjs.
const mark = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="#FF5A00"/><g fill="#0A0A0A"><rect x="112" y="140" width="288" height="72"/><rect x="220" y="140" width="72" height="232"/></g></svg>`;

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.codePointAt(0)};`);

/**
 * Caption size, chosen from length rather than fixed — gen-og-articles.mjs's ladder, one step smaller
 * throughout because this canvas is shorter than an OG card and the facade overlays a button across its
 * middle. A fixed size overflows on the long ones, and an overflowing box still screenshots as a valid
 * PNG with the words sliced off, which is why the generator measures instead of trusting the ladder.
 */
function captionSize(caption) {
  if (caption.length > 46) return 44;
  if (caption.length > 28) return 56;
  return 72;
}

const cardHtml = ({ channel, caption }) => `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family:'Space Grotesk'; font-weight:700; src:url('${grotesk}') format('woff2'); }
  @font-face { font-family:'JetBrains Mono'; font-weight:500; src:url('${mono}') format('woff2'); }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${WIDTH}px; height:${HEIGHT}px; }
  /* Deliberately low-contrast for a poster: the facade renders this at opacity-70 with the WATCH button
     centred over it, so a card competing for the middle would fight the affordance it exists behind.
     The content is pushed to the corners for that reason, not for style. */
  body { background:#0A0A0A; color:#F5F4EF; overflow:hidden; padding:52px 64px;
    border-top:6px solid #2A2A2A; border-bottom:6px solid #2A2A2A;
    display:flex; flex-direction:column; }
  .fill { flex:1 1 auto; }
  .wm { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:24px; letter-spacing:0.04em;
    display:flex; align-items:center; gap:12px; }
  .wm .badge { width:38px; height:38px; flex:none; display:block; }
  .wm .io { color:#FF5A00; }
  .channel { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:22px;
    letter-spacing:0.1em; text-transform:uppercase; color:#B8B6AE; }
  .rule { width:80px; height:6px; background:#FF5A00; margin:22px 0; }
  /* line-height 1.06 rather than a sub-1.0 value, for the reason gen-og-articles.mjs records: uppercase
     Portuguese keeps its diacritics and a cedilla on line one descends into line two without ever
     growing scrollHeight — an overflow guard cannot see it. */
  .caption { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:${captionSize(caption)}px;
    line-height:1.06; letter-spacing:-0.035em; text-transform:uppercase; max-width:${WIDTH - 128}px; }
</style></head><body>
  <div class="wm"><span class="badge">${mark}</span>tadeumendonca<span class="io">.io</span></div>
  <div class="fill"></div>
  <div class="channel">${escapeHtml(channel)}</div>
  <div class="rule"></div>
  <div class="caption">${escapeHtml(caption)}</div>
</body></html>`;

const ids = videoIdsIn(contentDir);
if (ids.length === 0) {
  console.log('::notice::no embedded videos found — no thumbnails to generate');
  process.exit(0);
}

// Fail here rather than in the browser. An id with no manifest entry has no words to render, and the
// silent version of this failure is a blank rectangle that screenshots, commits and passes set-equality.
const { unlabelled, unused } = diffManifest(ids, readManifest(manifestPath));
if (unlabelled.length > 0) {
  throw new Error(
    `src/content/videos.json has no entry for: ${unlabelled.join(', ')}. ` +
      'Add a `channel` (and a `caption` where the repository already states the video\'s own name) — ' +
      'do NOT fetch it, and do NOT invent it.',
  );
}
if (unused.length > 0) console.log(`::notice::videos.json has unused entries: ${unused.join(', ')}`);

const manifest = readManifest(manifestPath);
mkdirSync(outDir, { recursive: true });

// Regenerated from scratch, not merged into what is there — gen-og-articles.mjs's rule, for the same
// reason: an incremental write leaves the art of a video that is no longer embedded behind.
for (const f of readdirSync(outDir)) if (f.endsWith('.png')) rmSync(join(outDir, f));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });

let written = 0;
for (const id of ids) {
  const lines = cardLines(id, manifest);
  await page.setContent(cardHtml(lines), { waitUntil: 'networkidle' });
  // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
  await page.evaluate(() => document.fonts.ready);

  // Both axes. The ladder keys off CHARACTER COUNT, so a single long word overruns horizontally while
  // still fitting vertically — `overflow:hidden` slices it and the PNG is still valid.
  const overflow = await page.evaluate(() => ({
    // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
    down: document.body.scrollHeight > document.body.clientHeight,
    // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
    across: document.body.scrollWidth > document.body.clientWidth,
  }));
  if (overflow.down || overflow.across) {
    throw new Error(
      `${id}: the caption overflows the card ${overflow.down ? 'vertically' : 'horizontally'} at ` +
        `${captionSize(lines.caption)}px — "${lines.caption}". Shorten it, or widen the ladder in ` +
        'captionSize(); shipping it would crop the words.',
    );
  }

  await page.screenshot({
    path: join(outDir, `${id}.png`),
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  });
  written += 1;
}

await browser.close();
writeFileSync(join(outDir, '.gitkeep'), '');
console.log(`Wrote ${written} thumbnail(s) to ${relative(root, outDir)}/ (${WIDTH}x${HEIGHT} each).`);
