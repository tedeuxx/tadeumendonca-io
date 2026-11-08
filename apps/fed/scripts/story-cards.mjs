// The pure half of the vertical Instagram Story card (#662): which cards must exist, where they live,
// what their QR encodes, and where everything sits on the 1080×1920 canvas.
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
 * The public path of an article's Story card — THE helper slice B (#789) fetches, so it is the only
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
