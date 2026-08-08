import { test, expect, type Page } from '@playwright/test';

// Copy-as-markdown, in a real browser (#387).
//
// WHY THIS EXISTS ALONGSIDE THE UNIT TESTS, which already assert the payload's shape against the shipped
// bodies. Three things are only true in a browser and every one of them is a way this ships broken while
// jsdom stays green:
//
//   1. THE CLIPBOARD IS REAL HERE. jsdom has no clipboard; the unit tests stub `navigator.clipboard` and
//      assert on what `writeText` was CALLED WITH. That is the payload under test, not the clipboard —
//      a permissions failure, a non-secure origin or a lost user activation is invisible to it.
//   2. THE PAGE IS THE BUILT, PRERENDERED ONE. The body reaching `ShareButton` travels through the real
//      bundle and the real hydration, not through a direct component render.
//   3. THE MODAL HAS FIVE ROWS NOW. `responsive-overflow.spec.ts` sweeps ten widths and never opens a
//      dialog, so nothing in the suite has ever measured this panel. #159 is closed and is not reopened
//      here — the sweep below is of the OPEN MODAL, which that spec does not and should not cover.
//
// Chromium-only, which is the whole project matrix (`playwright.config.ts`). The Safari user-activation
// rule the payload is built around — `writeText` must be the first thing awaited after the gesture — is
// therefore ARGUED IN THE SOURCE AND NOT COVERED HERE. Stated rather than implied: no browser in this
// suite can fail on it.

const LABELS = {
  pt: { share: 'Compartilhar', copyMarkdown: 'Copiar markdown para a área de transferência' },
  en: { share: 'Share', copyMarkdown: 'Copy markdown to clipboard' },
} as const;

const openModal = async (page: Page, locale: 'pt' | 'en') => {
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: LABELS[locale].share }).click();
  return page.getByRole('dialog');
};

const copyMarkdown = async (page: Page, locale: 'pt' | 'en') => {
  const dialog = await openModal(page, locale);
  await dialog.getByRole('button', { name: LABELS[locale].copyMarkdown }).click();
  // Read what actually landed on the system clipboard — not what the app believes it wrote.
  return page.evaluate(() => navigator.clipboard.readText());
};

test.describe('copying the page as markdown', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('/pt/architecture lands a usable document on the clipboard', async ({ page }) => {
    await page.goto('/pt/architecture');
    const text = await copyMarkdown(page, 'pt');

    // The two generated lines, in order — the title a reader will quote and the citation they will follow.
    expect(text).toMatch(/^# /);
    expect(text).toContain('> Fonte: https://tadeumendonca.io/pt/architecture');
    // CLEAN. Every other share URL on this site is UTM-tagged; this one is a citation and is not.
    expect(text).not.toContain('utm_');

    // The three payload defects, checked against the served build rather than against a fixture.
    expect(text).not.toContain('adr-index');
    expect(text).toContain('https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr)');
    expect(text).not.toMatch(/\]\(\/(?!\/)/);
    // …and what must SURVIVE. A transform that dropped every fence would satisfy the line above while
    // silently gutting the diagrams a reader can render straight on GitHub.
    expect(text).toContain('```mermaid');

    // It is the whole article, not a stub. The threshold is deliberately far below the real size (the
    // page is tens of kB) — this is a "did the body arrive at all" guard, not a byte count to maintain.
    expect(text.length).toBeGreaterThan(5000);
  });

  test('/en/ramp-up copies the RESOLVED body, with links that work off-site', async ({ page }) => {
    await page.goto('/en/ramp-up');
    const text = await copyMarkdown(page, 'en');

    // The token the page resolves before render. Reading the raw import instead puts this literal in
    // someone's notes, and it is the defect that made "just copy the string" not quite the whole feature.
    expect(text).not.toContain('{{years}}');
    expect(text).toMatch(/\d+\+ years/);

    // The site's one root-relative markdown link, absolute and in the reader's own edition.
    expect(text).toContain('[Library](https://tadeumendonca.io/en/library)');
    expect(text).not.toContain('](/library)');
    // External links are untouched on the way past.
    expect(text).toContain('https://www.oreilly.com/library/view/');
  });

  test('an article copies with its own canonical URL and no frontmatter', async ({ page }) => {
    await page.goto('/pt');
    await page.waitForLoadState('networkidle');
    // Reach an article the way a reader does, so the slug is whatever ships rather than one pinned here —
    // a hard-coded slug in an E2E is a test that goes red when an article is renamed, not when it breaks.
    const article = page.locator('a[href^="/pt/blog/"]').first();
    await expect(article).toBeVisible();
    await article.click();
    await page.waitForURL(/\/pt\/blog\/.+/);

    const text = await copyMarkdown(page, 'pt');
    const url = new URL(page.url());
    expect(text).toContain(`> Fonte: https://tadeumendonca.io${url.pathname}`);
    // `content.ts` strips the frontmatter before anything sees the body, and the raw glob is never
    // exported — so no `slug:`/`date:`/`track:` can reach the clipboard. Asserted rather than assumed:
    // it is the one class of leak that would be invisible on the page itself.
    expect(text).not.toMatch(/^---$/m);
    expect(text).not.toMatch(/^(slug|date|track|hasVideo|og_image):/m);
  });
});

// THE FIFTH ROW IS A LAYOUT CHANGE, and the modal is the one surface the width sweep cannot see because
// it only exists after a click. Narrow widths only — that is where a taller panel with a longer label has
// anywhere to go wrong.
test.describe('the five-option modal at narrow widths', () => {
  for (const width of [320, 390, 768]) {
    test(`fits and stays reachable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('/pt/architecture');
      const dialog = await openModal(page, 'pt');

      // No sideways scroll with the dialog open — the same property #159 closed for the page, asserted
      // for the surface that spec never opens.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `the open modal overflows by ${overflow}px at ${width}px wide`).toBeLessThanOrEqual(0);

      // The new row is on screen, not pushed below the fold of a panel that outgrew the viewport.
      const markdown = dialog.getByRole('button', { name: LABELS.pt.copyMarkdown });
      await expect(markdown).toBeVisible();
      const box = await markdown.boundingBox();
      expect(box, 'the markdown row has no box').not.toBeNull();
      expect(box!.y + box!.height).toBeLessThanOrEqual(700);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    });
  }

  // The focus trap reads its controls live, so a fifth row is enumerated for free — "for free" being a
  // claim about a real browser's sequential focus navigation, which jsdom does not implement at all. The
  // unit test can only assert the wrap; this asserts that Tab actually reaches the new control.
  test('the keyboard reaches the fifth control and the trap still wraps', async ({ page }) => {
    await page.goto('/pt/architecture');
    const dialog = await openModal(page, 'pt');

    const markdown = dialog.getByRole('button', { name: LABELS.pt.copyMarkdown });
    // Six controls: close · WhatsApp · X · LinkedIn · copy link · copy markdown. Focus opens on the
    // first, so five Tabs land on the last.
    for (let i = 0; i < 5; i += 1) await page.keyboard.press('Tab');
    await expect(markdown).toBeFocused();

    // One more wraps back to the first rather than escaping to the browser chrome.
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Fechar' })).toBeFocused();
  });
});
