// Generates a per-article OG card, per locale, at build time (#269). Run: `npm run gen-og-articles`.
// Output: public/og/<key>.<locale>.png, committed — the same shape as public/og-default.png.
//
// WHY THIS EXISTS. Every article shares one static card today, so two shared articles unfurl as the same
// link and a reader scrolling a timeline cannot tell them apart. The owner's decision (2026-07-30) is the
// smallest thing that fixes it: THE EXISTING ART, with the article's title over it. Not date, not tag,
// not the campaign signature — each was considered and each adds something competing for space in a
// rectangle that renders small in a feed.
//
// "Not the campaign signature" is REVERSED for cover-derived cards only (#710, owner 2026-10-31:
// «Card estreito»; ADR-0041's 2026-11-01 amendment). An article whose frontmatter sets `cover` gets a
// card built from that cover, with its title, the published signature and an AI-generated mark. Every
// other article keeps the title-only card below, unchanged.
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
import { articleKeysIn, coverOf, coverFile, coverSidecarName, hashBytes, LOCALES } from './og-cards.mjs';
import { META_LINE, SIGNATURE, COVER_MARK } from './og-copy.mjs';

const root = resolve(import.meta.dirname, '..');
const blogDir = join(root, 'src', 'content', 'blog');
const publicDir = join(root, 'public');
const outDir = join(publicDir, 'og');
const fontsDir = join(root, 'node_modules', '@fontsource');

const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(fontsDir, pkg, 'files', file)).toString('base64')}`;
const grotesk = font('space-grotesk', 'space-grotesk-latin-700-normal.woff2');
const mono = font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2');

// The brand mark, inline — same 512-space geometry as favicon.svg / gen-og-default.mjs.
const mark = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="#FF5A00"/><g fill="#0A0A0A"><rect x="112" y="140" width="288" height="72"/><rect x="220" y="140" width="72" height="232"/></g></svg>`;

// Anchored and bounded rather than `[\s\S]*?` across the whole file: a lazy any-character scan over a
// long body is super-linear (S8786), and a card generator has no reason to read past the frontmatter.
const FRONTMATTER = /^---\r?\n([^]*?)\r?\n---\r?\n/;

const sourceOf = (key, locale) => readFileSync(join(blogDir, `${key}.${locale}.md`), 'utf8');

/** The article's title, read from its own frontmatter — never re-typed. */
function titleOf(key, locale) {
  const raw = sourceOf(key, locale);
  const fm = FRONTMATTER.exec(raw)?.[1] ?? '';
  const line = /^title:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  if (!line) throw new Error(`${key}.${locale}.md has no \`title:\` in its frontmatter — cannot build a card`);
  return line.replace(/^["']|["']$/g, '');
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.codePointAt(0)};`);

/**
 * Title size, chosen from length rather than fixed.
 *
 * The default card's hook is two short lines the designer controlled. An article title is not: it is
 * authored for the page, in two languages, and pt-BR runs longer than en for the same sentence. At a
 * fixed 118px a long title overflows the canvas and the card ships with its words cut off — which the
 * generator cannot see, because a screenshot of an overflowing box is still a valid PNG.
 */
function titleSize(title) {
  if (title.length > 46) return 62;
  if (title.length > 28) return 80;
  return 104;
}

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
  <div class="meta">${META_LINE}</div>
</body></html>`;

// ---------------------------------------------------------------------------------------------------
// The COVER-DERIVED variant (#710, ADR-0041's 2026-11-01 amendment) — taken only when the article's
// frontmatter sets `cover`. Same canvas, palette, mark, type and footer meta as the card above; the
// article's own cover takes the right-hand column, the title shares the left with the published
// signature, and the cover carries a visible AI-generated mark so the card cannot pass as a photograph
// of a real scene. No radius, no shadow, no gradient (ADR-0008): the mark sits on a solid block.
//
// META_LINE stays (owner, #688) and keeps its full-width row: at 20px mono it is ~980px wide, so it
// cannot share a column with the image without wrapping. That row is why the image column is not
// full-height.
// ---------------------------------------------------------------------------------------------------

/** A tighter ladder than the title-only card's: the title shares the canvas with the cover. */
function coverTitleSize(title) {
  if (title.length > 40) return 50;
  if (title.length > 28) return 58;
  return 70;
}

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

function coverDataUrl(file) {
  const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error(`cover ${file} has an extension the card cannot embed (${Object.keys(MIME).join(', ')})`);
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}

const coverCardHtml = (title, cover, aiMark) => `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family:'Space Grotesk'; font-weight:700; src:url('${grotesk}') format('woff2'); }
  @font-face { font-family:'JetBrains Mono'; font-weight:500; src:url('${mono}') format('woff2'); }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1200px; height:630px; }
  body { background:#0A0A0A; color:#F5F4EF; overflow:hidden;
    border-top:6px solid #2A2A2A; border-bottom:6px solid #2A2A2A;
    display:flex; flex-direction:column; }
  .main { flex:1 1 auto; display:flex; min-height:0; }
  .text { width:640px; flex:none; padding:44px 48px 28px 76px; display:flex; flex-direction:column;
    overflow:hidden; }
  .fill { flex:1 1 auto; }
  .wm { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:26px; letter-spacing:0.04em;
    display:flex; align-items:center; gap:12px; }
  .wm .badge { width:42px; height:42px; flex:none; display:block; }
  .wm .io { color:#FF5A00; }
  /* line-height 1.06 for the same pt-BR cedilla reason the title-only card records. */
  .title { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:${coverTitleSize(title)}px;
    line-height:1.06; letter-spacing:-0.035em; text-transform:uppercase; }
  .rule { width:96px; height:6px; background:#FF5A00; margin-top:26px; }
  /* The signature is set as published — no text-transform, so the domain stays lower case. */
  .sig { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:19px; letter-spacing:0.04em;
    margin-top:22px; color:#F5F4EF; }
  .art { flex:1 1 auto; position:relative; border-left:6px solid #2A2A2A; overflow:hidden; }
  .art img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
  .ai { position:absolute; left:0; bottom:0; background:#0A0A0A; color:#F5F4EF;
    font-family:'JetBrains Mono',monospace; font-weight:500; font-size:16px; letter-spacing:0.08em;
    text-transform:uppercase; padding:10px 14px; border-top:4px solid #FF5A00; }
  .foot { flex:none; height:64px; padding:0 76px; display:flex; align-items:center;
    border-top:6px solid #2A2A2A; }
  .meta { font-family:'JetBrains Mono',monospace; font-weight:500;
    font-size:20px; letter-spacing:0.1em; text-transform:uppercase; color:#B8B6AE; white-space:nowrap; }
</style></head><body>
  <div class="main">
    <div class="text">
      <div class="wm"><span class="badge">${mark}</span>tadeumendonca<span class="io">.io</span></div>
      <div class="fill"></div>
      <div class="title">${escapeHtml(title)}</div>
      <div class="rule"></div>
      <div class="sig" data-signature>${escapeHtml(SIGNATURE)}</div>
    </div>
    <div class="art"><img src="${cover}" alt=""><div class="ai" data-ai-mark>${escapeHtml(aiMark)}</div></div>
  </div>
  <div class="foot"><div class="meta">${META_LINE}</div></div>
</body></html>`;

const keys = articleKeysIn(blogDir);
if (keys.length === 0) {
  console.log('::notice::no articles found — no cards to generate');
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

// Regenerated from scratch, not merged into what is there. An incremental write leaves the card of a
// retired article behind, and a stale card is the one failure mode this feature cannot take back.
// The cover sidecars go with them (#710): a sidecar left by an article that lost its cover would vouch
// for a card that is no longer cover-derived.
for (const f of readdirSync(outDir)) if (f.endsWith('.png') || f.endsWith('.cover.json')) rmSync(join(outDir, f));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

let written = 0;
for (const key of keys) {
  for (const locale of LOCALES) {
    const title = titleOf(key, locale);
    // The selector (#710): the article's `cover`, read through og-cards.mjs's YAML parse — the same one
    // that decides `draft` — never through the line regex `titleOf` uses.
    const cover = coverOf(sourceOf(key, locale));
    const coverPath = cover ? coverFile(publicDir, cover) : undefined;
    const coverBytes = coverPath ? readFileSync(coverPath) : undefined;
    const size = cover ? coverTitleSize(title) : titleSize(title);
    await page.setContent(
      cover ? coverCardHtml(title, coverDataUrl(coverPath), COVER_MARK[locale]) : cardHtml(title),
      { waitUntil: 'networkidle' },
    );
    // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
    await page.evaluate(() => document.fonts.ready);

    // The layout has no scroll, so an overflowing title is silently cropped by `overflow:hidden` —
    // a valid PNG with the words cut off. Measured rather than trusted: the generator refuses instead
    // of publishing a card whose text does not fit, because the reader who sees it cannot be un-shown it.
    //
    // BOTH AXES, and the second one is not symmetry for its own sake. The first version measured height
    // only, and the size ladder keys off CHARACTER COUNT — so an ordinary pt-BR word like
    // "Contrarrevolucionarios" (22 chars, therefore 104px) runs 169px past the canvas, is sliced by
    // `overflow:hidden`, and never grows scrollHeight because the text still fits vertically. The
    // generator wrote the PNG, the set-equality test saw a file, and the E2E saw 200 + image/png.
    // Caught by the quality-assurance driving the real layout rather than reading it.
    //
    // The cover variant clips its TEXT COLUMN, not only the body (#710): a word too long for the 640px
    // column would run under the image without ever widening the body, so the column is measured too.
    const overflow = await page.evaluate(() => {
      // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
      const boxes = [document.body, document.querySelector('.text')].filter(Boolean);
      return {
        down: boxes.some((b) => b.scrollHeight > b.clientHeight),
        across: boxes.some((b) => b.scrollWidth > b.clientWidth),
      };
    });
    if (overflow.down || overflow.across) {
      throw new Error(
        `${key}.${locale}: the title overflows the card ${overflow.down ? 'vertically' : 'horizontally'} ` +
          `at ${size}px — "${title}". Shorten it, or widen the ladder in ${cover ? 'coverTitleSize' : 'titleSize'}(); ` +
          'shipping it would crop the words, and a scraper pins whatever it fetched first.',
      );
    }

    if (cover) {
      // The words a cover card must carry, read back out of the rendered page rather than trusted from
      // the template: the signature exactly as published, and this locale's AI-generated mark.
      // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
      const text = await page.evaluate(() => document.body.textContent ?? '');
      for (const must of [SIGNATURE, COVER_MARK[locale]]) {
        if (!text.includes(must)) throw new Error(`${key}.${locale}: the cover card does not carry "${must}"`);
      }
      // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
      const loaded = await page.evaluate(() => document.querySelector('.art img')?.naturalWidth ?? 0);
      if (!loaded) throw new Error(`${key}.${locale}: the cover ${cover} did not load into the card`);
    }

    await page.screenshot({
      path: join(outDir, `${key}.${locale}.png`),
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });
    if (cover) {
      // The provenance record: which cover, and its hash. scripts/og-cards.test.mjs recomputes it.
      writeFileSync(
        join(outDir, coverSidecarName(key, locale)),
        `${JSON.stringify({ cover, sha256: hashBytes(coverBytes) }, null, 2)}\n`,
      );
    }
    written += 1;
  }
}

await browser.close();
writeFileSync(join(outDir, '.gitkeep'), '');
console.log(`Wrote ${written} card(s) to ${relative(root, outDir)}/ (1200x630 each).`);
