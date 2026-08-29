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
// 3. THE CENTRING — added by #572, and the one the other three cannot see. Refusal 2 asks whether the
//    artwork is inside the boundaries; a lockup can satisfy that and still be visibly off-centre,
//    because the safe area is a ONE-SIDED clearance constraint and its midpoint is not the midpoint of
//    what a reader sees. So a `stack-centre` composition is measured against the visible centre.
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
  markSvg,
  pngSize,
  safeAreaPx,
  visibleCentreXPx,
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
  // HORIZONTALLY, a centred stack is centred on `visibleCentreXPx` and NOT on the middle of `safe` (#572).
  // `safe` is one-sided — its left edge is inset to clear the avatar and nothing insets the right — so
  // its midpoint is 0.55 of the X canvas while the visible band's is 0.50, and centring in it shipped a
  // lockup 75px right of centre that satisfied every check this file makes. Vertically `safe` IS the
  // frame (its top and bottom are both real limits), so the y term below still reads from it.
  const INSET = 4;
  const place = stack
    ? `left:${visibleCentreXPx(s)}px; top:${(safe.y0 + safe.y1) / 2}px; transform:translate(-50%,-50%);
       align-items:center; text-align:center;`
    : `right:${s.width - safe.x1 + INSET}px; top:${(safe.y0 + safe.y1) / 2}px; transform:translateY(-50%);
       align-items:flex-end; text-align:right;`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family:'JetBrains Mono'; font-weight:500; src:url('${mono}') format('woff2'); }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${s.width}px; height:${s.height}px; }
  body { background:${PALETTE.canvas}; color:${PALETTE.type}; overflow:hidden; position:relative;
    border-top:6px solid ${PALETTE.rule}; border-bottom:6px solid ${PALETTE.rule}; }
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
    const centre = visibleCentreXPx(s);
    for (const box of boxes) {
      const drift = (box.x0 + box.x1) / 2 - centre;
      // Half a pixel. A browser lays out in 1/64px units, so an exact-equality check would be flaky;
      // the defect this catches is tens of pixels wide, so the tolerance costs nothing real.
      if (Math.abs(drift) > 0.5) {
        throw new Error(
          `banner-${id}: \`${box.sel}\` is not centred on what a reader sees — it sits ${drift.toFixed(0)}px ` +
            `${drift > 0 ? 'right' : 'left'} of the visible centre (${centre.toFixed(0)}px). Inside the safe ` +
            'area is not the same property as centred: the safe area is one-sided.',
        );
      }
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
