import { test, expect } from '@playwright/test';

// The hero's control row, in a real viewport (#420).
//
// WHY THIS EXISTS AS A SPEC AND NOT AS A LOOK. The row went from three controls to four, and "three fit a
// phone, four may not" is the class of defect this repo has shipped twice and caught both times by
// opening a browser. A person looking is not a gate: it runs once, on the widths that person thought of,
// and never again.
//
// WHY THE EXISTING CHECKS DO NOT COVER IT, which is the question that decides whether this file earns its
// place. `responsive-overflow.spec.ts` asserts the DOCUMENT never scrolls sideways at a width sweep — and
// it would stay green on the exact failure being guarded here, because `flex-wrap` on the row means a
// control that does not fit moves to a second line rather than widening the page. Overflow is what
// happens when wrapping is unavailable; clipping is what happens when it is. So the property asserted is
// the reader's: every control is fully inside the viewport, whatever line it lands on.
//
// Both editions, because the labels differ in length — "Arquitetura" is longer than "Architecture" is
// not true, but "Portfólio"/"Portfolio" and "Artigos"/"Articles" differ, and the row's total width is
// what wraps. Neither edition is the worst case on every label, so both are measured.
const ROUTES = ['/pt', '/en'];
const WIDTHS = [320, 390, 768, 1280];
const HEIGHT = 900;

/** The row is the last block before the marquee; located by the header it lives in rather than by class,
 *  so a Tailwind change does not silently re-point this at nothing. */
const ROW = 'header#top a[class*="border-border-strong"]';

test.describe('the hero control row', () => {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      test(`${route}: all four controls are inside the viewport at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const controls = await page.locator(ROW).evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return {
              label: el.textContent?.replace('→', '').trim() ?? '',
              left: Math.round(r.left),
              right: Math.round(r.right),
              top: Math.round(r.top),
              width: Math.round(r.width),
            };
          }),
        );

        // The guard that makes the loop mean something: an empty list satisfies every assertion below in
        // silence, and a restyled link is exactly how this locator would stop matching.
        expect(controls.length, 'the hero control row did not resolve — the locator went stale').toBe(4);

        const viewport = await page.evaluate(() => document.documentElement.clientWidth);
        for (const c of controls) {
          expect(c.left, `"${c.label}" is cut off the left edge at ${width}px`).toBeGreaterThanOrEqual(0);
          expect(c.right, `"${c.label}" is cut off the right edge at ${width}px`).toBeLessThanOrEqual(
            viewport,
          );
          // A control that laid out at zero width is "inside the viewport" and unusable.
          expect(c.width, `"${c.label}" collapsed to nothing at ${width}px`).toBeGreaterThan(40);
        }

        // Wrapping is the mechanism that keeps the above true, so it is named rather than assumed: the
        // number of ROWS is reported through the assertion message on failure. It is deliberately not
        // asserted to a value — how many lines the row takes is a layout outcome that may legitimately
        // change, while "the reader can see and press all four" may not.
        const rows = new Set(controls.map((c) => c.top)).size;
        expect(rows, `the row laid out on ${rows} line(s) at ${width}px`).toBeGreaterThan(0);
      });
    }
  }

  // THE MUTATION GUARD. `left >= 0 && right <= viewport` is satisfied by any element that merely exists
  // and is unstyled, which is the shape that stays green both on a healthy page and on one where the
  // mechanism was deleted. So the failure is manufactured: the row is forced not to wrap, which is
  // precisely the change that would break it, and the same measurement is required to go red.
  test('/pt: the containment check goes RED when the row is forbidden to wrap', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: HEIGHT });
    await page.goto('/pt');
    await page.waitForLoadState('networkidle');

    const measure = () =>
      page.evaluate((sel) => {
        const els = [...document.querySelectorAll(sel)];
        const viewport = document.documentElement.clientWidth;
        return Math.max(...els.map((el) => Math.round(el.getBoundingClientRect().right - viewport)));
      }, ROW);

    // Healthy first, so a mutation that "fails" because the page was already broken is not mistaken for a
    // working guard.
    expect(await measure(), 'the row is already clipped before the mutation').toBeLessThanOrEqual(0);

    await page.evaluate((sel) => {
      const row = document.querySelector(sel)!.parentElement as HTMLElement;
      row.style.flexWrap = 'nowrap';
    }, ROW);

    expect(
      await measure(),
      'forbidding the wrap did not push any control past the viewport — the check cannot fail, so it proves nothing',
    ).toBeGreaterThan(0);
  });
});
