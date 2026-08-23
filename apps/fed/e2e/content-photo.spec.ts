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

// THE PORTRAIT CAP, MEASURED IN A REAL CASCADE.
//
// WHY THIS EXISTS AND WHY IT IS HERE RATHER THAN IN `PhotoFigure.test.tsx`. The cap shipped twice and
// worked neither time. `PhotoFigure` emitted `max-w-md`, then `max-w-[224px]` when the owner asked for
// half — and the badge went on laying out at the full 922px column both times, because
// `styles/index.css` carried `.markdown img { max-width: 100% }`, specificity (0,1,1), which beats every
// Tailwind utility (0,1,0) on an image inside a body. The class was in the markup the whole time.
//
// So the unit test could not have caught it: jsdom has no cascade, and asserting `className` contains
// `max-w-[224px]` is exactly as true in the broken world as in the fixed one. And the spec above could
// not either — it only visits /architecture, whose photographs are landscape and are SUPPOSED to fill the
// column, so the one route where the cap is load-bearing was the one route never measured.
//
// What is asserted is therefore the COMPUTED BOX, on the article, at a width where the column (922px at
// 1280) is wider than the cap and the two are a long way apart. A regression that puts specificity back
// in front of the utility turns this red on the first run instead of shipping a third full-width badge.
//
// THE NUMBER HAS MOVED TWICE — 224 → 448 (#493) → 730 — AND THE CHECK HAS NOT CHANGED SHAPE, which is
// the point of having written it this way. 224 was half of a value DECLARED in the CSS that had never
// applied. 448 was the largest cap that did not upscale a 450×540 file — and that file was 450px wide
// only because #492 scaled its own 730×876 crop down for no reason the crop required, so every cap
// argument since has been bounded by a decode rather than by a decision. The file is now re-encoded at
// the crop's native 730×876, and 730 is both the file's width and the cap. The assertion is re-pointed,
// not rewritten: what it measures is exactly what would have caught the two silent no-ops.
const ARTICLE_ROUTES = ['/pt/blog/da-cloud-a-ia-com-o-mesmo-cracha', '/en/blog/from-cloud-to-ai-same-badge'];
const PORTRAIT_CAP = 730;

test.describe('the portrait photograph in an article body', () => {
  for (const route of ARTICLE_ROUTES) {
    test(`${route}: is capped at ${PORTRAIT_CAP}px and centred, in a column wider than that`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: HEIGHT });
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await loadEveryPhotograph(page);

      const seen = await page.locator('figure[data-photo] img').evaluateAll((els) =>
        els.map((el) => {
          const img = el as HTMLImageElement;
          const box = img.getBoundingClientRect();
          const column = img.closest('figure')!.getBoundingClientRect();
          return {
            src: img.getAttribute('src') ?? '(no src)',
            width: Math.round(box.width),
            height: Math.round(box.height),
            columnWidth: Math.round(column.width),
            loaded: img.naturalWidth > 0,
            // The CONTENT box. The cap is a border-box number and the figure wears a 1px border, so the
            // ratio has to be checked on the box the border is not part of — otherwise the expectation is
            // off by the border width and the test fails on a perfectly good picture.
            contentWidth: img.clientWidth,
            contentHeight: img.clientHeight,
            // The two the reservation depends on, read back off the element rather than off the registry.
            attrWidth: Number(img.getAttribute('width')),
            attrHeight: Number(img.getAttribute('height')),
            // Distance from each side of the figure to the image — equal means centred.
            gapLeft: Math.round(box.left - column.left),
            gapRight: Math.round(column.right - box.right),
          };
        }),
      );

      // The guard that makes the loop mean something: no figure passes a `for` in silence, and this
      // article having exactly one photograph is itself the thing being relied on.
      expect(seen.length, 'the article has no photograph — the data-photo hook went stale').toBe(1);
      const fig = seen[0];

      expect(fig.loaded, `${fig.src} did not decode — the file is missing or corrupt`).toBe(true);
      // The premise: without a column WIDER than the cap, a capped image and an uncapped one are the same
      // measurement and this test proves nothing.
      //
      // IT IS KEYED ON THE MEASURED COLUMN NOW, NOT ON A MULTIPLE OF THE CAP, and the multiple had to go
      // rather than be retuned. It was `* 2` at a 224 cap and `* 1.5` at 448; at 730 the same expression
      // reads 1095, and the reading column is NOT a constant and is nowhere near that — measured on this
      // same article it is 922px at 1280, 938px at 1024 and 896px at 1920. Any factor above ~1.22 is now
      // false at every width the page has, so the guard would fail a healthy page while reporting "the
      // check is vacuous" — a falsifier that fires on the wrong thing, which is worse than none.
      //
      // What the premise actually needs is that the two measurements DIFFER, and the honest form of that
      // is the strict inequality plus the numbers it was checked against: at the pinned 1280 the column
      // is 922 and the cap is 730, so an uncapped badge would measure 922 and a capped one 730 — 192px
      // apart, and the `toBe(PORTRAIT_CAP)` below is what tells the two apart.
      //
      // WHERE IT WOULD LEGITIMATELY GO RED, since a premise that can never fire is its own kind of
      // nothing: the column is 938 at 1024, 922 at 1280 and 896 at 1920 — all above the cap — but 703 at
      // 768 and 354 at 390, where the cap is INERT and a capped badge and an uncapped one really are the
      // same measurement. Move the pinned viewport below ~800 and this guard fires, and it would be
      // telling the truth. That is the difference from the multiplier it replaces, which fired at 1920 on
      // a page where the cap was working perfectly.
      expect(fig.columnWidth, 'the body column is not wider than the cap — the check is vacuous').toBeGreaterThan(
        PORTRAIT_CAP,
      );
      expect(fig.width, `${fig.src} is not capped — it laid out at ${fig.width}px`).toBe(PORTRAIT_CAP);
      // The height follows the file's own ratio rather than the declared height, which is what `h-auto`
      // is for: drop it and the `height` attribute wins and the badge lays out squashed. One pixel of
      // slack for subpixel rounding — a squash misses by a hundred, so the tolerance costs nothing.
      const expectedHeight = (fig.contentWidth * fig.attrHeight) / fig.attrWidth;
      expect(
        Math.abs(fig.contentHeight - expectedHeight),
        `${fig.src} laid out ${fig.contentWidth}×${fig.contentHeight}, not the file's own ${fig.attrWidth}×${fig.attrHeight} ratio`,
      ).toBeLessThanOrEqual(1);
      // Portrait, from the element the reader actually got — if the file is ever recropped to landscape
      // this says so instead of quietly asserting the wrong branch.
      expect(fig.attrHeight, 'the article photograph is not portrait any more').toBeGreaterThan(fig.attrWidth);
      // Centred in the column, not left-aligned against it.
      expect(Math.abs(fig.gapLeft - fig.gapRight), 'the capped photograph is not centred').toBeLessThanOrEqual(1);
    });
  }
});
