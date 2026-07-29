import { test, expect } from '@playwright/test';

// Horizontal-overflow regression guard (#159). The page body must NEVER scroll sideways — on a fixed-
// canvas brutalist layout a horizontal scrollbar is a visible defect. This is the exact check that found
// the bug: at a sweep of viewport widths, on every public route, assert the document is no wider than the
// viewport (`scrollWidth <= innerWidth`).
//
// The bug it locks in: the desktop nav used to switch on at `md` (768px) while the full row needs ~880px,
// so 768–880px overflowed by up to +92px AND wrapped the nav links to two lines. Raising the switch to
// `lg` fixed it (AppShell.tsx). pt-BR is pinned deliberately — the Portuguese nav labels are longer, so it
// is the worst case for the nav row width; if it fits in pt it fits in en.
//
// 320px (iPhone SE class) is now IN the sweep — #160 landed. That overhang was NOT the `--gutter`/`border-x-2`
// interaction the issue hypothesised (at 320px the `clamp` is already pinned to its 1rem floor, so no vw is in
// play): the portfolio ProjectCard's MIN-CONTENT was 306px inside a 284px column, because the repo name is one
// unbreakable token — and a grid item never shrinks below min-content. See the comment in PortfolioSection.tsx.
test.use({ locale: 'pt-BR' });

const WIDTHS = [320, 360, 390, 414, 640, 768, 834, 900, 1024, 1280];
// Per-locale URLs (ADR-0036): drive the pt-prefixed pages directly (pt is the worst case for nav width).
const ROUTES = ['/pt', '/pt/ramp-up', '/pt/me', '/pt/portfolio', '/pt/architecture'];
const HEIGHT = 900;

test.describe('no horizontal overflow at any width', () => {
  for (const route of ROUTES) {
    test(`${route} never scrolls sideways across the width sweep`, async ({ page }) => {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(route);
        // Let fluid clamps / fonts settle before measuring.
        await page.waitForLoadState('networkidle');
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${route} overflows by ${overflow}px at ${width}px wide`).toBeLessThanOrEqual(0);
      }
    });
  }

  // The sweep above drives pt-BR readers on /pt routes — precisely where the locale offer (#172) stays
  // silent, so it never measured the notice at all. The offer only appears on the OTHER locale's routes,
  // and it is the widest piece of chrome the site has: two uppercase mono buttons with letter-spacing,
  // `shrink-0`, beside a sentence. "CONTINUAR EM INGLÊS" next to "LER EM PORTUGUÊS" at 320px is the worst
  // case, and no existing assertion could reach it.
  test('the locale offer does not overflow at the narrowest width', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: HEIGHT });
    await page.goto('/en/me/');
    await expect(page.getByRole('region', { name: 'Sugestão de idioma' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `the locale offer overflows by ${overflow}px at 320px wide`).toBeLessThanOrEqual(0);
  });
});
