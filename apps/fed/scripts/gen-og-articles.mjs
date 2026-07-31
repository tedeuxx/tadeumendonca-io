// Generates a per-article OG card, per locale, at build time (#269). Run: `npm run gen-og-articles`.
// Output: public/og/<key>.<locale>.png, committed — the same shape as public/og-default.png.
//
// WHY THIS EXISTS. Every article shares one static card today, so two shared articles unfurl as the same
// link and a reader scrolling a timeline cannot tell them apart. The owner's decision (2026-07-30) is the
// smallest thing that fixes it: THE EXISTING ART, with the article's title over it. Not date, not tag,
// not the campaign signature — each was considered and each adds something competing for space in a
// rectangle that renders small in a feed.
//
// THE PROPERTY THAT SHAPES EVERYTHING HERE: this is the least reversible artifact on the site. A scraper
// pins the card it first fetches, so a wrong card outlives the merge that fixed it — on the post that
// already carried it, permanently. That is why the card is generated from the article's own frontmatter
// rather than authored, why the naming is keyed to the stable article KEY rather than the per-locale
// slug, and why a missing card fails the build rather than degrading to the default.
//
// Rendered in the Playwright Chromium already installed for the prerender, /cv.pdf and the E2E — the
// gen-og-default.mjs pattern, which is also where the layout comes from, so the two cards are the same
// design with one line swapped.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { articleKeysIn, LOCALES } from './og-cards.mjs';

const root = resolve(import.meta.dirname, '..');
const blogDir = join(root, 'src', 'content', 'blog');
const outDir = join(root, 'public', 'og');
const fontsDir = join(root, 'node_modules', '@fontsource');

const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(fontsDir, pkg, 'files', file)).toString('base64')}`;
const grotesk = font('space-grotesk', 'space-grotesk-latin-700-normal.woff2');
const mono = font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2');

// The brand mark, inline — same 512-space geometry as favicon.svg / gen-og-default.mjs.
const mark = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="#FF5A00"/><g fill="#0A0A0A"><rect x="112" y="140" width="288" height="72"/><rect x="220" y="140" width="72" height="232"/></g></svg>`;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

/** The article's title, read from its own frontmatter — never re-typed. */
function titleOf(key, locale) {
  const raw = readFileSync(join(blogDir, `${key}.${locale}.md`), 'utf8');
  const fm = FRONTMATTER.exec(raw)?.[1] ?? '';
  const line = /^title:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  if (!line) throw new Error(`${key}.${locale}.md has no \`title:\` in its frontmatter — cannot build a card`);
  return line.replace(/^["']|["']$/g, '');
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Title size, chosen from length rather than fixed.
 *
 * The default card's hook is two short lines the designer controlled. An article title is not: it is
 * authored for the page, in two languages, and pt-BR runs longer than en for the same sentence. At a
 * fixed 118px a long title overflows the canvas and the card ships with its words cut off — which the
 * generator cannot see, because a screenshot of an overflowing box is still a valid PNG.
 */
const titleSize = (title) => (title.length > 46 ? 62 : title.length > 28 ? 80 : 104);

const cardHtml = (title) => `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family:'Space Grotesk'; font-weight:700; src:url('${grotesk}') format('woff2'); }
  @font-face { font-family:'JetBrains Mono'; font-weight:500; src:url('${mono}') format('woff2'); }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1200px; height:630px; }
  /* Column layout with the title block pushed to the optical centre. The default card fills the canvas
     with a hook AND a subline; this one carries a title and nothing else, so top-aligning it left the
     lower two thirds empty and the card read as unfinished rather than spare. Balancing it is a layout
     change — no second line of copy was added, which is what the owner's "title and nothing more" rules
     out. */
  body { background:#0A0A0A; color:#F5F4EF; overflow:hidden; padding:56px 76px;
    border-top:6px solid #2A2A2A; border-bottom:6px solid #2A2A2A;
    display:flex; flex-direction:column; }
  .fill { flex:1 1 auto; }
  .wm { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:26px; letter-spacing:0.04em;
    display:flex; align-items:center; gap:12px; }
  .wm .badge { width:42px; height:42px; flex:none; display:block; }
  .wm .io { color:#FF5A00; }
  /* line-height 1.06, not the 0.96 the default card's hook uses, and the difference is pt-BR.
     Uppercase Portuguese keeps its diacritics — Ç, Ã, Í — and at a sub-1.0 line height the cedilla of
     a line ONE descends into the line below it. Caught by rendering a long accented title, not by the
     overflow guard: the text still FITS vertically, so scrollHeight never grows and the generator would
     have shipped a card whose second line is struck through by the first. The en edition of the same
     article renders clean at 0.96, which is exactly why a single-locale look would have missed it. */
  .title { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:${titleSize(title)}px;
    line-height:1.06; letter-spacing:-0.035em; text-transform:uppercase; margin-top:34px;
    max-width:1040px; }
  .rule { width:96px; height:6px; background:#FF5A00; margin-top:30px; }
  .meta { font-family:'JetBrains Mono',monospace; font-weight:500;
    font-size:20px; letter-spacing:0.1em; text-transform:uppercase; color:#B8B6AE; }
</style></head><body>
  <div class="wm"><span class="badge">${mark}</span>tadeumendonca<span class="io">.io</span></div>
  <div class="fill"></div>
  <div class="title">${escapeHtml(title)}</div>
  <div class="rule"></div>
  <div class="fill"></div>
  <div class="meta">Agentic dev · AI-DLC / Loop Engineering · Open source</div>
</body></html>`;

const keys = articleKeysIn(blogDir);
if (keys.length === 0) {
  console.log('::notice::no articles found — no cards to generate');
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

// Regenerated from scratch, not merged into what is there. An incremental write leaves the card of a
// retired article behind, and a stale card is the one failure mode this feature cannot take back.
for (const f of readdirSync(outDir)) if (f.endsWith('.png')) rmSync(join(outDir, f));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

let written = 0;
for (const key of keys) {
  for (const locale of LOCALES) {
    const title = titleOf(key, locale);
    await page.setContent(cardHtml(title), { waitUntil: 'networkidle' });
    // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
    await page.evaluate(() => document.fonts.ready);

    // The layout has no scroll, so an overflowing title is silently cropped by `overflow:hidden` —
    // a valid PNG with the words cut off. Measured rather than trusted: the generator refuses instead
    // of publishing a card whose text does not fit, because the reader who sees it cannot be un-shown it.
    // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
    const overflows = await page.evaluate(() => document.body.scrollHeight > document.body.clientHeight);
    if (overflows) {
      throw new Error(
        `${key}.${locale}: the title overflows the card at ${titleSize(title)}px — "${title}". ` +
          'Shorten it or widen the size ladder in titleSize(); shipping it would crop the words.',
      );
    }

    await page.screenshot({
      path: join(outDir, `${key}.${locale}.png`),
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });
    written += 1;
  }
}

await browser.close();
writeFileSync(join(outDir, '.gitkeep'), '');
console.log(`Wrote ${written} card(s) to ${relative(root, outDir)}/ (1200x630 each).`);
