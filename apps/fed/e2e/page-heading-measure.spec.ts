import { test, expect, type Page } from '@playwright/test';

// Every page heading runs the full measure of the rule beneath it (#392, extended here).
//
// WHAT THIS FILE IS FOR, AND WHY IT IS NAMED FOR THE PROPERTY RATHER THAN THE COMPONENT. It shipped as
// `markdown-page-heading.spec.ts` and covered `MarkdownPage` alone — the shell behind `/architecture` and
// `/ramp-up`. That is exactly how the defect recurred: the same `max-w-[22ch] text-balance` pair lived in
// TWO more copies of the same header markup (`ArticlePage`, `LibraryPage`), #392 fixed one of the three,
// and the article page kept a squeezed title for six days until the owner reported it from the live site.
// A check scoped to one component cannot see a fourth copy. This one is scoped to the PROPERTY — every
// route whose heading sits over a full-width rule is in the table below — so the next copy fails here
// rather than shipping.
//
// THIS IS MEASURED IN A BROWSER BECAUSE IT IS A LAYOUT CLAIM. jsdom computes no layout, so a unit test can
// only assert which classes are present, which is a restatement of the source rather than a check of it.
// Both halves of the fix are asserted separately below, because each fails in a different way and only one
// of them is visible from the box model.
type Target = { route: string; h1: string };

// `article > header > h1` is the shape `MarkdownPage` and `ArticlePage` share; `LibraryPage` renders the
// identical header inside a `<section>`. The selectors are structural rather than class-based on purpose:
// the classes are the thing under test, so keying the selector off them would make the check circular.
//
// NOTE `ArticlePage` renders a SECOND, earlier `<h1>` — the sticky `ColumnHeader` reading "Blog". A bare
// `document.querySelector('h1')` therefore returns the wrong element on an article route, and its
// `.closest('header')` is null, so the helper would throw rather than measure. That is why every target
// carries an explicit selector instead of inheriting the old file's bare `h1`.
const TARGETS: Target[] = [
  // en `/architecture` first: at 41 characters it is the longest heading that ships, so it is the one that
  // still wraps at the widest clamp and therefore the only one where shipped copy shows `text-balance`.
  { route: '/en/architecture', h1: 'article > header > h1' },
  { route: '/pt/architecture', h1: 'article > header > h1' },
  { route: '/en/ramp-up', h1: 'article > header > h1' },
  { route: '/pt/ramp-up', h1: 'article > header > h1' },
  // The article route, both editions — the defect the owner reported. The PT title is the longer of the
  // two here, which is the reverse of `/architecture` and the reason both editions are driven.
  { route: '/en/blog/from-cloud-to-ai-same-badge', h1: 'article > header > h1' },
  { route: '/pt/blog/da-cloud-a-ia-com-o-mesmo-cracha', h1: 'article > header > h1' },
  // The SHORT-title case, both editions. "My Commitment" / "Meu Compromisso" fit on one line at 1280, so
  // neither `balance` nor `pretty` does anything to them — they are here to prove the fix does not make a
  // two-word heading look wrong, not because they can witness the wrap mode.
  { route: '/en/blog/my-commitment', h1: 'article > header > h1' },
  { route: '/pt/blog/meu-compromisso', h1: 'article > header > h1' },
  // The third copy of the header, found by sweeping every `<h1>` rather than by being reported.
  { route: '/en/library', h1: 'section > header > h1' },
  { route: '/pt/library', h1: 'section > header > h1' },
];

// Every measurement below is FONT-METRIC dependent — a line box is a function of the face laying it out —
// so the face is awaited before any line is read. `networkidle` says the requests finished; it does not say
// the face is applied, and the built CSS is `font-display: swap`, so there is a real window in which layout
// runs on the fallback.
//
// What the face is actually worth here, measured on this build at 1280px on `/en/architecture`: web face
// 900.75px, fallback 880.02px. A 2.3% shift, and both clear the 0.9 threshold below — so on today's copy
// the font state cannot flip an assertion, and removing this await is a silent no-op. It is kept because
// the hazard is real in kind, the guard costs nothing, and that margin is a property of the current
// headings rather than of the check.
//
// An earlier version of this comment cited a 619.8px/900.8px split as evidence for the await. That was
// wrong: on one build, one page load and one font state, toggling `text-wrap` ALONE reproduces exactly
// that pair (balance 619.84px, pretty 900.75px), while toggling the font alone moves it to 880.02px /
// 597.77px. 619.8px is the `text-balance` signature, not a fallback-face signature. How those two readings
// came to be taken for one source state under two font states is not known, and is not guessed at here.
const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
};

const headerBox = (page: Page, sel: string) =>
  page.evaluate((sel) => {
    const h1 = document.querySelector(sel);
    if (!h1) throw new Error(`no element matched ${sel}`);
    const header = h1.closest('header');
    if (!header) throw new Error(`the element matched by ${sel} is not inside a <header>`);
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
  }, sel);

// The widest rendered LINE of the heading, measured off the text node rather than the element. The element
// box is full-measure whenever no max-width caps it — which is exactly why the box check below cannot see
// `text-wrap: balance`: balance leaves the box alone and redistributes the text inside it into even, short
// lines. Range client rects are one per line box, so the max is the longest line actually drawn.
const widestRenderedLine = (page: Page, sel: string) =>
  page.evaluate((sel) => {
    const h1 = document.querySelector(sel);
    if (!h1) throw new Error(`no element matched ${sel}`);
    const range = document.createRange();
    range.selectNodeContents(h1);
    const rects = [...range.getClientRects()];
    if (rects.length === 0) throw new Error(`${sel} rendered no text`);
    return { widest: Math.max(...rects.map((r) => r.width)), lines: rects.length };
  }, sel);

const setHeading = (page: Page, sel: string, text: string) =>
  page.evaluate(
    ({ sel, text }) => {
      const h1 = document.querySelector(sel);
      if (!h1) throw new Error(`no element matched ${sel}`);
      h1.textContent = text;
    },
    { sel, text },
  );

// THE WRAP-MODE PROBE STRING, AND WHY IT IS A FIXED STRING RATHER THAN THE SHIPPED COPY.
//
// A ratio check on the copy that happens to ship is only a `text-balance` detector for SOME strings, and
// which ones is not something the author of a heading knows. Measured at 1280 against the 921.63px measure,
// substituting each candidate and toggling `text-wrap` alone:
//
//   "Architecture — the blueprint, in the open"                    pretty 0.977 · balance 0.673   (2 lines)
//   "From cloud to AI, on the same badge, and the record it left"  pretty 0.917 · balance 0.917   (2 lines)
//   "Da cloud à IA, com o mesmo crachá, e o registro que ficou"     pretty 0.912 · balance 0.912   (2 lines)
//   the 98-char heading used by the overflow sweep below            pretty 0.961 · balance 0.890   (4 lines)
//
// Two lessons, and the second is the one that would have produced a check that verifies nothing. First,
// balance and pretty COINCIDE whenever the natural break already falls near the middle — three of the four
// candidates separate by under half a percent. Second, they converge as the line count rises: at four lines
// the gap is 7 points and closing, because balancing many lines and filling many lines are nearly the same
// layout. So the probe has to sit in the two-line band AND be a string where balance actually redistributes.
// `/architecture`'s own shipped heading is exactly that, is the string #392 measured, and separates by 30
// points — a threshold anywhere in 0.7–0.95 is unambiguous, and 0.9 is the one #392 already published.
const PROBE_HEADING = 'Architecture — the blueprint, in the open';

test.describe('every page heading opens to the rule beneath it', () => {
  // HALF ONE — the `max-w-[22ch]` cap, visible from the box model alone. Copy-independent: it holds
  // whatever the heading says, including the one-line titles where the wrap mode is a no-op.
  for (const { route, h1 } of TARGETS) {
    test(`${route} lets the heading box occupy the full header measure`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(route);
      await settle(page);

      const { h1Width, headerContentWidth } = await headerBox(page, h1);
      // Exact equality up to sub-pixel rounding. This is the assertion `max-w-[22ch]` fails — but only
      // just, and that is the point of it being a 1px tolerance rather than a percentage: at 1280 the cap
      // resolved to 912.38px against a 921.63px measure, 9.25px short. A ratio check loose enough to feel
      // safe would have called that passing. The cap's own peak is ~135px, near a 1024px viewport.
      expect(headerContentWidth).toBeGreaterThan(0);
      expect(
        Math.abs(h1Width - headerContentWidth),
        `the h1 is ${h1Width}px inside a ${headerContentWidth}px header measure`,
      ).toBeLessThanOrEqual(1);
    });
  }

  // HALF TWO — `text-balance`, which the box model cannot see. Driven with the fixed probe string above
  // rather than the shipped title, so the check keeps its discriminating power when the copy changes. That
  // matters concretely: with SHIPPED copy at 1280 the corrected pages measure 97.7% (`/en/architecture`),
  // 91.7% and 86.1% (the two article editions), 91.7% (`/pt/library`) and 80.1% (`/en/library`) — every
  // one of them correct, because a filled line still has to end at a word boundary and those titles have
  // no break point nearer the edge. Four of the five sit below a 0.9 threshold. A threshold loose enough
  // to admit 80.1% would no longer separate any of them from the 56–66% the balanced versions drew. The
  // probe removes the dependency on shipped copy instead of tuning the number down until it admits it.
  //
  // Substituting text in the live DOM is a real probe here precisely because none of these components
  // transforms its heading — each renders the string verbatim, so the string's ORIGIN cannot change how it
  // lays out. What this cannot prove is that such a heading would be authored; it proves the shell fills
  // its measure when handed one.
  for (const { route, h1 } of TARGETS) {
    test(`${route} fills its measure rather than balancing into short even lines`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(route);
      await settle(page);
      await setHeading(page, h1, PROBE_HEADING);

      const { headerContentWidth } = await headerBox(page, h1);
      const { widest, lines } = await widestRenderedLine(page, h1);

      // The probe is calibrated for the two-line band (see PROBE_HEADING). If the measure ever changes
      // enough to take it out of that band, balance and pretty converge and this check goes blind — say so
      // instead of passing.
      expect(
        lines,
        `the probe heading rendered on ${lines} line(s) at this measure — outside the two-line band it was calibrated for, so it can no longer see \`text-balance\``,
      ).toBe(2);
      expect(
        widest / headerContentWidth,
        `the widest line is ${widest}px in a ${headerContentWidth}px measure across ${lines} lines`,
      ).toBeGreaterThan(0.9);
    });
  }

  // The same claim against the copy a reader actually meets, on the one route where shipped copy can still
  // witness it. This is the check the probe above cannot replace: it is the only one that fails if the
  // fix works for substituted text and not for what ships.
  test('the longest shipped heading fills its measure', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en/architecture');
    await settle(page);

    const { headerContentWidth } = await headerBox(page, 'article > header > h1');
    const { widest, lines } = await widestRenderedLine(page, 'article > header > h1');

    // If the shipped heading ever shortens enough to fit on one line, this test can no longer see
    // `text-balance` — say so instead of passing.
    expect(lines, 'the longest shipped heading no longer wraps at 1280px — this check is now blind').toBeGreaterThan(1);
    expect(
      widest / headerContentWidth,
      `the widest line is ${widest}px in a ${headerContentWidth}px measure across ${lines} lines`,
    ).toBeGreaterThan(0.9);
  });

  // EVERY SHIPPED HEADING IS SHORT ENOUGH TO LOOK CORRECT WHATEVER THESE COMPONENTS DO, so the change is
  // additionally driven past them: the heading is replaced with a far longer one and the page is
  // re-measured for horizontal overflow at the same widths `responsive-overflow.spec.ts` sweeps. That
  // regression guard (#159, closed) only ever sees the copy that ships; this sees the copy that might.
  //
  // One route per header COPY, not per route: the three components are what can diverge, and the ten
  // entries above already prove each route resolves to one of them.
  const LONG_HEADING =
    'Architecture — the blueprint in the open, every decision recorded and every trade-off written down';

  const SHELLS: Target[] = [
    { route: '/en/architecture', h1: 'article > header > h1' }, // MarkdownPage
    { route: '/en/blog/from-cloud-to-ai-same-badge', h1: 'article > header > h1' }, // ArticlePage
    { route: '/en/library', h1: 'section > header > h1' }, // LibraryPage
  ];

  for (const { route, h1 } of SHELLS) {
    for (const width of [320, 768, 1280]) {
      test(`a much longer heading on ${route} neither overflows nor breaks the measure at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await settle(page);
        await setHeading(page, h1, LONG_HEADING);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `a long heading overflows by ${overflow}px at ${width}px wide`).toBeLessThanOrEqual(0);

        // And it still tracks the rule rather than spilling past it — the cap is gone, not replaced by an
        // element that outgrows its container.
        const { h1Width, headerContentWidth } = await headerBox(page, h1);
        expect(Math.abs(h1Width - headerContentWidth)).toBeLessThanOrEqual(1);
      });
    }
  }
});
