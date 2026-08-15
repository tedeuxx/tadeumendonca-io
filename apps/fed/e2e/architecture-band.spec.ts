import { test, expect } from '@playwright/test';

// The /architecture band on the landing, in a real viewport (#450).
//
// WHY IT IS NOT COVERED ALREADY. `responsive-overflow.spec.ts` asserts the DOCUMENT never scrolls
// sideways across a width sweep — and it stays green on the exact failure guarded here, because the
// band's control sits in a `flex-wrap` container: a control that does not fit moves or clips rather than
// widening the page. Overflow is what happens when wrapping is unavailable; clipping is what happens when
// it is. Same reasoning `hero-row.spec.ts` records, applied to the block below the hero. `hero-row`
// itself cannot see this one either: its locator is scoped to `header#top`, and the band is a sibling
// section — which is also the assertion that the band did NOT become a fifth hero control.
//
// Both editions, because the heading and the kicker differ in length between them and the heading is the
// widest thing in the band at 320px.
const ROUTES = ['/pt', '/en'];
const WIDTHS = [320, 390, 768, 1280];
const HEIGHT = 900;

const BAND = '[data-testid="architecture-band"]';
const CONTROL = `${BAND} a`;

test.describe('the architecture band', () => {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      test(`${route}: the band control is inside the viewport at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const controls = await page.locator(CONTROL).evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return {
              label: el.textContent?.trim() ?? '',
              href: el.getAttribute('href') ?? '',
              left: Math.round(r.left),
              right: Math.round(r.right),
              width: Math.round(r.width),
            };
          }),
        );

        // An empty list satisfies every assertion below in silence, and a restyled or renamed band is
        // exactly how this locator would stop matching. ONE control, per #315 — the hero row already
        // carries /architecture on this same screen.
        expect(controls.length, 'the band control did not resolve — the locator went stale').toBe(1);

        const [control] = controls;
        const viewport = await page.evaluate(() => document.documentElement.clientWidth);
        expect(control.left, `"${control.label}" is cut off the left edge at ${width}px`).toBeGreaterThanOrEqual(0);
        expect(control.right, `"${control.label}" is cut off the right edge at ${width}px`).toBeLessThanOrEqual(
          viewport,
        );
        // A control that laid out at zero width is "inside the viewport" and unusable.
        expect(control.width, `"${control.label}" collapsed to nothing at ${width}px`).toBeGreaterThan(40);
        expect(control.href).toBe(`${route}/architecture`);
      });
    }
  }

  // The band sits between the hero and the articles, and it did not join the hero row. Both halves are
  // the shape decision itself, so both are measured on the served build rather than only in jsdom.
  test('/pt: sits between the hero and the articles, and adds no fifth hero control', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: HEIGHT });
    await page.goto('/pt');
    await page.waitForLoadState('networkidle');

    expect(await page.locator('header#top a[class*="border-border-strong"]').count()).toBe(4);

    const order = await page.evaluate((sel) => {
      const y = (s: string) => document.querySelector(s)?.getBoundingClientRect().top ?? NaN;
      return { hero: y('header#top'), band: y(sel), articles: y('#artigos') };
    }, BAND);

    expect(Number.isNaN(order.band), 'the band is not on the page').toBe(false);
    expect(order.band).toBeGreaterThan(order.hero);
    expect(order.articles).toBeGreaterThan(order.band);
  });
});
