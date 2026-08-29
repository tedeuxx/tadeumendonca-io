// The profile banners: the occlusion model, the copy, the identity, and the bytes on disk (#558).
//
// WHAT MAKES THIS SURFACE DIFFERENT FROM EVERY OTHER GENERATED ASSET HERE, and it is why the checks
// below are shaped the way they are: a banner is NEVER SEEN WHOLE. The platform overlays an avatar on
// the lower-left and crops the sides on a phone, so "it looks right" is a claim about a picture nobody
// is ever shown. The composition therefore has to be stated as GEOMETRY — a safe area, derived from the
// two things that eat the canvas — and checked, here against the model and in the generator against the
// boxes the browser actually laid out.
//
// AND THE LIMIT, up front rather than at the bottom: everything here is about a FILE. `public/*.png`
// regenerates on demand; the live cover on LinkedIn or X changes only when the owner uploads it. A green
// run means the committed asset is right. It says nothing whatsoever about what is on either profile —
// that parity is recorded in the private `.brand/surfaces.md`, which is the only place it can live,
// because no test in this repository can reach an external surface.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

import {
  BANNER_COPY,
  MARK_RECTS,
  MARK_SPACE,
  PALETTE,
  SURFACES,
  SURFACE_IDS,
  bannerFile,
  bannerPath,
  centredBandPx,
  contains,
  diffBanners,
  generatedBannersIn,
  markSvg,
  overlaps,
  pngSize,
  requiredBanners,
  safeAreaPx,
  toPx,
  visibleCentreXPx,
  withinSafeArea,
} from './banners.mjs';
import { strings } from '../src/i18n/messages';

const root = resolve(import.meta.dirname, '..');
const publicDir = join(root, 'public');

const surfaceCases = SURFACE_IDS.map((id) => [id, SURFACES[id]]);

describe('there are surfaces at all', () => {
  // Guards every `it.each` below: an empty surface list generates zero cases, and a suite that ran
  // nothing reports exactly like a suite that passed everything.
  it('declares both banners', () => {
    expect(SURFACE_IDS).toEqual(['linkedin', 'x']);
  });
});

describe('the occlusion model holds together', () => {
  // `safe` is the rectangle a word may occupy, and `avatar`/`crop` are the REASONS it is that shape.
  // Declaring the reasons beside it is only worth anything if the derivation is checked: without these
  // two assertions, `safe` could be widened to whatever a composition needed and the justification
  // sitting next to it would quietly stop justifying it.
  it.each(surfaceCases)('%s: the safe area is inside the mobile crop', (_id, s) => {
    expect(contains(s.crop, s.safe)).toBe(true);
  });

  it.each(surfaceCases)('%s: the safe area is clear of the avatar overlay', (_id, s) => {
    expect(overlaps(s.safe, s.avatar)).toBe(false);
  });

  // The model must also be non-trivial in both directions. A zero-area safe rect satisfies both
  // assertions above vacuously; a crop equal to the whole canvas and an avatar of no size satisfy them
  // by describing no occlusion at all — which is the same as having no model.
  it.each(surfaceCases)('%s: every rectangle in the model has real area', (_id, s) => {
    for (const [name, r] of [
      ['safe', s.safe],
      ['crop', s.crop],
      ['avatar', s.avatar],
    ]) {
      expect(r.x1 - r.x0, `${name} width`).toBeGreaterThan(0);
      expect(r.y1 - r.y0, `${name} height`).toBeGreaterThan(0);
    }
  });

  it.each(surfaceCases)('%s: the model actually takes canvas away', (_id, s) => {
    // The crop is narrower than the canvas, and the avatar covers a corner of it. If either stopped
    // being true the safe area would be the whole banner and the generator's check would pass on any
    // composition at all.
    expect(s.crop.x1 - s.crop.x0).toBeLessThan(1);
    expect(s.avatar.x1).toBeGreaterThan(0.1);
    expect(s.avatar.y1).toBe(1);
    expect(contains({ x0: 0, y0: 0, x1: 1, y1: 1 }, s.safe)).toBe(true);
    expect(s.safe.x1 - s.safe.x0).toBeLessThan(0.7);
  });
});

describe('the composition is centred on what a reader sees, not on the safe area (#572)', () => {
  // THE PROPERTY NOBODY HAD WRITTEN DOWN. Every assertion above asks whether the artwork is INSIDE the
  // declared boundaries, and the X banner shipped satisfying all of them while sitting visibly right of
  // centre. It could, because `safe` is a CLEARANCE constraint and a one-sided one: its left edge is
  // inset to clear the avatar and nothing insets the right, so its midpoint is not the midpoint of
  // anything a reader looks at. Containment and centring are different properties; these are the
  // centring ones.

  it.each(surfaceCases)('%s: the visible centre is equidistant from the two crop edges', (_id, s) => {
    // Stated as the defining PROPERTY rather than as the formula, so re-deriving the centre from `safe`
    // — the defect — reddens here instead of being restated in two places and agreeing with itself.
    const crop = toPx(s.crop, s);
    const centre = visibleCentreXPx(s);
    expect(centre - crop.x0).toBeCloseTo(crop.x1 - centre, 6);
    expect(centre - crop.x0).toBeGreaterThan(0); // and it is a real interval, not a degenerate point
  });

  it('x: the safe area is one-sided, so its centre is NOT the visible centre', () => {
    // Guards the assertion above from being vacuously true. On LinkedIn the two midpoints coincide by
    // accident of the numbers, so a suite that only ever compared them there would pass whichever one
    // the generator used. On X they differ, which is the whole bug.
    const s = SURFACES.x;
    const safe = safeAreaPx(s);
    const safeCentre = (safe.x0 + safe.x1) / 2;
    expect(Math.abs(safeCentre - visibleCentreXPx(s))).toBeGreaterThan(10);
    expect(safeCentre).toBeGreaterThan(visibleCentreXPx(s)); // and it errs RIGHT — the avatar is on the left
  });

  it.each(surfaceCases)('%s: the centred band is centred, and inside the safe area', (_id, s) => {
    const band = centredBandPx(s);
    const safe = safeAreaPx(s);
    const centre = visibleCentreXPx(s);
    expect(centre - band.x0).toBeCloseTo(band.x1 - centre, 6);
    // Deliberately NOT `contains`. One of the band's edges is derived by subtracting a distance from a
    // safe edge and adding it back, so it can land a billionth of a pixel outside the rect it was
    // measured from — an exact containment test would be a gate that goes red on float noise rather
    // than on a composition, and a flaky gate is a defect in the gate. The epsilon is nine orders of
    // magnitude below the drift this suite exists to catch.
    expect(band.x0).toBeGreaterThanOrEqual(safe.x0 - 1e-9);
    expect(band.x1).toBeLessThanOrEqual(safe.x1 + 1e-9);
  });

  it.each(surfaceCases)('%s: a symmetric composition on it still has half the canvas to work with', (_id, s) => {
    // The cost of this fix, asserted rather than asserted-away. A centred row grows in both directions
    // at once, so its budget is twice the NEARER safe edge — narrower than `safe` itself whenever `safe`
    // is asymmetric. Pinning a floor is what stops the next inset from being widened until the copy no
    // longer fits: the truncation would come back, and nothing else here would notice.
    //
    // Asserted on EVERY surface, including the one anchored to an edge rather than centred. `layout` is
    // a field, and a surface that switches to `stack-centre` should find the budget already there — a
    // check that only exists for the layouts currently using it arrives one release after it was needed.
    const band = centredBandPx(s);
    expect((band.x1 - band.x0) / s.width).toBeGreaterThanOrEqual(0.5);
  });

  it('x: the asymmetry really does cost width — the band is narrower than the safe area', () => {
    const s = SURFACES.x;
    const safe = safeAreaPx(s);
    const band = centredBandPx(s);
    expect(band.x1 - band.x0).toBeLessThan(safe.x1 - safe.x0);
  });
});

describe('the safe-area check discriminates', () => {
  // A containment predicate that accepted everything would make the generator's refusal a no-op while
  // reading, in a diff, exactly like a working gate. So it is exercised against boxes placed in each of
  // the two places this surface actually loses content.
  const s = SURFACES.linkedin;
  const safe = safeAreaPx(s);

  it('accepts a box inside the safe area', () => {
    expect(withinSafeArea({ x0: safe.x0 + 10, y0: safe.y0 + 10, x1: safe.x1 - 10, y1: safe.y1 - 10 }, s)).toBe(true);
  });

  it('rejects a box that reaches into the avatar corner', () => {
    const avatar = toPx(s.avatar, s);
    expect(withinSafeArea({ x0: avatar.x0 + 5, y0: avatar.y0 + 5, x1: avatar.x1 - 5, y1: avatar.y1 - 5 }, s)).toBe(
      false,
    );
  });

  it('rejects a box that runs past the mobile crop', () => {
    expect(withinSafeArea({ x0: safe.x0 + 10, y0: safe.y0 + 10, x1: s.width - 1, y1: safe.y1 - 10 }, s)).toBe(false);
  });

  it('rejects a box that is only PARTLY outside — one edge is enough', () => {
    expect(withinSafeArea({ x0: safe.x0 + 10, y0: safe.y0 - 1, x1: safe.x1 - 10, y1: safe.y1 - 10 }, s)).toBe(false);
  });
});

describe('rectangle arithmetic', () => {
  const unit = { x0: 0, y0: 0, x1: 1, y1: 1 };

  it('contains: an identical rect counts, a wider one does not', () => {
    expect(contains(unit, unit)).toBe(true);
    expect(contains(unit, { x0: -0.01, y0: 0, x1: 1, y1: 1 })).toBe(false);
  });

  it('overlaps: shared area yes, touching edges no', () => {
    expect(overlaps(unit, { x0: 0.5, y0: 0.5, x1: 1.5, y1: 1.5 })).toBe(true);
    // The case the whole model rests on: a safe area starting exactly where the avatar ends is CLEAR.
    expect(overlaps(unit, { x0: 1, y0: 0, x1: 2, y1: 1 })).toBe(false);
    expect(overlaps(unit, { x0: 2, y0: 2, x1: 3, y1: 3 })).toBe(false);
  });

  it('toPx scales a fraction onto the canvas', () => {
    expect(toPx({ x0: 0, y0: 0, x1: 0.5, y1: 1 }, { width: 1000, height: 400 })).toEqual({
      x0: 0,
      y0: 0,
      x1: 500,
      y1: 400,
    });
  });
});

describe('the same language, recomposed per surface', () => {
  // THE CRITERION, mechanically. "One artwork resized" is the likely build and it is the wrong one: the
  // OG card's own comment records it is tuned for ~320px wide with one dominant line, and a 4:1 band
  // seen large is neither of those things. Two surfaces declaring the same layout would be that build.
  it('declares a different composition for each ratio', () => {
    const layouts = SURFACE_IDS.map((id) => SURFACES[id].layout);
    expect(new Set(layouts).size).toBe(layouts.length);
  });

  it('the two ratios really are different', () => {
    const ratios = SURFACE_IDS.map((id) => SURFACES[id].width / SURFACES[id].height);
    expect(new Set(ratios.map((r) => r.toFixed(2))).size).toBe(ratios.length);
  });

  // The platform-published sizes, pinned as literals. A banner at the wrong size is the failure nobody
  // notices until it has been uploaded and cropped, and these two numbers are the only defence.
  it('LinkedIn is 1584x396 and X is 1500x500', () => {
    expect([SURFACES.linkedin.width, SURFACES.linkedin.height]).toEqual([1584, 396]);
    expect([SURFACES.x.width, SURFACES.x.height]).toEqual([1500, 500]);
  });
});

describe('the committed banners are the files the model describes', () => {
  // The dimension assertion per surface, on the BYTES rather than on the viewport the generator asked
  // for. The generator checks this too, at write time; this is what holds after a hand-edit, a bad
  // merge, or a regeneration nobody re-ran.
  it.each(surfaceCases)('%s: the PNG on disk is exactly the declared size', (id, s) => {
    const bytes = readFileSync(join(publicDir, bannerFile(id)));
    expect(pngSize(bytes)).toEqual({ width: s.width, height: s.height });
  });

  it('has a banner for every surface, and no banner without a surface', () => {
    const { missing, orphaned } = diffBanners(requiredBanners(), generatedBannersIn(publicDir));
    expect(
      missing.map((b) => b.path),
      'run `npm run gen-banners`',
    ).toEqual([]);
    expect(orphaned, 'a banner for a surface that is no longer published to').toEqual([]);
  });

  // Guards the false green above: with nothing found on disk, `orphaned` is empty and `missing` would
  // be the only signal — and a directory read that silently returns nothing is exactly the shape a
  // changed path takes.
  it('found the banners at all — an empty directory must not read as “in sync”', () => {
    expect(generatedBannersIn(publicDir)).toEqual(SURFACE_IDS.map((id) => bannerPath(id)).sort());
  });
});

describe('banner naming', () => {
  // Keyed by the SURFACE and not by locale, unlike the OG cards: a profile has one banner, and the copy
  // beside it on both platforms is English.
  it('is keyed by the surface alone', () => {
    expect(bannerPath('linkedin')).toBe('/banner-linkedin.png');
    expect(bannerPath('x')).toBe('/banner-x.png');
  });

  it('gives the two surfaces different files', () => {
    expect(bannerFile('linkedin')).not.toBe(bannerFile('x'));
  });
});

describe('diffBanners', () => {
  it('reports a surface whose banner does not exist', () => {
    const { missing, orphaned } = diffBanners(requiredBanners(), ['/banner-linkedin.png']);
    expect(missing.map((b) => b.path)).toEqual(['/banner-x.png']);
    expect(orphaned).toEqual([]);
  });

  it('reports art left behind by a surface no longer published to', () => {
    const { missing, orphaned } = diffBanners([], ['/banner-gone.png']);
    expect(missing).toEqual([]);
    expect(orphaned).toEqual(['/banner-gone.png']);
  });
});

describe('pngSize', () => {
  it('reads the real dimensions of a committed banner', () => {
    expect(pngSize(readFileSync(join(publicDir, 'banner-x.png')))).toEqual({ width: 1500, height: 500 });
  });

  // Refuses rather than returning a plausible wrong number — the failure mode a byte-pattern scan has,
  // and the one that would make every dimension assertion above meaningless.
  it('refuses something that is not a PNG', () => {
    expect(() => pngSize(Buffer.alloc(64))).toThrow(/bad signature/);
  });

  it('refuses a PNG whose first chunk is not IHDR', () => {
    const bytes = Buffer.from(readFileSync(join(publicDir, 'banner-x.png')));
    bytes.write('IEND', 12, 'latin1');
    expect(() => pngSize(bytes)).toThrow(/IHDR/);
  });
});

describe('the identity is one system, not a second copy of it', () => {
  // The mark is DATA here and is compared to the canonical drawing rather than re-typed beside it.
  // public/favicon.svg, scripts/gen-icons.mjs and the OG card's badge all claim to draw one mark; this
  // is what makes that claim falsifiable for the surface this slice adds.
  const favicon = readFileSync(join(publicDir, 'favicon.svg'), 'utf8');
  const faviconRects = [...favicon.matchAll(/<rect\s+([^>]*?)\/>/g)].map(([, attrs]) =>
    Object.fromEntries([...attrs.matchAll(/(\w[\w-]*)="([^"]*)"/g)].map(([, k, v]) => [k, v])),
  );

  it('read the favicon at all — an unparsed file must not pass as agreement', () => {
    expect(faviconRects.length).toBe(MARK_RECTS.length + 1); // the field, plus the glyph rects
  });

  it('draws the glyph on the same geometry as the favicon', () => {
    const glyph = faviconRects
      .filter((r) => r.x !== undefined)
      .map((r) => ({ x: Number(r.x), y: Number(r.y), width: Number(r.width), height: Number(r.height) }));
    expect(glyph).toEqual(MARK_RECTS);
  });

  it('draws it in the same 512-space, and on the same two palette values', () => {
    expect(favicon).toContain(`viewBox="0 0 ${MARK_SPACE} ${MARK_SPACE}"`);
    expect(favicon).toContain(`fill="${PALETTE.accent}"`);
    expect(favicon).toContain(`fill="${PALETTE.ink}"`);
  });

  it('the emitted SVG carries the rects rather than a hand-written duplicate of them', () => {
    const svg = markSvg();
    for (const r of MARK_RECTS) expect(svg).toContain(`x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}"`);
    expect(svg).toContain(PALETTE.accent);
    expect(svg).toContain(PALETTE.ink);
  });
});

describe('the copy', () => {
  // THE TRAP, ASSERTED. "Mirror the root URL's preview" reads literally as "put the hero tagline on it",
  // and that is the one line that must not ship here: on an unfurl card the implied subject is the SITE,
  // but above a photograph and a name it becomes the person, and an instruction to the reader turns into
  // an offer to teach them. Same words, different implied speaker, opposite compliance.
  it.each(['pt', 'en'])('is not the hero tagline (%s edition)', (locale) => {
    const lead = strings.hero.taglineLead[locale].replace(/\s*—\s*$/, '');
    expect(lead.length).toBeGreaterThan(10); // the comparison is against a real sentence, not ''
    expect(BANNER_COPY.line).not.toBe(lead);
    expect(BANNER_COPY.line.toLowerCase()).not.toContain(lead.toLowerCase());
    expect(BANNER_COPY.line).not.toBe(strings.hero.taglineAccent[locale]);
  });

  // THE SECOND TRAP. The banner sits roughly 40px above a headline that already states the role and the
  // practice. Repeating either is the same sentence twice on one screen — and it is the likely edit,
  // because the OG card's meta line is right there and looks like the obvious thing to reuse.
  it('states no role, product or practice — the headline beside it already does', () => {
    expect(BANNER_COPY.line).not.toMatch(/engineer|architect|harness|agent|\bAI\b|AI-DLC|agentic/i);
  });

  // It is a CALL TO ACTION rather than a claim — the owner's own reframing of what the line is for. What
  // is checkable about that: it opens on a verb addressed to the reader, and it makes no assertion about
  // the person. Deliberately weak, and stated as weak: no test can tell an invitation from a boast.
  it('opens as an invitation to the reader', () => {
    expect(BANNER_COPY.line).toMatch(/^read /);
    expect(BANNER_COPY.line).not.toMatch(/\bI\b|\bmy\b/i);
  });

  it('sets the wordmark the way every other surface does — the tld in the accent', () => {
    expect(BANNER_COPY.wordmark + BANNER_COPY.tld).toBe('tadeumendonca.io');
    expect(BANNER_COPY.tld).toBe('.io');
  });
});
