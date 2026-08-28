// The pure half of the profile-banner pipeline (#558): which banners exist, where they live, what they
// say, and — the part that is the whole point on this surface — WHERE ON THE CANVAS a word is allowed
// to be. The rendering half (gen-banners.mjs) needs a browser.
//
// Split for the same reason og-cards.mjs is split from gen-og-articles.mjs, and video-thumbs.mjs from
// gen-video-thumbs.mjs: everything that DECIDES is decision logic and belongs where a test can reach it
// without launching Chromium.
//
// ── WHY A BANNER IS NOT THE OG CARD AT ANOTHER SIZE ──
// gen-og-default.mjs states its own composition rule: "tuned for the size an unfurl is actually seen
// (~320px wide, a 1:4 downscale): one dominant line, everything else subordinate." A profile banner is
// the opposite case on both axes — it is seen LARGE, and at 4:1 (LinkedIn) or 3:1 (X) rather than
// ~1.9:1. Scaling one artwork to both would turn a composition built around one dominant line into a
// thin band with the rest as noise. So the two surfaces declare DIFFERENT layouts (`layout` below), and
// banners.test.mjs asserts they still differ — "one artwork exported twice" reddens rather than ships.
//
// ── WHY THE COPY IS ONE SUBORDINATE LINE AND NOT THE CARD'S WORDS ──
// The banner sits roughly 40px above a headline that already names the role and the practice. Repeating
// either puts the same words twice on one screen: one sentence stuttering, not one identity system. And
// the hero tagline — the literal reading of "mirror the root URL's preview" — inverts its implied
// subject here. On an unfurl card the subject is the SITE; above a photograph and a name it becomes the
// person, and an instruction to the reader reads as an offer to teach them. So the banner carries the
// mark, the wordmark, and one line that INVITES rather than asserts (the owner's own reframing: it is a
// call to action, not a claim).
//
// The practice is named `Agent Harness Engineering` wherever this platform names it, and this file is
// registered in `src/data/vocabulary.test.ts`'s surface list so that stays true here too. It is named in
// this comment and DELIBERATELY NOWHERE IN THE COPY: the LinkedIn headline beside the banner already
// carries it, and the divergence between what LinkedIn says and what the site says is a recorded
// decision rather than drift — this slice does not reconcile it and must not.
import { readdirSync } from 'node:fs';

/** The two palette values the brand mark is built from, plus the canvas the site sets them on. */
export const PALETTE = {
  /** The site canvas — near-black. */
  canvas: '#0A0A0A',
  /** The one accent. Safety orange, and the mark's field. */
  accent: '#FF5A00',
  /** The mark's glyph, and the site's ink. */
  ink: '#0A0A0A',
  /** Type on the canvas. */
  type: '#F5F4EF',
  /** Subordinate type — the CTA line. */
  muted: '#B8B6AE',
  /** The hairline rules that top and tail the OG card, reused here. */
  rule: '#2A2A2A',
};

/**
 * The T-block, in the 512-space every surface draws it in.
 *
 * NOT re-typed as an SVG string: the rects are DATA, and banners.test.mjs compares them to the ones in
 * `public/favicon.svg` — the canonical mark. So a geometry drift on any one surface reddens here rather
 * than producing three subtly different marks nobody puts side by side.
 */
export const MARK_SPACE = 512;
export const MARK_RECTS = [
  { x: 112, y: 140, width: 288, height: 72 }, // crossbar
  { x: 220, y: 140, width: 72, height: 232 }, // stem
];

/** The mark as inline SVG, built from the rects above rather than from a second copy of them. */
export const markSvg = () =>
  `<svg viewBox="0 0 ${MARK_SPACE} ${MARK_SPACE}" xmlns="http://www.w3.org/2000/svg">` +
  `<rect width="${MARK_SPACE}" height="${MARK_SPACE}" fill="${PALETTE.accent}"/>` +
  `<g fill="${PALETTE.ink}">` +
  MARK_RECTS.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}"/>`).join('') +
  `</g></svg>`;

/**
 * The words. Three fields, and every one of them is a decision recorded on the Issue.
 *
 * `line` is a CALL TO ACTION rather than a claim — the owner's own framing, chosen over a checkable
 * assertion he was offered first. It promises only what the site delivers, repeats nothing from the
 * headline it sits above, and names no practice, role or product.
 */
export const BANNER_COPY = {
  wordmark: 'tadeumendonca',
  /** Set in the accent, exactly as gen-og-default.mjs renders it. */
  tld: '.io',
  line: 'read the build in the open',
};

/**
 * ── THE OCCLUSION MODEL, AND WHAT IT IS AND IS NOT ──
 *
 * A profile banner is the one asset on this site that is NEVER seen whole. Two things eat it:
 *
 *   · the AVATAR, which the platform overlays on the lower-left of the cover, and
 *   · the CROP, which narrows the visible band on a phone.
 *
 * `safe` is the rectangle a word may occupy — clear of the avatar, inside the crop, with a margin. The
 * generator MEASURES the rendered boxes and refuses to write a file whose content escapes it, so
 * "legible under the overlay" is a gate rather than an assurance in a comment.
 *
 * WHAT THESE NUMBERS ARE: a deliberately conservative model, stated in fractions of the canvas so a
 * reader can check the composition against a real profile without re-deriving anything. WHAT THEY ARE
 * NOT: measurements of either platform's DOM. Neither profile was inspected from here, both platforms
 * change their chrome without notice, and a number presented as measured when it was chosen is the
 * failure this repository names most often. They are chosen to be WIDER than the occlusion each
 * platform is observed to apply, which is the direction that fails safe: an over-tight safe area costs
 * composition, an over-loose one ships a cropped word.
 *
 * `avatar` and `crop` are declared beside `safe` rather than folded into it because they are the
 * REASONS. banners.test.mjs asserts the derivation holds — `safe` inside `crop`, `safe` disjoint from
 * `avatar` — so loosening `safe` without loosening its justification reddens.
 */
export const SURFACES = {
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn cover',
    width: 1584,
    height: 396,
    /**
     * A horizontal lockup anchored to the RIGHT of the safe area: mark and wordmark on one line, the
     * CTA right-aligned beneath. 4:1 is a band, and the left of it belongs to the avatar.
     */
    layout: 'lockup-right',
    avatar: { x0: 0, y0: 0.4, x1: 0.2, y1: 1 },
    crop: { x0: 0.2, y0: 0, x1: 0.8, y1: 1 },
    safe: { x0: 0.22, y0: 0.08, x1: 0.78, y1: 0.92 },
  },
  x: {
    id: 'x',
    label: 'X header',
    width: 1500,
    height: 500,
    /**
     * A centred stack: mark on its own row, wordmark under it, CTA under that. 3:1 leaves real vertical
     * room above the profile card, and X crops harder from the sides than LinkedIn does — so the block
     * moves to the middle of the band instead of hugging an edge.
     */
    layout: 'stack-centre',
    avatar: { x0: 0, y0: 0.42, x1: 0.2, y1: 1 },
    crop: { x0: 0.1, y0: 0, x1: 0.9, y1: 1 },
    safe: { x0: 0.22, y0: 0.08, x1: 0.88, y1: 0.6 },
  },
};

/** The surfaces, in the order the generator emits them. */
export const SURFACE_IDS = Object.keys(SURFACES);

/**
 * The public path of a surface's banner.
 *
 * Keyed by the SURFACE and nothing else. Unlike the OG cards there is no locale in the name: a profile
 * has one banner, and the copy beside it on both platforms is English.
 */
export const bannerFile = (id) => `banner-${id}.png`;
export const bannerPath = (id) => `/${bannerFile(id)}`;

/** Every banner the surface set requires, as `{ id, path, width, height }`. */
export const requiredBanners = () =>
  SURFACE_IDS.map((id) => ({ id, path: bannerPath(id), width: SURFACES[id].width, height: SURFACES[id].height }));

/** The banners actually present in `public/`, as public paths. */
export function generatedBannersIn(publicDir) {
  let files = [];
  try {
    files = readdirSync(publicDir);
  } catch {
    return []; // the directory not existing is the same finding as it being empty
  }
  return files
    .filter((f) => /^banner-.+\.png$/.test(f))
    .map((f) => `/${f}`)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Compare required against generated, BOTH ways.
 *
 * `missing` is the half a reader would eventually notice — there is nothing to upload. `orphaned` is the
 * half nobody would: a banner left behind by a surface this platform no longer publishes to breaks
 * nothing, so `public/` would accumulate it quietly, and someone would one day upload it.
 */
export function diffBanners(required, generated) {
  const have = new Set(generated);
  const want = new Set(required.map((b) => b.path));
  return {
    missing: required.filter((b) => !have.has(b.path)),
    orphaned: generated.filter((p) => !want.has(p)),
  };
}

// ── Rectangle arithmetic. Fractions in, pixels out; `x1`/`y1` are edges, not widths. ──

/** A fractional rect scaled to a surface's canvas. */
export const toPx = (rect, surface) => ({
  x0: rect.x0 * surface.width,
  y0: rect.y0 * surface.height,
  x1: rect.x1 * surface.width,
  y1: rect.y1 * surface.height,
});

/** Does `outer` fully contain `inner`? Touching edges count as contained. */
export const contains = (outer, inner) =>
  inner.x0 >= outer.x0 && inner.y0 >= outer.y0 && inner.x1 <= outer.x1 && inner.y1 <= outer.y1;

/**
 * Do the two rects share any area?
 *
 * Touching edges do NOT overlap — a safe area that starts exactly where the avatar ends is clear of it.
 * Written as the negation of the four separating cases rather than as an intersection test, because the
 * degenerate case (a zero-area rect) then answers `false` instead of `true`, which is the reading that
 * fails safe here.
 */
export const overlaps = (a, b) => !(a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0);

/** The safe area of a surface, in pixels. */
export const safeAreaPx = (surface) => toPx(surface.safe, surface);

/** Is a measured, pixel-space box entirely inside the surface's safe area? */
export const withinSafeArea = (box, surface) => contains(safeAreaPx(surface), box);

/**
 * A PNG's real pixel dimensions, read from its IHDR chunk.
 *
 * Same reasoning as `jpegSize` in photo-assets.test.mjs: this is a static site with a deliberate
 * dependency floor (ADR-0001), and a header read is a smaller thing to own than a decoder. IHDR is
 * mandated by the spec to be the FIRST chunk, so this is a fixed-offset read and not a scan — a scan for
 * a byte pattern finds a plausible, wrong answer, which is the worst failure available to a check whose
 * only job is detecting a wrong number.
 */
export function pngSize(bytes) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature)) throw new Error('not a PNG — bad signature');
  if (bytes.subarray(12, 16).toString('latin1') !== 'IHDR') throw new Error('not a PNG — IHDR is not the first chunk');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
