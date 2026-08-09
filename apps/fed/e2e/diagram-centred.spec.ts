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
              // Is the scroller actually engaged? Asked as `scrollWidth > clientWidth` and NOT by
              // comparing the SVG's width to the box's rect, which was the first version and was wrong
              // by exactly the padding: `getBoundingClientRect()` is the BORDER box, so a figure
              // overflowing the CONTENT area by 11px looked like it fitted, and then failed the centring
              // assertion it had been let through to. Every mermaid SVG carries `width="100%"` and can
              // never engage this; the three-pillar figure has a deliberate `min-width` floor and does.
              overflows: el.scrollWidth > el.clientWidth + 1,
              scrollLeft: el.scrollLeft,
              // Border + padding. `getBoundingClientRect()` measures from the BORDER edge while a child
              // is laid out from the CONTENT edge, so the two differ by exactly this — 17px here, and
              // the assertion below was off by precisely that amount until it was subtracted rather
              // than guessed at.
              inset: el.clientLeft + parseFloat(getComputedStyle(el).paddingLeft),
            };
          }),
        );

        expect(boxes.length, 'no diagram box found — the class name went stale').toBeGreaterThan(0);
        for (const box of boxes) {
          if (box.overflows) {
            // AN OVERFLOWING DIAGRAM CANNOT BE CENTRED, so the property becomes REACHABILITY — and the
            // distinction is the whole reason `margin-inline: auto` was chosen over flex centring, which
            // puts an overflowing child's left half in the negative scroll area where nothing can reach
            // it.
            //
            // The falsifiable form of "reachable" is that whatever is hidden to the left is hidden
            // BECAUSE the box is scrolled, and by exactly that much. Flex centring produces the opposite
            // signature — content off the left while `scrollLeft` is 0 — and fails here.
            //
            // Note this is no longer "starts at the origin": the three-pillar figure deliberately opens
            // scrolled to its intersection, so its left edge IS off-box and that is correct.
            expect(
              Math.round(box.left + box.scrollLeft - box.inset),
              `"${box.title}" hides ${Math.round(box.inset - box.left)}px on the left while scrolled ${Math.round(box.scrollLeft)}px — the difference is unreachable`,
            ).toBe(0);
            continue;
          }
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

  // WHAT THE READER ACTUALLY LANDS ON WHEN THE FIGURE DOES NOT FIT.
  //
  // This is the assertion that was missing, and its absence let a real defect ship green: the
  // three-pillar figure carries a `min-width` floor so it stays legible, and at 390px the box shows 352
  // of 712px. Arriving at scrollLeft 0, the reader saw one circle, four bullets, and the intersection
  // label — which carries the figure's ENTIRE claim — cut mid-word at 390 and off-screen entirely at
  // 320. Every check passed: the overflow branch above asks only that nothing sits left of the origin,
  // and the geometry unit test works in viewBox units where the label is perfectly centred.
  //
  // So the property is stated in the READER's coordinates rather than the drawing's: the label's box lies
  // inside the box the reader can see. Asserted at the two widths where it can fail and one where it
  // cannot.
  for (const route of ROUTES) {
    for (const width of [320, 390, 1280]) {
      test(`${route}: the intersection label is on screen at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const seen = await page.locator('.diagram-canvas').evaluateAll((els) => {
          // Located by its own content rather than by index, so adding a figure above does not silently
          // re-point this at a different one — a coupling `architecture-diagrams.test.mjs` already
          // records having paid for once.
          const box = els.find((el) =>
            [...el.querySelectorAll('text')].some((t) => t.textContent === '(Agent) Harness'),
          );
          if (!box) return null;
          const label = [...box.querySelectorAll('text')].find(
            (t) => t.textContent === '(Agent) Harness',
          )!;
          const b = box.getBoundingClientRect();
          const l = label.getBoundingClientRect();
          return {
            pannable: box.hasAttribute('data-pannable'),
            overflow: box.scrollWidth - box.clientWidth,
            leftOfView: Math.round(b.left - l.left),
            rightOfView: Math.round(l.right - b.right),
          };
        });

        expect(seen, 'the three-pillar figure was not found on this page').not.toBeNull();
        expect(seen!.leftOfView, 'the intersection label is cut off the left edge').toBeLessThanOrEqual(0);
        expect(seen!.rightOfView, 'the intersection label is cut off the right edge').toBeLessThanOrEqual(0);
        // The affordance is on exactly when it is needed and off when it is not — a permanent shadow
        // would be decoration, and decoration that says "scroll me" on a box that cannot is a lie.
        expect(seen!.pannable, 'data-pannable must track whether the box really scrolls').toBe(
          seen!.overflow > 0,
        );
      });
    }
  }

  // The same property AFTER a resize, which is the branch the initial placement does not cover: a reader
  // who loads on a desktop-width window and narrows it — or rotates a phone — crosses the fits/does-not-
  // fit boundary with the effect already run. Without the ResizeObserver the figure would sit at
  // scrollLeft 0 in exactly the state the test above exists to forbid.
  test('/pt/architecture: the intersection label survives a resize into phone width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: HEIGHT });
    await page.goto('/pt/architecture');
    await page.waitForLoadState('networkidle');

    await page.setViewportSize({ width: 390, height: HEIGHT });
    // The observer fires on the next frame, not synchronously.
    await page.waitForTimeout(200);

    const seen = await page.locator('.diagram-canvas').evaluateAll((els) => {
      const box = els.find((el) =>
        [...el.querySelectorAll('text')].some((t) => t.textContent === '(Agent) Harness'),
      );
      if (!box) return null;
      const label = [...box.querySelectorAll('text')].find((t) => t.textContent === '(Agent) Harness')!;
      const b = box.getBoundingClientRect();
      const l = label.getBoundingClientRect();
      return {
        pannable: box.hasAttribute('data-pannable'),
        leftOfView: Math.round(b.left - l.left),
        rightOfView: Math.round(l.right - b.right),
      };
    });

    expect(seen).not.toBeNull();
    expect(seen!.pannable, 'narrowing must turn the pan affordance on').toBe(true);
    expect(seen!.leftOfView, 'the label is cut off the left after a resize').toBeLessThanOrEqual(0);
    expect(seen!.rightOfView, 'the label is cut off the right after a resize').toBeLessThanOrEqual(0);
  });

  // The half a centring rule can break, and the reason `margin-inline: auto` was chosen over flex
  // centring: the box is an overflow-x scroller, and centring an OVERFLOWING child with flex puts its
  // left half in the negative scroll area where no reader can reach it.
  //
  // REWRITTEN when the three-pillar figure started opening at a non-zero scroll. The old form —
  // "nothing sits left of the box" — encoded a premise that is now deliberately false: that figure lands
  // centred on its intersection, so content IS off the left, and it is off the left because the box is
  // scrolled there. Asserting the old shape would have forced a choice between this check and the
  // reader's first impression, and the reader wins that every time.
  //
  // So the property is stated the way it was always meant: every pixel is REACHABLE. What is hidden on
  // the left equals `scrollLeft` exactly — scroll it back and it is there. Flex centring produces the
  // signature this still rejects: content off the left while `scrollLeft` is 0, unreachable at any
  // scroll position.
  for (const route of ROUTES) {
    test(`${route}: nothing sits left of what a scroll can reach, at 320px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: HEIGHT });
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const unreachable = await page.locator('.diagram-canvas').evaluateAll((els) =>
        els.map((el) => {
          const svg = el.querySelector('svg');
          const b = el.getBoundingClientRect();
          const s = svg?.getBoundingClientRect();
          if (!s) return { title: '(no svg)', px: 0 };
          return {
            title: svg?.querySelector('title')?.textContent ?? '(no title)',
            // Hidden on the left, minus how far the box is scrolled. Zero when every hidden pixel is
            // hidden by scrolling; positive when it is hidden by layout, which is the unreachable case.
            px: Math.round(b.left - s.left - el.scrollLeft),
          };
        }),
      );

      expect(unreachable.length).toBeGreaterThan(0);
      for (const box of unreachable) {
        expect(
          box.px,
          `"${box.title}" hides ${box.px}px on the left that no scroll position can reveal`,
        ).toBeLessThanOrEqual(0);
      }
    });
  }
});
