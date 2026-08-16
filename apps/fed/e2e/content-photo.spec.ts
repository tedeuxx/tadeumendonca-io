import { test, expect, type Page } from '@playwright/test';

// The photographs on /architecture, in a real viewport (#415).
//
// WHY E2E AND NOT A UNIT TEST, the same reason `diagram-centred.spec.ts` and `markdown-table-narrow.spec.ts`
// give: the defects here are LAYOUT. jsdom has no layout engine and reports zero-sized rects, so a DOM
// assertion passes identically in the broken world and the fixed one. The structural half — same files,
// same order, alt and caption present and different per edition — is asserted off the markdown in
// `src/content/architecture-photos.test.ts`, where it costs no browser. This file is only the part that
// needs pixels.
//
// THE ONE THIS PAGE EXISTS FOR IS THE QUOTATION, and it is worth being exact about what is and is not
// being checked. A photograph cannot carry words the page depends on: legibility inside a raster is not
// assertable — the Venn's label is a text node with a bounding rect, while type inside a JPEG is pixels
// and no assertion can measure its rendered glyph height. So the Knuth quotation is authored as a real
// blockquote, and what is asserted is the property that failure mode was about: the words are on screen,
// as text, at the widths where they could fail. The photograph's own legibility is NOT asserted, because
// it cannot be, and the design is what makes that acceptable rather than a gap.
const ROUTES = ['/pt/architecture', '/en/architecture'];
const WIDTHS = [320, 390, 768, 1280];
const HEIGHT = 900;

// A distinctive fragment of the wall's words. Not translated in either edition — the quotation is
// English on the wall and stays English in both, which is why one constant serves both routes.
const QUOTE_FRAGMENT = 'it produces objects of beauty';

/**
 * Force every photograph to fetch, and wait for the browser to settle each one.
 *
 * NEEDED BECAUSE `loading="lazy"` WORKS, which is easy to forget when writing the assertion that depends
 * on it. A lazy image below the fold is never REQUESTED, so it produces no network activity, so
 * `waitForLoadState('networkidle')` settles with `naturalWidth === 0` and `complete === false` on the
 * three figures under the fold. The first version of this spec measured straight after `networkidle` and
 * reported "the file is missing or corrupt" about four perfectly good JPEGs.
 *
 * THE SECOND VERSION SCROLLED, and that was worse: it hung. Driving an IntersectionObserver from a test
 * means racing it — scroll past the figures in a few frames and the observer may register none of them,
 * and then a wait for `complete` never resolves. A check whose reliability depends on how fast a loop
 * runs is a flake with a plausible cover story.
 *
 * So the fetch is forced instead of provoked. `loading` is flipped to `eager` on the elements, which is
 * exactly the request a reader's scroll would have made, minus the timing. That the attribute ships as
 * `lazy` is a separate claim and is asserted where it can be asserted cheaply and exactly —
 * `PhotoFigure.test.tsx`. What this file is for is what a real engine does with the bytes.
 *
 * Dropping the decode check was the other option and is the wrong trade: a `src` that 404s still lays out
 * a box from the width/height attributes, so every geometry assertion here would pass on broken images.
 * It is the only thing standing between a renamed asset and a page of alt text.
 */
async function loadEveryPhotograph(page: Page) {
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('figure[data-photo] img')] as HTMLImageElement[];
    for (const img of imgs) img.loading = 'eager';
    // `onerror` resolves too, deliberately: a 404 must reach the assertion as `naturalWidth === 0` with a
    // named file, not as a timeout with no clue which one.
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            }),
      ),
    );
  });
}

test.describe('the content photographs', () => {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      test(`${route}: every photograph is labelled and inside its frame at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await loadEveryPhotograph(page);

        const figures = await page.locator('figure[data-photo]').evaluateAll((els) =>
          els.map((el) => {
            const img = el.querySelector('img');
            const f = el.getBoundingClientRect();
            const i = img?.getBoundingClientRect();
            const caption = el.querySelector('figcaption')?.textContent ?? '';
            return {
              src: img?.getAttribute('src') ?? '(no src)',
              alt: img?.getAttribute('alt') ?? '',
              caption,
              // Has the image actually decoded? A src that 404s still lays out a box from the
              // width/height attributes, so a geometry-only check passes on broken images.
              loaded: img instanceof HTMLImageElement && img.naturalWidth > 0,
              // Positive means the image sticks out of its own figure on that side.
              overLeft: Math.round(f.left - i!.left),
              overRight: Math.round(i!.right - f.right),
            };
          }),
        );

        // The guard that makes every loop below mean something: an empty list passes a `for` in silence,
        // and a renamed hook is exactly how this file would stop asserting anything.
        expect(figures.length, 'no photograph found — the data-photo hook went stale').toBe(2);

        for (const fig of figures) {
          expect(fig.alt.trim(), `${fig.src} renders with no alt text`).not.toBe('');
          expect(fig.caption.trim(), `${fig.src} renders with no caption`).not.toBe('');
          expect(fig.loaded, `${fig.src} did not decode — the file is missing or corrupt`).toBe(true);
          expect(fig.overLeft, `${fig.src} sticks out of its figure on the left`).toBeLessThanOrEqual(0);
          expect(fig.overRight, `${fig.src} sticks out of its figure on the right`).toBeLessThanOrEqual(
            0,
          );
        }

        // The page body must never scroll sideways. `responsive-overflow.spec.ts` sweeps this across
        // every route in pt; it is repeated here, on both editions, because a wide raster is the single
        // most likely thing to break it and this is the spec someone changing a photograph will run.
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${route} overflows by ${overflow}px at ${width}px`).toBeLessThanOrEqual(0);
      });
    }
  }

  // THE QUOTATION IS ON SCREEN AS TEXT, at the two widths where it can fail and one where it cannot.
  //
  // Stated in the READER's coordinates rather than the document's, which is the lesson the three-pillar
  // figure paid for: a label perfectly centred in its own drawing was cut mid-word at 390px, and every
  // check passed. So the property is that the element's own bounding rect lies inside the viewport —
  // horizontally, which is the axis that cannot be fixed by scrolling down.
  //
  // Located by CONTENT rather than by index, so adding a figure or a paragraph above does not silently
  // re-point this at a different element.
  for (const route of ROUTES) {
    for (const width of [320, 390, 1280]) {
      test(`${route}: the Knuth quotation is on screen as text at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const seen = await page.evaluate((fragment) => {
          const quote = [...document.querySelectorAll('.markdown blockquote')].find((el) =>
            el.textContent?.includes(fragment),
          );
          if (!quote) return null;
          const r = quote.getBoundingClientRect();
          return {
            text: quote.textContent ?? '',
            leftOfView: Math.round(0 - r.left),
            rightOfView: Math.round(r.right - document.documentElement.clientWidth),
          };
        }, QUOTE_FRAGMENT);

        expect(seen, 'the quotation is not on the page as text — is it only inside the photograph?')
          .not.toBeNull();
        // It is the whole quotation and its attribution, not a fragment: the attribution is the part
        // that makes "the words are Knuth's" selectable and crawlable rather than a caption's claim.
        expect(seen!.text).toContain('Computer programming is an art');
        expect(seen!.text).toContain('Donald Knuth, 1974');
        expect(seen!.leftOfView, 'the quotation is cut off the left edge').toBeLessThanOrEqual(0);
        expect(seen!.rightOfView, 'the quotation is cut off the right edge').toBeLessThanOrEqual(0);
      });
    }
  }

  // THE MUTATION GUARD. An assertion that cannot fail is this workspace's recurring defect, and the
  // check above is exactly the shape that hides one: `leftOfView <= 0` is satisfied by an element that is
  // simply present and unstyled, so it would stay green on a page where nothing had ever gone wrong AND
  // on a page where the mechanism had been removed.
  //
  // So the failure is MANUFACTURED here rather than argued about in a comment: the quotation is shouldered
  // out of the viewport with a real style change, and the same measurement is required to go red. If this
  // test starts passing its own assertion in the wrong direction, the check above has stopped measuring.
  test('/pt/architecture: the on-screen check goes RED when the quotation is pushed off-viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: HEIGHT });
    await page.goto('/pt/architecture');
    await page.waitForLoadState('networkidle');

    const measure = () =>
      page.evaluate((fragment) => {
        const quote = [...document.querySelectorAll('.markdown blockquote')].find((el) =>
          el.textContent?.includes(fragment),
        )!;
        const r = quote.getBoundingClientRect();
        return {
          leftOfView: Math.round(0 - r.left),
          rightOfView: Math.round(r.right - document.documentElement.clientWidth),
        };
      }, QUOTE_FRAGMENT);

    // Healthy first, so a mutation that "passes" because the element was already broken is not mistaken
    // for a working guard.
    const before = await measure();
    expect(before.leftOfView).toBeLessThanOrEqual(0);
    expect(before.rightOfView).toBeLessThanOrEqual(0);

    // Shoulder it out to the RIGHT by more than a viewport. A transform is used rather than editing the
    // text so nothing about the assertion's subject changes — same element, same content, different box.
    await page.evaluate((fragment) => {
      const quote = [...document.querySelectorAll('.markdown blockquote')].find((el) =>
        el.textContent?.includes(fragment),
      ) as HTMLElement;
      quote.style.transform = 'translateX(600px)';
    }, QUOTE_FRAGMENT);

    const after = await measure();
    // The measurement the real check makes must now be positive — i.e. the real check would fail.
    expect(
      after.rightOfView,
      'the on-screen assertion did not react to the quotation leaving the viewport — it cannot fail, so it proves nothing',
    ).toBeGreaterThan(0);
  });
});
