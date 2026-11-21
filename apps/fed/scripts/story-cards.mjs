// The pure half of the vertical Story card (#662): which cards must exist, where they live, what their
// QR encodes, and where everything sits on the 1080×1920 canvas. Its consumers are the reader's
// share-to-Story (#789), the only way Instagram is reached, and, through `storyFrameHtml`, the
// short-video generator (#820).
//
// Split from `gen-story-cards.mjs` on the same terms as `og-cards.mjs` is split from `gen-og-articles.mjs`
// (ADR-0041): the generator drives a browser and has no unit-testable surface, while every DECISION
// about the card — the set, the path, the payload, the QR geometry, the title fit — is here, where a
// test reaches it without one.
//
// THE PROPERTY THAT SHAPES THIS FILE, stronger than the OG card's: a QR is PRINTED. The OG card is pinned
// by a scraper; the Story card is photographed, screenshotted and re-shared, and its QR keeps resolving
// long after the 24-hour Story expired. So the payload is derived (never typed), the geometry is computed
// and then asserted against the committed PNG, and a QR that cannot honour its physical floor throws
// instead of shrinking.
import { load } from 'js-yaml';
import { readdirSync } from 'node:fs';
import qrcode from 'qrcode-generator';

import { LOCALES } from './og-cards.mjs';
import { SITE_URL, neutralArticleRouteFor } from './routes.mjs';
import { withShareUtm, STORY_SOURCE, STORY_CAMPAIGN } from '../src/lib/utm.ts';

export { LOCALES };

/** The canvas: Instagram's Story frame, 9:16. */
export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

/**
 * How far from the top and from the bottom Instagram draws its own interface over a Story (the
 * progress bar and account row above, the reply field and send row below). The title and the QR stay
 * strictly inside the band between the two insets. A PREMISE, not a measured figure — the issue's
 * criterion 9 asks for it to be checked on a device, and that check is the owner's scan protocol.
 */
export const OVERLAY_INSET = 270;

/** The two colours the QR may contain — ADR-0008's near-black and off-white, dark on light, never inverted. */
export const QR_DARK = '#0A0A0A';
export const QR_LIGHT = '#F5F4EF';

/**
 * Error correction Q: 25% recoverable — above the issue's floor of M, and chosen on a measurement. Nothing
 * is overlaid on the modules, so none of the redundancy is spent on branding; all of it is left to the
 * camera, the screen's moiré and Instagram's recompression.
 */
export const QR_ECL = 'Q';
/** The quiet zone, in modules, on every side — the QR specification's minimum, painted in the light field. */
export const QR_QUIET_MODULES = 4;
/**
 * The module size, in whole pixels at 1080 px width — FIXED at the issue's 12 px floor, not the largest
 * size that fits, and the reason is measured rather than preferred. Rendering every current payload at
 * 12–16 px and decoding each downscaled to 50% and 33% (the issue's distance proxy) with the gate's own
 * decoder, 12 px decoded every payload at every scale under both M and Q; 13, 14 and 16 px each failed at
 * least one payload at 33% or 50%. 12 divides by both 2 and 3, so a downscaled module stays whole pixels
 * instead of blending its edge into a grey the binariser misreads. The ADR-0041 amendment records it.
 */
export const QR_MODULE_PX = 12;
/** The widest the QR panel (modules plus quiet zone) may be, so the title above it keeps a usable box. */
export const QR_MAX_PX = 800;
/** Gap between the QR panel's bottom edge and the lower overlay inset. */
export const QR_BOTTOM_GAP = 30;

/** The public directory the cards are written to, and their public path. */
export const STORY_DIR = 'story';

/**
 * The public path of an article's Story card — THE helper the reader's share-to-Story (#789) fetches, so it is the only
 * place the shape exists.
 *
 * Keyed by the article KEY and the locale, never the slug, for ADR-0041's orphaning reason: a slug is
 * per-locale and editable, a key is not, and a card named after a slug is a dead file the day the slug
 * is corrected. A separate directory from `/og/`, so neither card class's set-equality gate can mistake
 * the other's files for orphans.
 */
export const storyCardPath = (key, locale) => `/${STORY_DIR}/${key}.${locale}.png`;

/** Every Story card the current content requires, as `{ key, locale, path }`. */
export function requiredStoryCards(articleKeys) {
  return articleKeys.flatMap((key) => LOCALES.map((locale) => ({ key, locale, path: storyCardPath(key, locale) })));
}

/** The Story card files actually present in `public/story/`, as public paths. */
export function generatedStoryCardsIn(storyDir) {
  let files = [];
  try {
    files = readdirSync(storyDir);
  } catch {
    return []; // a missing directory is the same finding as an empty one
  }
  return files
    .filter((f) => f.endsWith('.png'))
    .map((f) => `/${STORY_DIR}/${f}`)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * The URL the QR encodes, for one article — the payload, DERIVED and never typed (criterion 4).
 *
 * The NEUTRAL address (ADR-0052), from `routes.mjs`, the route source of truth: both locale cards of one
 * article therefore encode the same URL, and the visitor's own edition is chosen on arrival. Tagged
 * through `utm.ts`'s own function and literals (ADR-0039), so the QR carries exactly the three parameters
 * every other tagged link carries. Locale-free on purpose: the card's locale changes its title, never
 * where it points.
 */
export const storyPayload = (key) =>
  withShareUtm(`${SITE_URL}${neutralArticleRouteFor(key)}`, STORY_SOURCE, STORY_CAMPAIGN);

/**
 * The QR's module matrix for a payload: `matrix[row][col] === true` is a dark module.
 *
 * A pure function of (payload, error-correction level, mask). The library picks the smallest version that
 * holds the payload and the lowest-penalty mask, both deterministically, so two calls on one payload
 * return equal matrices — the determinism the issue's criterion 4 asserts. The PNG bytes are NOT claimed
 * stable across machines: they depend on the font environment (ADR-0041).
 */
export function qrMatrix(payload) {
  const qr = qrcode(0, QR_ECL);
  qr.addData(payload, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}

/**
 * Where the QR panel sits on the canvas, in WHOLE pixels, for a matrix of `moduleCount` modules.
 *
 * Integer everywhere, on purpose: a module edge that lands on a half pixel is anti-aliased into a grey
 * the decoder has to guess at, which is exactly the margin a second phone reading a first phone's
 * screen does not have. The panel is centred horizontally (rounded down) and sits `QR_BOTTOM_GAP` above
 * the lower overlay inset.
 *
 * Throws when the payload is too long for the panel at `QR_MODULE_PX`, rather than drawing it smaller: a
 * long slug or a longer campaign silently shrinking the modules is the failure the floor exists for.
 */
export function qrGeometry(moduleCount) {
  const span = moduleCount + 2 * QR_QUIET_MODULES;
  const size = span * QR_MODULE_PX;
  if (size > QR_MAX_PX) {
    throw new Error(
      `story card: a ${moduleCount}-module QR needs ${size}px at ${QR_MODULE_PX}px per module, wider than ` +
        `the ${QR_MAX_PX}px panel — the payload is too long to print safely.`,
    );
  }
  return {
    moduleSize: QR_MODULE_PX,
    size,
    left: Math.floor((STORY_WIDTH - size) / 2),
    top: STORY_HEIGHT - OVERLAY_INSET - QR_BOTTOM_GAP - size,
  };
}

/**
 * The QR as SVG markup: the light field (quiet zone included) and one `rect` per horizontal run of dark
 * modules, every coordinate a whole pixel, `crispEdges` so the rasteriser does not soften a boundary.
 */
export function qrSvg(matrix, moduleSize) {
  const n = matrix.length;
  const size = (n + 2 * QR_QUIET_MODULES) * moduleSize;
  const rects = [];
  for (let r = 0; r < n; r += 1) {
    let c = 0;
    while (c < n) {
      if (!matrix[r][c]) {
        c += 1;
        continue;
      }
      const start = c;
      while (c < n && matrix[r][c]) c += 1;
      const x = (start + QR_QUIET_MODULES) * moduleSize;
      const y = (r + QR_QUIET_MODULES) * moduleSize;
      rects.push(`<rect x="${x}" y="${y}" width="${(c - start) * moduleSize}" height="${moduleSize}"/>`);
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ` +
    `shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${QR_LIGHT}"/>` +
    `<g fill="${QR_DARK}">${rects.join('')}</g></svg>`
  );
}

/** The type ladder for the title, largest first, and the line limit it must fit within (criterion 5). */
export const TITLE_SIZES = [112, 100, 88, 76, 64, 56];
export const TITLE_MAX_LINES = 6;

/**
 * The largest title size that fits, or `null` when even the smallest does not.
 *
 * `measure(size)` is the browser's answer for one size — `{ lines, overflowX, overflowY }` — injected so
 * the decision is testable without a page. A size fits when nothing overflows the title box in either
 * direction and the title takes no more than `TITLE_MAX_LINES` lines. Horizontal overflow matters as
 * much as vertical: a single long pt-BR word cut by the box edge still leaves the height in bounds,
 * which is the defect ADR-0041 records shipping once on the landscape cards.
 */
export function fitTitle(measure, sizes = TITLE_SIZES, maxLines = TITLE_MAX_LINES) {
  for (const size of sizes) {
    const m = measure(size);
    if (!m.overflowX && !m.overflowY && m.lines <= maxLines) return size;
  }
  return null;
}

/**
 * The article's title in one locale, read from its own frontmatter — never re-typed (`«Título no
 * idioma»`: the card carries the shared link's title, and no copy is written for the format). Parsed
 * with the same YAML parser `routes.mjs` uses, over the anchored frontmatter only.
 */
export function titleFrom(raw, label) {
  const fm = /^---\r?\n([^]*?)\r?\n---/.exec(raw);
  const title = fm ? load(fm[1])?.title : undefined;
  if (typeof title !== 'string' || title.trim() === '') {
    throw new Error(`${label} has no \`title:\` in its frontmatter — cannot build a Story card`);
  }
  return title.trim();
}

// ---------------------------------------------------------------------------------------------------
// THE VISUAL BASE — one template, two consumers (#662 re-scoped, 2026-11-20 intake).
//
// The Story card generator (this item) and the short-video generator (#820) both draw a 1080×1920
// frame in this layout. The template lives HERE, not in either generator, so neither copies CSS or
// constants: `gen-story-cards.mjs` draws every committed card through `storyFrameHtml`, and #820
// imports the same function. The QR is a PARAMETER, never hard-wired to the Instagram tag: a caller
// that publishes the frame somewhere other than a reader's Story passes its own payload, or none, so
// its scans are not counted as Instagram's.
// ---------------------------------------------------------------------------------------------------

/**
 * The band of the canvas a consumer may draw readable content in, as `{ top, bottom }` in pixels:
 * everything between the top and bottom overlay insets. Shared by the Story card and #820's frames,
 * which carry the platforms' own overlays. Still a PREMISE until the scan protocol checks it on a device.
 */
export const SAFE_ZONE = Object.freeze({ top: OVERLAY_INSET, bottom: STORY_HEIGHT - OVERLAY_INSET });

/** The fixed boxes of the layout, in whole pixels. */
export const LAYOUT = Object.freeze({
  side: 76,
  wordmarkTop: SAFE_ZONE.top + 30,
  wordmarkHeight: 48,
  ruleHeight: 6,
  ruleWidth: 96,
  /** Rule bottom to QR panel top. */
  ruleGap: 40,
  /** Title box bottom to rule top. */
  titleGap: 40,
});
const TITLE_TOP = LAYOUT.wordmarkTop + LAYOUT.wordmarkHeight + 48;

/** The accent, ADR-0008's single one. */
export const ACCENT = '#FF5A00';

/** The brand mark, inline — the same 512-space geometry as favicon.svg and the OG generators. */
export const BRAND_MARK_SVG = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="${ACCENT}"/><g fill="${QR_DARK}"><rect x="112" y="140" width="288" height="72"/><rect x="220" y="140" width="72" height="232"/></g></svg>`;

/**
 * Where every element of a frame sits, as `{ left, top, width, height }` boxes: `title`, `rule`, and
 * `qr` (`null` when the frame carries none). With a QR the rule sits `ruleGap` above its panel; without
 * one it sits where the panel's bottom would, `QR_BOTTOM_GAP` above the lower safe edge, so the title
 * box grows into the space instead of leaving a hole.
 */
export function storyLayout(geometry) {
  const ruleBottom = geometry ? geometry.top - LAYOUT.ruleGap : SAFE_ZONE.bottom - QR_BOTTOM_GAP;
  const ruleTop = ruleBottom - LAYOUT.ruleHeight;
  const width = STORY_WIDTH - 2 * LAYOUT.side;
  return {
    title: { left: LAYOUT.side, top: TITLE_TOP, width, height: ruleTop - LAYOUT.titleGap - TITLE_TOP },
    rule: { left: LAYOUT.side, top: ruleTop, width: LAYOUT.ruleWidth, height: LAYOUT.ruleHeight },
    qr: geometry ? { left: geometry.left, top: geometry.top, width: geometry.size, height: geometry.size } : null,
  };
}

const escapeHtml = (s) => s.replaceAll(/[&<>"']/g, (c) => `&#${c.codePointAt(0)};`);

/**
 * The frame, as a self-contained HTML document a headless browser screenshots at 1080×1920.
 *
 * - `title` — the text to set, in `locale`; the caller reads it (the Story card from the article's
 *   frontmatter). The element carrying it is `#t`, which the caller measures to pick a size.
 * - `qrPayload` — the URL the QR encodes, or `null`/omitted for a frame with no QR layer at all.
 * - `background` — an optional image URL drawn under everything, covering the canvas; the QR keeps its
 *   own light panel, so a background never touches its contrast.
 * - `fonts` — `{ display, mono }` font URLs (the generator passes the self-hosted faces as data URLs).
 */
export function storyFrameHtml({ title, locale, qrPayload = null, background = null, fonts }) {
  if (!LOCALES.includes(locale)) throw new Error(`story frame: unknown locale "${locale}"`);
  let geometry = null;
  let svg = '';
  if (qrPayload) {
    const matrix = qrMatrix(qrPayload);
    geometry = qrGeometry(matrix.length);
    svg = qrSvg(matrix, geometry.moduleSize);
  }
  const box = storyLayout(geometry);
  const bg = background ? ` background-image:url('${background}'); background-size:cover; background-position:center;` : '';
  const qrCss = geometry
    ? `\n  .qr { position:absolute; left:${geometry.left}px; top:${geometry.top}px; width:${geometry.size}px;
    height:${geometry.size}px; }
  .qr svg { display:block; }`
    : '';
  const qrDiv = geometry ? `\n  <div class="qr">${svg}</div>` : '';
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>
  @font-face { font-family:'Space Grotesk'; font-weight:700; src:url('${fonts.display}') format('woff2'); }
  @font-face { font-family:'JetBrains Mono'; font-weight:500; src:url('${fonts.mono}') format('woff2'); }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${STORY_WIDTH}px; height:${STORY_HEIGHT}px; }
  body { background:${QR_DARK}; color:${QR_LIGHT}; overflow:hidden; position:relative;${bg} }
  .wm { position:absolute; left:${LAYOUT.side}px; top:${LAYOUT.wordmarkTop}px; height:${LAYOUT.wordmarkHeight}px;
    font-family:'JetBrains Mono',monospace; font-weight:500; font-size:30px; letter-spacing:0.04em;
    display:flex; align-items:center; gap:14px; }
  .wm .badge { width:${LAYOUT.wordmarkHeight}px; height:${LAYOUT.wordmarkHeight}px; flex:none; display:block; }
  .wm .io { color:${ACCENT}; }
  /* The title box is FIXED; the title sits at its bottom, on the rule, and the caller picks the
     largest size that fits it. line-height 1.06 for the same reason as the OG card: uppercase pt-BR
     keeps its diacritics, and below 1.0 a cedilla descends into the next line. */
  .tbox { position:absolute; left:${box.title.left}px; top:${box.title.top}px; width:${box.title.width}px;
    height:${box.title.height}px; overflow:hidden; display:flex; flex-direction:column; justify-content:flex-end; }
  .title { font-family:'Space Grotesk',sans-serif; font-weight:700; line-height:1.06;
    letter-spacing:-0.035em; text-transform:uppercase; overflow:hidden; }
  .rule { position:absolute; left:${box.rule.left}px; top:${box.rule.top}px; width:${box.rule.width}px; height:${box.rule.height}px; background:${ACCENT}; }${qrCss}
</style></head><body>
  <div class="wm"><span class="badge">${BRAND_MARK_SVG}</span>tadeumendonca<span class="io">.io</span></div>
  <div class="tbox"><div class="title" id="t">${escapeHtml(title)}</div></div>
  <div class="rule"></div>${qrDiv}
</body></html>`;
}
