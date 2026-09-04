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
  pt: {
    share: 'Compartilhar',
    copyLink: 'Copiar link para a área de transferência',
    copyMarkdown: 'Copiar markdown para a área de transferência',
  },
  en: { share: 'Share', copyLink: 'Copy link to clipboard', copyMarkdown: 'Copy markdown to clipboard' },
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

    // The payload defects, checked against the served build rather than against a fixture.
    //
    // THE `adr-index` FENCE IS GONE FROM THIS PAGE. The owner cut the rendered 48-row table; the section
    // now argues why the record exists, states the count, and links the library. So the assertion that
    // used to pin the generated `[Índice de decisões (ADRs), no repositório](…)` substitution was pinning
    // a substitution with no input left, and would have reddened on correct output. The generated link is
    // still exercised on synthetic input in `shareMarkdown.test.ts`.
    expect(text).not.toContain('adr-index');
    // What the reader must still be able to follow: the library itself, from the section's own prose.
    expect(text).toContain('https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/README.md');
    // No root-relative LINK target survives. Scoped to links rather than to every `](/…)`, because an
    // image is deliberately left as authored (the renderer does not localize one either) — a blanket
    // assertion here would go red the day someone writes `![x](/og-default.png)`, for behaviour this
    // slice chose on purpose.
    expect(text).not.toMatch(/(^|[^!])\[[^\]]*\]\(\/(?!\/)/m);
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
    //
    // THE FENCE CHECK MATCHES A FENCE *FOLLOWED BY A KEY*, which is what frontmatter is and what a
    // horizontal rule can never be. The old form was a bare `/^---$/m`, and it could not tell the two
    // apart — it went red the first time a published article carried an `<hr>`. Measured rather than
    // hypothetical: this test picks `.first()` deliberately unpinned and the landing sorts newest-first,
    // so publishing `three-agent-loops-one-month` moved the subject onto the first article whose body
    // has a real rule (line 209, both editions). The DETECTING assertion is the one below and it passed
    // throughout — no key leaked at any point. Fixing that failure by editing the prose would have
    // deleted an authored element to satisfy a check that was never about it.
    //
    // Both assertions are kept because they fail on different things: this one on the BLOCK arriving
    // intact, the next on a key arriving loose. Neither subsumes the other.
    expect(text).not.toMatch(/^---\r?\n[A-Za-z_]+:/m);
    expect(text).not.toMatch(/^(slug|date|track|hasVideo|og_image):/m);
  });
});

// THE FIFTH ROW IS A LAYOUT CHANGE, and the modal is the one surface the width sweep cannot see because
// it only exists after a click. Narrow widths only — that is where a taller panel with a longer label has
// anywhere to go wrong.
test.describe('the five-option modal at narrow widths', () => {
  // 375 is in the sweep on purpose: it is the width the pt labels were observed stacking to two lines
  // each. The reorder changes no label, so it cannot change what wraps — but it changes what sits at the
  // bottom of a taller panel, which is the part that could push a row below the fold.
  for (const width of [320, 375, 390, 768]) {
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

      // BOTH ENDS OF THE LIST are checked, because the reorder moved which row is at risk. The markdown
      // row is now second from the top and WhatsApp is last, so a panel that outgrows the viewport now
      // clips a DESTINATION rather than the new control — asserting only the new row would have gone
      // blind to the fold exactly when the order changed.
      for (const [what, locator] of [
        ['the markdown row', dialog.getByRole('button', { name: LABELS.pt.copyMarkdown })],
        ['the last destination', dialog.getByRole('link', { name: /Compartilhar no WhatsApp/ })],
      ] as const) {
        await expect(locator).toBeVisible();
        const box = await locator.boundingBox();
        expect(box, `${what} has no box`).not.toBeNull();
        expect(box!.y, `${what} is above the viewport at ${width}px`).toBeGreaterThanOrEqual(0);
        expect(box!.y + box!.height, `${what} is below the fold at ${width}px`).toBeLessThanOrEqual(700);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
    });
  }

  // THE BACKDROP DARKENS THE PAGE RATHER THAN LIGHTENING IT (#387), measured as COMPUTED COLOUR rather
  // than asserted as a class name — a class assertion is a restatement of the source and would pass on a
  // token whose value had been inverted underneath it.
  //
  // The defect this locks out: `bg-foreground/70` washed a near-black page to 70% warm off-white, so the
  // dialog read as a white sheet even though its panel was already the site's own near-black.
  test('the backdrop darkens the page, and the panel still separates by its border', async ({ page }) => {
    await page.goto('/pt/architecture');
    const dialog = await openModal(page, 'pt');

    const colours = await dialog.evaluate((panel) => {
      const backdrop = panel.parentElement!;
      const panelStyle = getComputedStyle(panel);
      return {
        backdrop: getComputedStyle(backdrop).backgroundColor,
        panel: panelStyle.backgroundColor,
        border: panelStyle.borderTopColor,
        borderWidth: parseFloat(panelStyle.borderTopWidth),
      };
    });
    const channels = (colour: string) => (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const alpha = (colour: string) => {
      const parts = (colour.match(/[\d.]+/g) ?? []).map(Number);
      return parts.length > 3 ? parts[3] : 1;
    };

    // Dark. Under the old value these were ~245 each.
    for (const channel of channels(colours.backdrop)) {
      expect(channel, `the backdrop is ${colours.backdrop} — it should darken, not lighten`).toBeLessThanOrEqual(40);
    }
    // Still a SCRIM: translucent, so the reader keeps their place on the page behind it. Fully opaque
    // would be a page transition rather than a dialog, and this is what would catch that.
    expect(alpha(colours.backdrop)).toBeLessThan(1);

    // THE ELEVATION CUE. A near-black panel on a near-black scrim is legible only because the border is
    // the site's off-white, 2px. ADR-0008 forbids a shadow, so this is the whole separation mechanism and
    // it is asserted rather than assumed.
    for (const channel of channels(colours.panel)) expect(channel).toBeLessThanOrEqual(40);
    for (const channel of channels(colours.border)) {
      expect(channel, `the panel border is ${colours.border} — it is the only separation cue`).toBeGreaterThanOrEqual(200);
    }
    expect(colours.borderWidth).toBeGreaterThanOrEqual(2);
  });

  // THE OWNER-SPECIFIED ORDER, WALKED WITH THE KEYBOARD (#387). The unit test pins DOM order; this pins
  // the order focus actually moves in, which is a different claim and the one a keyboard reader
  // experiences. jsdom implements no sequential focus navigation at all, so it cannot make it.
  //
  // Every step is asserted rather than only the destination: tabbing five times and checking where you
  // landed passes on any permutation of the four rows in between.
  test('the keyboard walks the options in the specified order and wraps', async ({ page }) => {
    await page.goto('/pt/architecture');
    const dialog = await openModal(page, 'pt');

    const sequence = [
      dialog.getByRole('button', { name: 'Fechar' }),
      dialog.getByRole('button', { name: LABELS.pt.copyLink, exact: true }),
      dialog.getByRole('button', { name: LABELS.pt.copyMarkdown, exact: true }),
      dialog.getByRole('link', { name: /Compartilhar no LinkedIn/ }),
      dialog.getByRole('link', { name: /Compartilhar no X/ }),
      dialog.getByRole('link', { name: /Compartilhar no WhatsApp/ }),
    ];

    // Focus opens on the first control; each Tab advances one row.
    await expect(sequence[0]).toBeFocused();
    for (let i = 1; i < sequence.length; i += 1) {
      await page.keyboard.press('Tab');
      await expect(sequence[i]).toBeFocused();
    }

    // One more wraps back to the first rather than escaping to the browser chrome.
    await page.keyboard.press('Tab');
    await expect(sequence[0]).toBeFocused();
  });
});
