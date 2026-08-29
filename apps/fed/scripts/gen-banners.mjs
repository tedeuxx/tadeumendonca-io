// Generates the profile banners — public/banner-linkedin.png (1584x396) and public/banner-x.png
// (1500x500) — from the same system the site-wide OG card is built on. Run: `npm run gen-banners`.
//
// The browser half. Every decision — which banners exist, what they say, and where on the canvas a word
// is allowed to be — lives in scripts/banners.mjs, which is unit-tested; this file is the harness that
// renders it. Same construction as gen-og-default.mjs: HTML set on a headless Chromium page and
// screenshotted, site fonts embedded as data: URIs so it renders identically everywhere, the brand mark
// inline, no image library and no network.
//
// ── THE FOUR REFUSALS, and each one is a different failure ──
//
// 1. OVERFLOW — inherited from gen-og-default.mjs, for the same reason: `overflow:hidden` turns "the
//    words did not fit" into a valid PNG with them sliced off rather than into an error.
//
// 2. THE SAFE AREA — this file's own, and the one that matters here. A banner is never seen whole: the
//    platform overlays an avatar on the lower-left and crops the sides on a phone. So the rendered boxes
//    are MEASURED and checked against `SURFACES[id].safe`. Composition-by-eye is not available on a
//    surface nobody can see whole, and "I checked it looks fine" is not a thing a reviewer can re-run.
//
// 3. THE CENTRING, on both axes — added by #572, and the one the other three cannot see. Refusal 2 asks
//    whether the artwork is inside the boundaries; a lockup can satisfy that and still be visibly
//    off-centre, because the safe area is a ONE-SIDED clearance constraint on each axis and its midpoint
//    is not the middle of the canvas. So a `stack-centre` composition is measured against the
//    composition centre.
//
//    AND IT HAS TO CARRY THAT ALONE, which is the reason it is a separate refusal rather than a tighter
//    refusal 2. Before this slice, centring the X stack vertically on the canvas threw refusal 2 —
//    `#block` escaped `safe.y1` — so the wrong reading LOOKED caught. It was caught incidentally, by the
//    block being tall enough to breach a bound that had no derivation behind it. Widening that bound to
//    its justified value (see `safe.y1` in banners.mjs) removes the incidental backstop entirely, and
//    this check is what is left.
//
// 4. THE DIMENSIONS — asserted on the bytes actually written, not on the viewport asked for. A banner at
//    the wrong size is the failure nobody notices until it has been uploaded and cropped.
//
// WHAT NONE OF THEM COVER, said plainly because a green run here reads like more than it is: this writes
// a FILE. The live cover changes only when the owner uploads it. See `.brand/surfaces.md` for that
// parity state — it is recorded there precisely because no test in this repository can reach it.
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  BANNER_COPY,
  PALETTE,
  SURFACES,
  SURFACE_IDS,
  bannerFile,
  centredBandPx,
  compositionCentrePx,
  markSvg,
  pngSize,
  safeAreaPx,
  withinSafeArea,
} from './banners.mjs';

const root = resolve(import.meta.dirname, '..');
const fontsDir = join(root, 'node_modules', '@fontsource');

const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(fontsDir, pkg, 'files', file)).toString('base64')}`;
const mono = font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2');

const mark = markSvg();

/**
 * The two compositions. Same elements, same palette, same mark — recomposed per ratio rather than
 * scaled, which is what `layout` on each surface declares and banners.test.mjs asserts still differs.
 *
 * Sizes are per surface rather than shared: the LinkedIn band is 396px tall and holds one row, the X
 * band is 500px tall and holds a stack, so a shared type scale would be wrong on at least one of them.
 */
const STYLE = {
  linkedin: { badge: 64, wordmark: 64, cta: 30, gap: 22, rowGap: 26 },
  x: { badge: 76, wordmark: 58, cta: 27, gap: 20, rowGap: 24 },
};

const bannerHtml = (id) => {
  const s = SURFACES[id];
  const t = STYLE[id];
  // A surface added to banners.mjs without a type scale here would otherwise fail as `undefined is not
  // an object` several lines into a template string — a loud crash, but one that names the wrong file.
  if (!t) throw new Error(`gen-banners: no type scale for surface \`${id}\` — add one to STYLE in this file`);
  const safe = safeAreaPx(s);
  const stack = s.layout === 'stack-centre';

  // The block is positioned FROM the safe area rather than from the canvas — the composition is a
  // consequence of the occlusion model, not a layout that happens to satisfy it.
  //
  // INSET, and it is not a fudge factor for the check below: a browser lays out in 1/64px units, so an
  // edge placed exactly ON the safe boundary measures a fraction of a pixel outside it about half the
  // time. Sitting flush against the limit of what is visible is also the wrong composition — the safe
  // area is where a word MAY go, not where it should end. 4px at these canvas sizes is invisible.
  //
  // A centred stack is centred on `compositionCentrePx` on BOTH axes, never on the middle of `safe`
  // (#572). `safe` is one-sided on each: its left edge is inset to clear the avatar and nothing insets
  // the right, and its bottom edge was inset for nothing at all. Its midpoint sat at 0.55 across and
  // 0.34 down while the canvas centre is 0.50/0.50, so centring in it shipped a lockup 75px right and
  // 80px high that satisfied every check this file makes. The `lockup-right` branch below still reads
  // its `top` from `safe`, and must: that surface's safe area is symmetric on both axes, so the two
  // agree there, and it is anchored to an edge horizontally by deliberate design.
  const INSET = 4;
  const centre = compositionCentrePx(s);
  // ── THE 6px THE NEW REFUSAL FOUND ON ITS FIRST RUN, and it is not a fudge factor ──
  //
  // `body` carries the hairline rules as a real `border-top`/`border-bottom`, and it is
  // `position:relative`. An absolutely-positioned child is placed against its containing block's
  // PADDING box, which starts below that border — while `getBoundingClientRect`, which the refusal
  // below measures with, is in VIEWPORT space, which includes it. So `top:250px` renders its centre at
  // 256px and the two coordinate spaces disagree by exactly the rule's thickness.
  //
  // Subtracted rather than absorbed into the centre, because the centre is a fact about the CANVAS and
  // this is a fact about one stylesheet. Named once and used in both places so the two cannot drift.
  const RULE_PX = 6;
  const place = stack
    ? `left:${centre.x}px; top:${centre.y - RULE_PX}px; transform:translate(-50%,-50%);
       align-items:center; text-align:center;`
    : `right:${s.width - safe.x1 + INSET}px; top:${(safe.y0 + safe.y1) / 2}px; transform:translateY(-50%);
       align-items:flex-end; text-align:right;`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family:'JetBrains Mono'; font-weight:500; src:url('${mono}') format('woff2'); }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${s.width}px; height:${s.height}px; }
  body { background:${PALETTE.canvas}; color:${PALETTE.type}; overflow:hidden; position:relative;
    border-top:${RULE_PX}px solid ${PALETTE.rule}; border-bottom:${RULE_PX}px solid ${PALETTE.rule}; }
  #block { position:absolute; display:flex; flex-direction:column; gap:${t.rowGap}px; ${place} }
  .wm { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:${t.wordmark}px;
    letter-spacing:0.02em; line-height:1; display:flex; ${stack ? 'flex-direction:column;' : ''}
    align-items:center; gap:${t.gap}px; }
  .wm .badge { width:${t.badge}px; height:${t.badge}px; flex:none; display:block; }
  .wm .io { color:${PALETTE.accent}; }
  .cta { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:${t.cta}px;
    letter-spacing:0.09em; line-height:1; color:${PALETTE.muted}; }
</style></head><body>
  <div id="block">
    <div class="wm"><span class="badge">${mark}</span><span class="text">${BANNER_COPY.wordmark}<span class="io">${BANNER_COPY.tld}</span></span></div>
    <div class="cta">${BANNER_COPY.line}</div>
  </div>
</body></html>`;
};

const browser = await chromium.launch();
mkdirSync(join(root, 'public'), { recursive: true });

for (const id of SURFACE_IDS) {
  const s = SURFACES[id];
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: 1 });
  await page.setContent(bannerHtml(id), { waitUntil: 'networkidle' });
  // eslint-disable-next-line no-undef -- this callback is serialized and runs in the browser page
  await page.evaluate(() => document.fonts.ready);

  const overflow = await page.evaluate(() => ({
    // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
    down: document.body.scrollHeight > document.body.clientHeight,
    // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
    across: document.body.scrollWidth > document.body.clientWidth,
  }));
  if (overflow.down || overflow.across) {
    throw new Error(
      `banner-${id}: the composition overflows the canvas ${overflow.down ? 'vertically' : 'horizontally'} — ` +
        'shorten the line or drop the type scale. Shipping it would slice the words off.',
    );
  }

  // The measured boxes, element by element rather than the block alone: a block that fits while one of
  // its children hangs out of it is exactly the case a bounding-box-of-the-parent check misses.
  const boxes = await page.evaluate(() =>
    ['#block', '.wm', '.cta'].map((sel) => {
      // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
      const r = document.querySelector(sel).getBoundingClientRect();
      return { sel, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom };
    }),
  );

  const safe = safeAreaPx(s);
  for (const box of boxes) {
    if (!withinSafeArea(box, s)) {
      throw new Error(
        `banner-${id}: \`${box.sel}\` escapes the safe area — it would be under the avatar or outside the ` +
          `mobile crop. box=[${box.x0.toFixed(0)},${box.y0.toFixed(0)},${box.x1.toFixed(0)},${box.y1.toFixed(0)}] ` +
          `safe=[${safe.x0.toFixed(0)},${safe.y0.toFixed(0)},${safe.x1.toFixed(0)},${safe.y1.toFixed(0)}]`,
      );
    }
  }

  // REFUSAL 4 — the centring, and it is a different property from refusal 2 rather than a stricter
  // version of it. Everything above asks whether the artwork is INSIDE the boundaries; this asks
  // whether it is where the composition says it is. A stack that drifts right still sits inside `safe`
  // (that is exactly what #572 shipped), so no containment check can ever see it. Measured on the boxes
  // the browser laid out, not on the CSS asked for.
  //
  // Only for `stack-centre`. `lockup-right` is anchored to an edge deliberately, and asserting a centre
  // there would collapse the two compositions into one — which banners.test.mjs separately reddens on.
  if (s.layout === 'stack-centre') {
    const centre = compositionCentrePx(s);
    // Half a pixel. A browser lays out in 1/64px units, so exact equality would be flaky; the defect
    // this catches is tens of pixels wide, so the tolerance costs nothing real.
    const TOLERANCE = 0.5;
    const driftOf = (lo, hi, target) => (lo + hi) / 2 - target;

    for (const box of boxes) {
      // HORIZONTALLY every row is centred — the stack sets `align-items:center`, so the block and each
      // of its children share one axis.
      const drift = driftOf(box.x0, box.x1, centre.x);
      if (Math.abs(drift) > TOLERANCE) {
        throw new Error(
          `banner-${id}: \`${box.sel}\` is not centred horizontally — it sits ${Math.abs(drift).toFixed(0)}px ` +
            `${drift > 0 ? 'right' : 'left'} of the composition centre (x=${centre.x.toFixed(0)}px). Inside ` +
            'the safe area is not the same property as centred: the safe area is one-sided.',
        );
      }
    }

    // VERTICALLY only the block is centred, and checking the rows here would be a real defect rather
    // than extra rigour: `.wm` sits above `.cta` BY DESIGN, so a per-row y check would demand that a
    // stack not be a stack. This is the one place the two axes are genuinely not symmetric.
    const block = boxes.find((b) => b.sel === '#block');
    // Same reasoning as the STYLE guard above: dropping '#block' from the selector list would otherwise
    // fail as `undefined is not an object` inside a centring check, which names the wrong problem.
    if (!block) throw new Error("gen-banners: the measured boxes carry no '#block' — the centring check cannot run");
    const vDrift = driftOf(block.y0, block.y1, centre.y);
    if (Math.abs(vDrift) > TOLERANCE) {
      throw new Error(
        `banner-${id}: the composition is not centred vertically — it sits ${Math.abs(vDrift).toFixed(0)}px ` +
          `${vDrift > 0 ? 'below' : 'above'} the composition centre (y=${centre.y.toFixed(0)}px). The safe ` +
          'area is one-sided on this axis too; its midpoint is not the middle of the canvas.',
      );
    }
  }

  const out = join(root, 'public', bannerFile(id));
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: s.width, height: s.height } });

  // Read back what was written. The viewport is what was ASKED for; this is what shipped.
  const written = pngSize(readFileSync(out));
  if (written.width !== s.width || written.height !== s.height) {
    throw new Error(
      `banner-${id}: wrote ${written.width}x${written.height}, expected ${s.width}x${s.height} — ` +
        'the file would be cropped on upload.',
    );
  }

  // The widest row against the budget it had. Printed because every check above is pass/fail and none
  // of them says how much room was left — which is the number a human needs when deciding whether the
  // copy or the type scale can move at all.
  const widest = Math.max(...boxes.map((b) => b.x1 - b.x0));
  const budget = s.layout === 'stack-centre' ? centredBandPx(s) : safeAreaPx(s);
  console.log(
    `Wrote ${out} (${s.width}x${s.height}, ${s.label}) — widest row ${widest.toFixed(0)}px of ` +
      `${(budget.x1 - budget.x0).toFixed(0)}px usable`,
  );
  await page.close();
}

await browser.close();
