import { test, expect, type Page } from '@playwright/test';

// THE DESKTOP BREAKOUT (#464). A figure on /architecture is allowed to be wider than the column its
// prose sits in, above 1024px only. The reason is a measurement, not a preference: every mermaid SVG
// carries `width="100%"` and an inline `max-width` at its natural width, so the render scale — and with
// it the type size, 15px × scale — is decided entirely by how wide the box is. In the article column
// (~890px of canvas) the widest figure renders at 0.48, i.e. ~7.2px of mono type.
//
// WHY E2E AND NOT A UNIT TEST, the same reason as `diagram-centred.spec.ts` and
// `markdown-table-narrow.spec.ts`: the whole change is layout. jsdom reports zero-sized rects, so a DOM
// assertion passes identically in the broken and the fixed world. The rule is also a `min()` over a
// percentage and a `vw`, which only a real viewport resolves.
//
// The three properties, and each one fails on a different mutation:
//   · the figure actually gains width above the breakpoint — fails on today's code (gain 0), which is
//     what makes it worth writing rather than a restatement of the CSS;
//   · it stays inside the shell with real clearance — fails if the 2rem safety inset is dropped or if
//     `--container` drifts from `tailwind.config.js`'s `maxWidth.screen`. This is the half that keeps
//     `responsive-overflow.spec.ts` honest at widths that sweep does not reach (1440, 1600);
//   · below the breakpoint the figure is EXACTLY the column — the only live overflow on this page is
//     the narrow one, and this slice must not touch it.
//
// WHAT THE THIRD ONE CANNOT CATCH, stated because a guard whose reach is assumed is worse than one
// whose reach is known: it does NOT fail on the media query alone. Widening `min-width: 1024px` to 320
// changes nothing measurable, because at phone and tablet widths the CSS arithmetic independently
// floors the bleed to zero — the free space it divides is negative there. Mutation-checked in both
// directions: the query lowered to 320px on its own left all five of these green; lowered to 320px
// TOGETHER with the column term dropped from 64rem to 20rem, the 390px and 768px arms went red at
// +441px. So this arm catches a change that actually produces bleed on a phone, which is the property
// worth holding, and the query is belt to the arithmetic's braces rather than the thing under test.
const ROUTE = '/pt/architecture';
const HEIGHT = 900;

/** Below this the figure must be indistinguishable from before the slice. */
const NARROW = [390, 768];
/** Above it, the figure breaks out. 1600 is past the shell's own 1440px cap, which is its own case. */
const WIDE = [1280, 1440, 1600];

/** The gain the breakout is FOR. At 1280 it measures ~290px; a floor well under that still reds at 0. */
const MIN_GAIN = 200;
/** Clear space between the figure's border and the shell's, per side. */
const MIN_CLEARANCE = 8;

async function measure(page: Page) {
  return page.evaluate(() => {
    // `main` spans the app shell's CONTENT box exactly (the shell is `max-w-screen` + `border-x-2`), so
    // it is the reference for "inside the shell" without reaching for a class name that is a utility
    // string. The prose column is the markdown body, which is the box the figure is laid out in.
    const shell = document.querySelector('main')!.getBoundingClientRect();
    const column = document
      .querySelector('[data-testid="markdown-body"]')!
      .getBoundingClientRect();
    return {
      shell: { left: shell.left, right: shell.right },
      column: column.width,
      figures: [...document.querySelectorAll('figure.diagram')].map((el) => {
        const r = el.getBoundingClientRect();
        const svg = el.querySelector('svg');
        return {
          caption: el.querySelector('figcaption')?.textContent ?? '(no caption)',
          width: r.width,
          left: r.left,
          right: r.right,
          // Reported on failure so the numbers in the PR can be re-derived from a red run.
          svgWidth: svg ? svg.getBoundingClientRect().width : NaN,
        };
      }),
    };
  });
}

test.describe('a diagram may exceed the article column on wide viewports', () => {
  for (const width of WIDE) {
    test(`${ROUTE}: every figure widens past the prose and stays inside the shell at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto(ROUTE);
      await page.waitForLoadState('networkidle');

      const seen = await measure(page);
      expect(seen.figures.length, 'no diagram figure found — the class name went stale').toBeGreaterThan(0);

      for (const fig of seen.figures) {
        expect(
          Math.round(fig.width - seen.column),
          `"${fig.caption}" is ${Math.round(fig.width)}px against a ${Math.round(seen.column)}px column — the breakout bought nothing`,
        ).toBeGreaterThanOrEqual(MIN_GAIN);

        // Both edges, not just the right: the margins are symmetric, so a broken sign would push the
        // figure off the LEFT while the right edge still looked correct.
        expect(
          Math.round(fig.left - seen.shell.left),
          `"${fig.caption}" reaches past the shell's left edge`,
        ).toBeGreaterThanOrEqual(MIN_CLEARANCE);
        expect(
          Math.round(seen.shell.right - fig.right),
          `"${fig.caption}" reaches past the shell's right edge`,
        ).toBeGreaterThanOrEqual(MIN_CLEARANCE);
      }
    });
  }

  for (const width of NARROW) {
    test(`${ROUTE}: the figure is exactly the column at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto(ROUTE);
      await page.waitForLoadState('networkidle');

      const seen = await measure(page);
      expect(seen.figures.length).toBeGreaterThan(0);
      for (const fig of seen.figures) {
        expect(
          Math.round(fig.width - seen.column),
          `"${fig.caption}" is ${Math.round(fig.width - seen.column)}px wider than the column — the breakout leaked below the breakpoint`,
        ).toBe(0);
      }
    });
  }
});
