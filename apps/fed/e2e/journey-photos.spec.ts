import { test, expect, type Page } from '@playwright/test';

// The journey photographs on /me (#127, moved inside the work-experience entries by #516), in a real
// viewport.
//
// REWRITTEN, NOT DELETED, WHEN THE STRIP WENT AWAY. This file was `journey-strip.spec.ts` and it held four
// live guarantees, only two of which were about a strip. Deleting it with the component would have dropped
// the other two silently — which is the failure this repo files bugs about. What was dropped, and only
// this: the one-row assertion and the equal-tile assertion, both of which lost their object when the four
// frames stopped being a set laid out together. What survives is the decode guard, the no-upscale bound,
// the 320px overflow check and the print-absence check.
//
// WHY E2E AND NOT A UNIT TEST — the same split `content-photo.spec.ts` already makes, and it is worth being
// exact about which half is here. The STRUCTURAL half (which entry a frame lands in, where in that entry,
// the width/height attributes, per-locale alt and caption that differ, the print hook emitted) is asserted
// in `src/components/CVSection.test.tsx` and `src/data/journey.test.ts`, where it costs no browser. jsdom
// has no layout engine and reports zero-sized rects, so everything below — that the bytes decode, that
// nothing is upscaled, that nothing overflows a phone, that print really hides them — passes identically in
// the broken world and the fixed one when asserted there.
//
// THE ONE THIS FILE EXISTS FOR IS THE DECODE. A `src` that 404s still lays out a box from the width and
// height attributes, so every geometry assertion in the repo would pass on a page of broken images. It is
// the only thing standing between a renamed asset and four alt strings. It is also why the assertions name
// the file: a failure has to say WHICH photograph, not "an image is missing".
const ROUTES = ['/pt/me', '/en/me'];
const HEIGHT = 900;

// The approved set is four (`src/data/journey.test.ts` locks which four). Written here as a literal on
// purpose: it is what turns a stale selector from a silent pass into a failure. Every loop below is a `for`
// over a list, and a `for` over an empty list passes in silence — so the count is waited for and asserted
// before anything is measured.
const FRAMES = 4;

/**
 * Force every photograph to fetch, and wait for the browser to settle each one.
 *
 * NEEDED BECAUSE `loading="lazy"` WORKS. The frames sit inside a long CV, so the lower ones are never
 * REQUESTED without a scroll; `networkidle` therefore settles with `naturalWidth === 0` and reports "the
 * file is missing or corrupt" about perfectly good JPEGs. Scrolling to provoke the IntersectionObserver is
 * the worse fix — it races the observer, and a wait that never resolves is a flake with a plausible cover
 * story. So the fetch is forced instead of provoked, which is exactly the request a reader's scroll would
 * have made, minus the timing. That the attribute SHIPS as `lazy` is a separate claim, asserted cheaply and
 * exactly in `CVSection.test.tsx`.
 *
 * Copied in shape from `content-photo.spec.ts`'s `loadEveryPhotograph` rather than imported from it: that
 * one selects `figure[data-photo] img`, this one `[data-journey-photo] img`, and widening its selector to
 * cover both would make one spec's failure message ambiguous about which page it came from.
 */
async function loadEveryFrame(page: Page) {
  // WAIT FOR THE FIGURES TO EXIST BEFORE FORCING THEM TO LOAD. Without it `page.evaluate` runs against a
  // page that has not hydrated yet: the selector matches nothing, `Promise.all([])` resolves instantly, and
  // the helper reports success having waited for nothing. The frames then render and the very next
  // assertion reads `naturalWidth === 0` on all of them — "renamed, missing, or corrupt" about files that
  // are present and fine. That is exactly what this spec did on its first run.
  await expect(page.locator('[data-journey-photo] img')).toHaveCount(FRAMES);
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('[data-journey-photo] img')] as HTMLImageElement[];
    for (const img of imgs) img.loading = 'eager';
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : // `onerror` resolves too, deliberately: a 404 must reach the assertion as `naturalWidth === 0`
            // with a named file, not as a timeout with no clue which one.
            new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            }),
      ),
    );
  });
}

test.describe('the journey photographs on /me', () => {
  for (const route of ROUTES) {
    test(`${route} — every photograph is real bytes, not an alt string`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: HEIGHT });
      await page.goto(route);
      await loadEveryFrame(page);

      const broken = await page.evaluate(() =>
        [...document.querySelectorAll('[data-journey-photo] img')]
          .filter((img) => !(img as HTMLImageElement).naturalWidth)
          .map((img) => (img as HTMLImageElement).getAttribute('src')),
      );
      expect(broken, 'these photographs did not decode — renamed, missing, or corrupt').toEqual([]);

      const count = await page.locator('[data-journey-photo] img').count();
      expect(count).toBe(FRAMES);
    });

    test(`${route} — each frame sits inside the experience entry that attributes it`, async ({ page }) => {
      // THE HALF THE MOVE ADDED, and the one a stale selector would otherwise hide: `CVSection.test.tsx`
      // proves the figure is nested inside an entry in jsdom, and this proves the nesting survives into a
      // real render of the real page with the real data. Counted rather than enumerated — naming which
      // employer carries which frame here would duplicate the attribution lock in `journey.test.ts` and
      // would have to be edited every time the CV grows.
      await page.setViewportSize({ width: 1280, height: HEIGHT });
      await page.goto(route);
      await loadEveryFrame(page);

      const nested = await page.evaluate(() => {
        const entries = [
          ...document.querySelectorAll('[data-print-block="01"] > div:last-child > div > div'),
        ];
        return {
          entries: entries.length,
          carrying: entries.filter((el) => el.querySelector(':scope > [data-journey-photo]')).length,
          total: document.querySelectorAll('[data-journey-photo]').length,
        };
      });
      // More entries than frames: the set is four and the CV has more roles than that, which is the
      // owner's "a figure an entry MAY carry" and not a gap to fill.
      expect(nested.entries).toBeGreaterThan(FRAMES);
      expect(nested.total).toBe(FRAMES);
      // Every frame on the page is a DIRECT child of a distinct entry. Compared against the total rather
      // than asserted alone: `carrying` counts entries, so on its own it would stay green with a fifth
      // figure rendering loose somewhere else on the page.
      expect(nested.carrying, 'a frame is rendering outside an experience entry').toBe(FRAMES);
    });

    test(`${route} — no frame is upscaled past the committed 660px`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: HEIGHT });
      await page.goto(route);
      await loadEveryFrame(page);

      const widths = await page
        .locator('[data-journey-photo] img')
        .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
      expect(widths).toHaveLength(FRAMES);
      // The committed files are 660px wide; anything laid out wider than that is a blurrier wall, and it
      // is the defect a `w-full` in a widening column produces silently.
      expect(Math.max(...widths), 'a frame is being upscaled past the committed 660px').toBeLessThanOrEqual(660);
      // And the floor, which the move made reachable: a figure squeezed to nothing inside a narrow entry
      // renders as a sliver and passes every assertion above. There is no authored minimum, so this is a
      // sanity bound rather than a design number.
      expect(Math.min(...widths), 'a frame has collapsed to a sliver').toBeGreaterThan(80);
    });
  }

  // One phone width, one edition — the check is the layout's, not the copy's, and running it twice buys a
  // second identical measurement rather than a second signal.
  test('/en/me — nothing overflows a 320px phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: HEIGHT });
    await page.goto('/en/me');
    await loadEveryFrame(page);

    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll('[data-journey-photo] img')]
        .filter((img) => img.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .map((img) => img.getAttribute('src')),
    );
    expect(overflow, 'these frames run off the right edge at 320px').toEqual([]);
  });

  // THE HALF THE UNIT TEST CANNOT REACH, and it matters more since #516 than it did before: the figures now
  // live INSIDE `[data-print="cv"]`, the tree `/cv.pdf` is printed from. `CVSection.test.tsx` proves the
  // `data-print="hide"` hook is EMITTED; jsdom applies no stylesheet, so it cannot prove the hook is WIRED.
  // Both are needed and they fail for different reasons: dropping the attribute is a component edit,
  // dropping the rule is a CSS edit, and either one alone puts four 3:4 photographs onto a third sheet of a
  // CV budgeted at two.
  //
  // `e2e/cv-pdf.spec.ts` would eventually catch it via the page count, which is the belt to this brace —
  // but it would report "the CV PDF must stay within two pages" and say nothing about a photograph, on a
  // guard whose comment explicitly warns against raising the number to go green. This assertion names the
  // cause.
  test('/en/me — the photographs are absent from the print edition', async ({ page }) => {
    await page.goto('/en/me');
    await page.emulateMedia({ media: 'print' });

    const frames = page.locator('[data-journey-photo]');
    // THE COUNT GUARD, AND IT IS NOT DECORATION. Every assertion below is an absence, and a spec that finds
    // nothing would report that it found nothing wrong — the exact shape this file already paid for once,
    // in `cv-pdf.spec.ts`'s marquee locator that pointed at a string the app no longer contained.
    await expect(frames, 'no journey photograph is on the page at all — the selector has drifted').toHaveCount(FRAMES);
    const displays = await frames.evaluateAll((els) => els.map((el) => getComputedStyle(el).display));
    expect(displays).toEqual(Array(FRAMES).fill('none'));

    // The control, and it is what makes the assertion above mean something: under the SAME emulated media
    // the CV itself is still displayed. Without it, a stylesheet that hid the whole page would read as a
    // pass — and that risk is real now that the figures are nested inside the CV tree rather than beside it.
    const cv = page.locator('[data-print="cv"]');
    await expect(cv).toHaveCount(1);
    expect(await cv.evaluate((el) => getComputedStyle(el).display)).not.toBe('none');
  });
});
