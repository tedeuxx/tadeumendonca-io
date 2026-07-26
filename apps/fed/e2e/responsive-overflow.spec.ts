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
// 320px is intentionally EXCLUDED: a separate, pre-existing ~4px overhang there (vw `--gutter` vs the
// shell's `border-x-2`) is tracked in #160. Widen this sweep to include 320 when #160 lands.
test.use({ locale: 'pt-BR' });

const WIDTHS = [360, 390, 414, 640, 768, 834, 900, 1024, 1280];
const ROUTES = ['/', '/ramp-up', '/me', '/portfolio', '/architecture'];
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
});
