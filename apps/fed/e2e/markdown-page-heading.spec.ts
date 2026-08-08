import { test, expect, type Page } from '@playwright/test';

// The long-form heading runs the full measure of the rule beneath it (#392). `MarkdownPage` is the shared
// shell for `/architecture` and `/ramp-up`, and its <h1> used to carry `max-w-[22ch] text-balance` while
// the `border-b-2` on the enclosing <header> spanned the container — a narrow title against a wide rule.
//
// THIS IS MEASURED IN A BROWSER BECAUSE IT IS A LAYOUT CLAIM. jsdom computes no layout, so a unit test can
// only assert which classes are present, which is a restatement of the source rather than a check of it.
// Both halves of the fix are asserted separately below, because each fails in a different way and only one
// of them is visible from the box model.
const ROUTES = [
  // en `/architecture` first: at 41 characters it is the longest heading that ships, so it is the one that
  // still wraps at the widest clamp and therefore the only one where `text-balance` was observable.
  '/en/architecture',
  '/pt/architecture',
  '/en/ramp-up',
  '/pt/ramp-up',
];

// Every measurement below is FONT-METRIC dependent, so the web face has to be applied before a line box is
// read. This is not defensive padding — without it the SAME build measured 619.8px and 900.8px for the
// widest line on the same route, because a fallback face breaks the heading at a different word.
// `networkidle` says the requests finished; it does not say the face is in use.
const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
};

const headerBox = (page: Page) =>
  page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (!h1) throw new Error('no <h1> on the page');
    const header = h1.closest('header');
    if (!header) throw new Error('the <h1> is not inside a <header>');
    const style = getComputedStyle(header);
    return {
      h1Width: h1.getBoundingClientRect().width,
      // The rule IS the header's border-bottom, so its drawn length is the header's border-box width.
      // Compare against the header's CONTENT box: that is the width a full-bleed child can occupy, and
      // the padding is symmetric, so a child filling it reaches the rule's own extent.
      headerContentWidth:
        header.getBoundingClientRect().width -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight) -
        parseFloat(style.borderLeftWidth) -
        parseFloat(style.borderRightWidth),
    };
  });

// The widest rendered LINE of the heading, measured off the text node rather than the element. The element
// box is full-measure whenever no max-width caps it — which is exactly why the box check below cannot see
// `text-wrap: balance`: balance leaves the box alone and redistributes the text inside it into even, short
// lines. Range client rects are one per line box, so the max is the longest line actually drawn.
const widestRenderedLine = (page: Page) =>
  page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (!h1) throw new Error('no <h1> on the page');
    const range = document.createRange();
    range.selectNodeContents(h1);
    const rects = [...range.getClientRects()];
    if (rects.length === 0) throw new Error('the <h1> rendered no text');
    return { widest: Math.max(...rects.map((r) => r.width)), lines: rects.length };
  });

test.describe('the long-form heading opens to the rule beneath it', () => {
  for (const route of ROUTES) {
    test(`${route} lets the heading occupy the full header measure`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(route);
      await settle(page);

      const { h1Width, headerContentWidth } = await headerBox(page);
      // Exact equality up to sub-pixel rounding. This is the assertion `max-w-[22ch]` fails — but only
      // just, and that is the point of it being a 1px tolerance rather than a percentage: at 1280 the cap
      // resolved to 912.4px against a 921.6px measure, 9.2px short. A ratio check loose enough to feel
      // safe would have called that passing. The cap's own peak is ~135px, near a 1024px viewport.
      expect(headerContentWidth).toBeGreaterThan(0);
      expect(
        Math.abs(h1Width - headerContentWidth),
        `the h1 is ${h1Width}px inside a ${headerContentWidth}px header measure`,
      ).toBeLessThanOrEqual(1);
    });
  }

  // The `text-balance` half, and it needs a heading that WRAPS — on a one-line heading balance is a no-op
  // and this would pass while asserting nothing. en `/architecture` is the longest that ships and wraps at
  // 1280; the guard below fails loudly rather than silently if that stops being true.
  test('a wrapped heading fills its measure rather than balancing into short even lines', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en/architecture');
    await settle(page);

    const { headerContentWidth } = await headerBox(page);
    const { widest, lines } = await widestRenderedLine(page);

    // If the shipped heading ever shortens enough to fit on one line, this test can no longer see
    // `text-balance` — say so instead of passing.
    expect(lines, 'the longest shipped heading no longer wraps at 1280px — this check is now blind').toBeGreaterThan(1);
    // Balanced lines land near total/lines, i.e. roughly half the measure for a two-line heading. Filling
    // the measure puts the longest line hard against it. 0.9 sits well clear of both.
    expect(
      widest / headerContentWidth,
      `the widest line is ${widest}px in a ${headerContentWidth}px measure across ${lines} lines`,
    ).toBeGreaterThan(0.9);
  });

  // BOTH SHIPPED HEADINGS ARE SHORT ENOUGH TO LOOK CORRECT WHATEVER THIS COMPONENT DOES, so the change is
  // additionally driven past them: the heading is replaced in the DOM with a far longer one and the page is
  // re-measured for horizontal overflow at the same widths `responsive-overflow.spec.ts` sweeps. That
  // regression guard (#159, closed) only ever sees the copy that ships; this sees the copy that might.
  //
  // Substituting text in the live DOM is a real probe here precisely because the component never
  // transforms its heading — it renders the prop verbatim, so the string's ORIGIN cannot change how it
  // lays out. The one thing this cannot prove is that a long heading would be authored; it proves the
  // shell survives one.
  const LONG_HEADING =
    'Architecture — the blueprint in the open, every decision recorded and every trade-off written down';

  for (const width of [320, 768, 1280]) {
    test(`a much longer heading neither overflows nor breaks the measure at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/en/architecture');
      await settle(page);

      await page.evaluate((text) => {
        const h1 = document.querySelector('h1');
        if (!h1) throw new Error('no <h1> on the page');
        h1.textContent = text;
      }, LONG_HEADING);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `a long heading overflows by ${overflow}px at ${width}px wide`).toBeLessThanOrEqual(0);

      // And it still tracks the rule rather than spilling past it — the cap is gone, not replaced by an
      // element that outgrows its container.
      const { h1Width, headerContentWidth } = await headerBox(page);
      expect(Math.abs(h1Width - headerContentWidth)).toBeLessThanOrEqual(1);
    });
  }
});
