import { test, expect } from '@playwright/test';

// The diagram box centres its picture. This was reported from the live page: the layers diagram sat hard
// against the left edge of its frame with all the empty space on the right.
//
// The cause was that `diagram-canvas` — the class Diagram.tsx puts on the box — had NO rule anywhere in
// src/styles. It was a hook somebody named and never used, so nothing centred anything, and mermaid emits
// every SVG with `width="100%"` plus an inline `max-width` in px: a 357px diagram inside a ~920px body
// leaves ~560px, and all of it went to one side.
//
// WHY E2E AND NOT A UNIT TEST, same reason as markdown-table-narrow.spec.ts: the defect is layout. jsdom
// has no layout engine and reports zero-sized rects, so a DOM assertion passes identically in the broken
// and the fixed world. The measurement has to be a real viewport on the built site.
const ROUTES = ['/pt/architecture', '/en/architecture'];
const WIDTHS = [320, 390, 768, 1280];
const HEIGHT = 900;

test.describe('the architecture diagrams are centred in their frame', () => {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      test(`${route}: every diagram is centred at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const boxes = await page.locator('.diagram-canvas').evaluateAll((els) =>
          els.map((el) => {
            const svg = el.querySelector('svg');
            const b = el.getBoundingClientRect();
            const s = svg?.getBoundingClientRect();
            return {
              title: svg?.querySelector('title')?.textContent ?? '(no title)',
              left: s ? s.left - b.left : NaN,
              right: s ? b.right - s.right : NaN,
            };
          }),
        );

        expect(boxes.length, 'no diagram box found — the class name went stale').toBeGreaterThan(0);
        for (const box of boxes) {
          // Slack on both sides, not "left is small": a diagram that fills its box has ~equal padding on
          // both sides too, and that is a pass. The failure this locks in is all the slack on one side —
          // 0 left and hundreds right — so the assertion is the DIFFERENCE. 1px of tolerance for the
          // half-pixel a mermaid viewBox can land on.
          expect(
            Math.abs(box.left - box.right),
            `"${box.title}" is off-centre: ${Math.round(box.left)}px left vs ${Math.round(box.right)}px right`,
          ).toBeLessThanOrEqual(1);
        }
      });
    }
  }

  // The half a centring rule can break, and the reason `margin-inline: auto` was chosen over flex
  // centring: the box is an overflow-x scroller, and centring an OVERFLOWING child with flex puts its left
  // half in the negative scroll area where no reader can reach it. Asserted as the property that holds
  // either way — nothing is clipped off the left edge of the scroller.
  for (const route of ROUTES) {
    test(`${route}: no diagram is clipped off the left of its scroller at 320px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: HEIGHT });
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const overhangs = await page.locator('.diagram-canvas').evaluateAll((els) =>
        els.map((el) => {
          const svg = el.querySelector('svg');
          const b = el.getBoundingClientRect();
          const s = svg?.getBoundingClientRect();
          return s ? Math.round(b.left - s.left) : 0;
        }),
      );

      expect(overhangs.length).toBeGreaterThan(0);
      for (const overhang of overhangs) {
        expect(overhang, `a diagram starts ${overhang}px left of its own scroll box`).toBeLessThanOrEqual(0);
      }
    });
  }
});
