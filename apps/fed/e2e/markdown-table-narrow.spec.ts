import { test, expect } from '@playwright/test';

// Markdown tables at phone widths. Enabling GFM made the two `/architecture` tables render, and rendering
// them exposed a second defect that the overflow sweep could NOT see: the page did not scroll sideways,
// because the table shrank to fit instead — and it bought that fit by breaking words mid-token.
//
// `.markdown code` carries `overflow-wrap: anywhere`, added so one long token in a PROSE paragraph could
// not push the page sideways at 320px. Inside a ~58px table column that same rule shreds the identifier:
// `product-lead` rendered as `pro / duct / - / lea / d`, and `quality-assurance` in SIX fragments. On a
// page whose subject is engineering rigor, a shattered identifier reads as a bug shipped without looking.
//
// 390px is the width that matters and the one a 320px-only check misses: at 320 the table already
// overflowed and the container scrolled correctly, but at 390 — most phones — it fit by compressing.
// The fix is `min-width` on the table so it stops shrinking and the scroll container it has actually
// engages; the cells then never need to break a token.
//
// WHY THIS IS AN E2E AND NOT A UNIT TEST: the defect is layout. It only exists once real CSS, real fonts
// and a real viewport are applied to the BUILT site. jsdom has no layout engine, so a unit test asserting
// on the DOM sees a perfectly intact `<code>product-lead</code>` in both the broken and the fixed world.
const ROUTES = ['/pt/architecture', '/en/architecture'];
const NARROW = [320, 390];
const HEIGHT = 900;

test.describe('markdown tables stay legible at phone widths', () => {
  for (const route of ROUTES) {
    for (const width of NARROW) {
      test(`${route}: no identifier is broken across lines at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        // A span that wraps across lines reports one client rect PER LINE. That is the measurement: an
        // identifier rendered whole is exactly one rect. Reading the text would pass in both worlds —
        // `product-lead` is the same string shredded or not, which is precisely why this looked fine.
        const broken = await page.locator('.markdown [data-markdown-table] code').evaluateAll((els) =>
          els
            .map((el) => ({ text: el.textContent ?? '', lines: el.getClientRects().length }))
            .filter((c) => c.lines > 1),
        );

        expect(
          broken,
          `identifiers split across lines: ${broken.map((b) => `${b.text} (${b.lines} lines)`).join(', ')}`,
        ).toEqual([]);
      });

      test(`${route}: the table scrolls instead of compressing at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        // The container earns its keep only if the table is genuinely wider than it. If they are equal the
        // table has shrunk to fit — which is the compression that breaks the words above.
        const wrappers = await page
          .locator('.markdown [data-markdown-table]')
          .evaluateAll((els) => els.map((el) => ({ scroll: el.scrollWidth, client: el.clientWidth })));

        expect(wrappers.length, 'no markdown table wrapper found — the selector went stale').toBeGreaterThan(0);
        for (const w of wrappers) {
          expect(w.scroll, `table did not exceed its container (${w.scroll} vs ${w.client})`).toBeGreaterThan(
            w.client,
          );
        }
      });
    }
  }

  // The other half of the invariant, asserted from the opposite side so the fix cannot be "make the table
  // enormous at every width". On the desktop canvas the table must NOT scroll — it should simply fit.
  for (const route of ROUTES) {
    test(`${route}: the table does not scroll on the desktop canvas`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: HEIGHT });
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const wrappers = await page
        .locator('.markdown .overflow-x-auto')
        .evaluateAll((els) => els.map((el) => el.scrollWidth - el.clientWidth));

      expect(wrappers.length).toBeGreaterThan(0);
      for (const overflow of wrappers) {
        expect(overflow, `the table scrolls at 1280px by ${overflow}px`).toBeLessThanOrEqual(0);
      }
    });
  }
});
