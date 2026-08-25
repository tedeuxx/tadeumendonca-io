import { test, expect, type Page } from '@playwright/test';

// The journey-photograph strip on /me (#127), in a real viewport.
//
// WHY E2E AND NOT A UNIT TEST — the same split `content-photo.spec.ts` already makes, and it is worth
// being exact about which half is here. The STRUCTURAL half (which four files, in which order, with the
// width/height attributes, with per-locale alt and caption that differ, with the print hook emitted) is
// asserted in `src/components/JourneyStrip.test.tsx` and `src/data/journey.test.ts`, where it costs no
// browser. jsdom has no layout engine and reports zero-sized rects, so everything below — that the four
// tiles are actually laid out as a row rather than stacked, that they are the same size as each other,
// that the bytes decode, and that nothing overflows a phone — passes identically in the broken world and
// the fixed one when asserted there.
//
// THE ONE THIS FILE EXISTS FOR IS THE DECODE. A `src` that 404s still lays out a box from the width and
// height attributes, so every geometry assertion in the repo would pass on a page of broken images. It is
// the only thing standing between a renamed asset and four alt strings. It is also why the assertions
// name the file: a failure has to say WHICH photograph, not "an image is missing".
const ROUTES = ['/pt/me', '/en/me'];
const HEIGHT = 900;

// The approved set is four (`src/data/journey.test.ts` locks which four). Written here as a literal on
// purpose: it is what turns a stale selector from a silent pass into a failure. Every loop below is a
// `for` over a list, and a `for` over an empty list passes in silence — so the count is waited for and
// asserted before anything is measured.
const TILES = 4;

/**
 * Force every tile to fetch, and wait for the browser to settle each one.
 *
 * NEEDED BECAUSE `loading="lazy"` WORKS. The strip is below a full CV, so no tile is ever REQUESTED
 * without a scroll; `networkidle` therefore settles with `naturalWidth === 0` on all four and reports
 * "the file is missing or corrupt" about four perfectly good JPEGs. Scrolling to provoke the
 * IntersectionObserver is the worse fix — it races the observer, and a wait that never resolves is a
 * flake with a plausible cover story. So the fetch is forced instead of provoked, which is exactly the
 * request a reader's scroll would have made, minus the timing. That the attribute SHIPS as `lazy` is a
 * separate claim, asserted cheaply and exactly in `JourneyStrip.test.tsx`.
 *
 * Copied in shape from `content-photo.spec.ts`'s `loadEveryPhotograph` rather than imported from it: that
 * one selects `figure[data-photo] img`, this one `[data-journey-photo] img`, and widening its selector to
 * cover both would make one spec's failure message ambiguous about which page it came from.
 */
async function loadEveryTile(page: Page) {
  // WAIT FOR THE TILES TO EXIST BEFORE FORCING THEM TO LOAD, and this line was earned rather than
  // copied. Without it `page.evaluate` runs against a page that has not hydrated yet: the selector
  // matches nothing, `Promise.all([])` resolves instantly, and the helper reports success having waited
  // for nothing. The four tiles then render and the very next assertion reads `naturalWidth === 0` on all
  // four — "renamed, missing, or corrupt" about four files that are present and fine. That is exactly
  // what this spec did on its first run.
  //
  // `content-photo.spec.ts` gets away with a bare `networkidle` because its page is a markdown body. Here
  // the wait is on the ELEMENTS, which is both stricter and immune to a page that never goes idle.
  await expect(page.locator('[data-journey-photo] img')).toHaveCount(TILES);
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

test.describe('the journey strip on /me', () => {
  for (const route of ROUTES) {
    test(`${route} — every photograph is real bytes, not an alt string`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: HEIGHT });
      await page.goto(route);
      await loadEveryTile(page);

      const broken = await page.evaluate(() =>
        [...document.querySelectorAll('[data-journey-photo] img')]
          .filter((img) => !(img as HTMLImageElement).naturalWidth)
          .map((img) => (img as HTMLImageElement).getAttribute('src')),
      );
      expect(broken, 'these photographs did not decode — renamed, missing, or corrupt').toEqual([]);

      const count = await page.locator('[data-journey-photo] img').count();
      expect(count).toBe(TILES);
    });

    test(`${route} — the four read as one set: a row of equal tiles`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: HEIGHT });
      await page.goto(route);
      await loadEveryTile(page);

      const boxes = await page.locator('[data-journey-photo] img').evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
        }),
      );
      expect(boxes).toHaveLength(TILES);

      // ONE ROW. This is the assertion the whole component exists for — four photographs read as a set
      // only when they are seen together, and the failure mode is silent: a grid that collapses to one
      // column still renders every photograph, still passes every structural test, and turns a strip into
      // 3,500px of scroll on the page a recruiter is scanning. Tops are compared with a tolerance rather
      // than for equality because sub-pixel rounding differs across engines.
      const tops = boxes.map((b) => b.top);
      expect(Math.max(...tops) - Math.min(...tops), 'the tiles must sit on one row at 1280').toBeLessThan(2);

      // EQUAL SIZE. Four cameras, three years, one grid: a tile that is a different size is a photograph
      // that was recropped without its registry entry moving, and it reads as a mistake rather than as a
      // set. Guarded here rather than only on the ratios in `journey.test.ts`, because that file proves
      // the FILES agree and this proves the LAYOUT does.
      const widths = boxes.map((b) => b.width);
      const heights = boxes.map((b) => b.height);
      expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(2);
      expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(2);

      // AND NOT UPSCALED. The committed files are 660px wide; a tile laid out wider than that is a
      // blurrier wall, and it is the defect a `w-full` in a widening column produces silently.
      expect(Math.max(...widths), 'a tile is being upscaled past the committed 660px').toBeLessThanOrEqual(660);
    });
  }

  // One phone width, one edition — the check is the layout's, not the copy's, and running it twice buys a
  // second identical measurement rather than a second signal.
  test('/en/me — nothing overflows a 320px phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: HEIGHT });
    await page.goto('/en/me');
    await loadEveryTile(page);

    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll('[data-journey-photo] img')]
        .filter((img) => img.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .map((img) => img.getAttribute('src')),
    );
    expect(overflow, 'these tiles run off the right edge at 320px').toEqual([]);
  });

  // THE HALF THE UNIT TEST CANNOT REACH. `JourneyStrip.test.tsx` proves the `data-print="hide"` hook is
  // EMITTED; jsdom applies no stylesheet, so it cannot prove the hook is WIRED. Both are needed and they
  // fail for different reasons: dropping the attribute is a component edit, dropping the rule is a CSS
  // edit, and either one alone puts four 3:4 photographs on a third sheet of a CV budgeted at two.
  //
  // `e2e/cv-pdf.spec.ts` would eventually catch it via the page count, which is the belt to this brace —
  // but it would report "the CV PDF must stay within two pages" and say nothing about a photograph, on a
  // guard whose comment explicitly warns against raising the number to go green. This assertion names the
  // cause.
  test('/en/me — the strip is absent from the print edition', async ({ page }) => {
    await page.goto('/en/me');
    await page.emulateMedia({ media: 'print' });
    const strip = page.locator('[data-journey]');
    await expect(strip).toHaveCount(1);
    expect(await strip.evaluate((el) => getComputedStyle(el).display)).toBe('none');

    // The control, and it is what makes the assertion above mean something: under the SAME emulated media
    // the CV itself is still displayed. Without it, a stylesheet that hid the whole page would read as a
    // pass.
    const cv = page.locator('[data-print="cv"]');
    await expect(cv).toHaveCount(1);
    expect(await cv.evaluate((el) => getComputedStyle(el).display)).not.toBe('none');
  });
});
