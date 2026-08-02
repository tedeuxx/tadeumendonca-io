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
    await expect(dialog.getByRole('button', { name: 'Copiar link' })).toBeVisible();

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
});
