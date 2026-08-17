import { test, expect } from '@playwright/test';

// Pinned to pt-BR chrome: the detail header ("Blog") and share control are chrome that localizes under
// the i18n layer (ADR-0032). The article title/body come from markdown-in-repo (pt-BR content) and are
// locale-independent; pinning the context keeps the chrome assertion deterministic under the new default.
test.use({ locale: 'pt-BR' });

// Public journey — a blog article (rendered from markdown-in-repo) with a share affordance.
test.describe('content detail', () => {
  test('opens an article by slug, renders its markdown, and offers a share control', async ({ page }) => {
    await page.goto('/pt/blog/meu-compromisso');
    // The detail header reads "Blog".
    await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Meu Compromisso/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'O compromisso' })).toBeVisible(); // markdown body rendered
    // Share is chrome (share.share): pt-BR renders "Compartilhar" under the pinned locale.
    await expect(page.getByRole('button', { name: 'Compartilhar' })).toBeVisible();
  });

  // #314. The header control now opens a dialog rather than sharing directly, and this is asserted on a
  // REAL article in a REAL browser because the unit tests run in jsdom — where focus, the backdrop and
  // `Escape` all behave, and where a dialog that is rendered but visually covered by nothing would still
  // pass. The modal is also the design system's first, so "it appears at all, on the built page" is a
  // claim only this level makes.
  //
  // Asserted through the KEYBOARD, not the mouse, because that is the path that regresses: the
  // affordance this replaced was a plain button and could not trap anyone.
  test('the header share control opens a dialog, and the keyboard can leave it', async ({ page }) => {
    await page.goto('/pt/blog/meu-compromisso');
    const trigger = page.getByRole('button', { name: 'Compartilhar' });
    await trigger.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Named distinctly from the footer's share nav — an article page carries both, and two identically
    // named regions are indistinguishable to a reader moving by landmark.
    await expect(dialog).toHaveAccessibleName('Opções de compartilhamento');

    // The destinations, on the served page. Not a count alone: a count passes on three links to the
    // wrong article.
    for (const name of [/Compartilhar no WhatsApp/, /Compartilhar no X/, /Compartilhar no LinkedIn/]) {
      await expect(dialog.getByRole('link', { name })).toBeVisible();
    }
    // `exact: true` IS LOAD-BEARING (#387). Playwright matches an accessible name by CASE-INSENSITIVE
    // SUBSTRING by default, so the previous `{ name: 'Copiar link' }` was satisfied by the shipped label,
    // by the longer one that replaced it in the modal, AND by a revert to either — an assertion about
    // published copy that could not go red when the copy changed. `messages.test.ts` asserts
    // non-emptiness, not the literal, so nothing else covered it.
    await expect(
      dialog.getByRole('button', { name: 'Copiar link para a área de transferência', exact: true }),
    ).toBeVisible();
    // The fifth row, pinned exactly here too, so this test sees the modal's whole copy surface.
    await expect(
      dialog.getByRole('button', { name: 'Copiar markdown para a área de transferência', exact: true }),
    ).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    // Focus RETURNS. Without this the reader is dropped at the top of the document after every share,
    // which is the regression a modal introduces and a button never had.
    await expect(trigger).toBeFocused();
  });

  // The share deeplinks (#183), asserted on the SERVED artifact rather than only in the unit test.
  //
  // The defect worth catching here is not "the button is missing" — it is a link that works, opens the
  // right platform, and hands it the wrong URL. That ships silently: nothing looks broken, and the reader
  // only finds out when someone follows it. So the assertion is on the href's contents.
  //
  // Two things it pins that a component test cannot: the URL is absolute against the CANONICAL origin
  // (these anchors are prerendered, so `window.location.origin` would have baked in the preview host),
  // and the pt article carries the pt slug — the editions have different ones (ADR-0037), and a link
  // built from the wrong edition sends a Portuguese reader an English article.
  test('the share deeplinks carry the canonical URL of THIS edition', async ({ request }) => {
    const body = await (await request.get('/pt/blog/meu-compromisso/')).text();
    const encoded = encodeURIComponent('https://tadeumendonca.io/pt/blog/meu-compromisso');

    expect(body).toContain(`https://wa.me/?text=`);
    expect(body).toContain(`linkedin.com/sharing/share-offsite/?url=${encoded}`);
    expect(body).toContain(`x.com/intent/tweet`);
    expect(body).toContain(encoded);

    // Never the other edition's slug, and never a preview origin.
    //
    // Both of these are deliberately loose, because both were written tight and were UNFALSIFIABLE:
    //   - `/en/blog/my-commitment` never appears even when the English slug IS wrongly used, because
    //     `lp()` still prefixes it with the ACTIVE locale — the bug produces `/pt/blog/my-commitment`.
    //     So the assertion has to be on the slug alone, independent of the prefix.
    //   - `wa.me/?text=http…localhost` cannot match, because WhatsApp's single `text` field starts with
    //     the encoded TITLE; the origin appears further in. Anchoring on the parameter's first character
    //     asserted a string shape that never occurs, passing under the mutation it was written for.
    // Each was covered by its positive counterpart above, which is what made the gap invisible: the test
    // was red under both mutations, so nothing pointed at the two assertions doing no work.
    expect(body).not.toContain(encodeURIComponent('/my-commitment'));
    expect(body).not.toContain('localhost');
  });

  // THE FOOTER BLOCK'S ORDER, on the served page (#387). The owner ordered the modal and then extended it
  // here — copy-link first, then LinkedIn, X, WhatsApp — and nothing pinned this block's order before,
  // exactly as nothing pinned the modal's: every assertion checked each platform independently, so any
  // permutation passed. One array comparison, because a partial swap survives a first/last check.
  test('the footer share block leads with copy-link, then the shared destination order', async ({ page }) => {
    await page.goto('/pt/blog/meu-compromisso');
    await page.waitForLoadState('networkidle');

    const nav = page.getByRole('navigation', { name: 'Compartilhar este artigo' });
    const names = await nav
      .locator('a[href], button')
      .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? el.textContent?.trim()));

    expect(names).toEqual([
      'Copiar link',
      'Compartilhar no LinkedIn: Meu Compromisso',
      'Compartilhar no X: Meu Compromisso',
      'Compartilhar no WhatsApp: Meu Compromisso',
    ]);
  });

  // COPY-LINK MOVING TO THE FRONT CHANGES WHAT WRAPS. This is an inline `flex-wrap` row and the article
  // page is NOT in `responsive-overflow.spec.ts`'s sweep — that spec drives six routes and no article —
  // so nothing measured this block at a phone width at all, before or after the move.
  for (const width of [320, 375, 390]) {
    test(`the footer share block fits at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/pt/blog/meu-compromisso');
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `the article overflows by ${overflow}px at ${width}px wide`).toBeLessThanOrEqual(0);

      // Every control is inside the viewport horizontally — a wrapped row is fine, a clipped one is not.
      const nav = page.getByRole('navigation', { name: 'Compartilhar este artigo' });
      const controls = nav.locator('a[href], button');
      const count = await controls.count();
      expect(count).toBe(4);
      for (let i = 0; i < count; i += 1) {
        const box = await controls.nth(i).boundingBox();
        expect(box, `control ${i} has no box`).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width, `control ${i} is clipped at ${width}px`).toBeLessThanOrEqual(width);
      }
    });
  }

  // THE SHARE GROUP NAMES ITS OBJECT CORRECTLY ON THE SERVED BUILD, and this is the copy lens's BLOCKING
  // finding pinned where a screen reader would actually meet it (#450). `/architecture` is a section of
  // this site, not a piece of writing, so its group announces "Compartilhar esta página"; the four live
  // article pages keep "Compartilhar este artigo", which the two tests above already reach through.
  //
  // BOTH LOCALES AND BOTH OBJECT TYPES, as four POSITIVE lookups rather than four absences. `getByRole`
  // with a name fails when nothing matches, so a page that lost the block entirely reds here — an
  // absence assertion would have gone green on exactly that regression. And article-vs-page is checked in
  // one file on purpose: the page name is set by a prop and the article name by the component default, so
  // a change to either that forgets the other cannot leave this file green.
  for (const [locale, pageName, articleName] of [
    ['pt', 'Compartilhar esta página', 'Compartilhar este artigo'],
    ['en', 'Share this page', 'Share this article'],
  ] as const) {
    test(`/${locale}: the share group names a section a page and an article an article`, async ({ page }) => {
      await page.goto(`/${locale}/architecture`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('navigation', { name: pageName })).toBeVisible();

      await page.goto(locale === 'pt' ? '/pt/blog/meu-compromisso' : '/en/blog/my-commitment');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('navigation', { name: articleName })).toBeVisible();
    });
  }
});
