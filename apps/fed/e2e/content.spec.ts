import { test, expect } from '@playwright/test';

// Pinned to pt-BR chrome: the detail header ("Blog") and share control are chrome that localizes under
// the i18n layer (ADR-0032). The article title/body come from markdown-in-repo (pt-BR content) and are
// locale-independent; pinning the context keeps the chrome assertion deterministic under the new default.
test.use({ locale: 'pt-BR' });

// Public journey — a blog article (rendered from markdown-in-repo) with a share affordance.
test.describe('content detail', () => {
  test('opens an article by slug, renders its markdown, and offers a share control', async ({ page }) => {
    await page.goto('/blog/building-serverless-on-aws');
    // The detail header reads "Blog".
    await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Aposentei o backend/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'A pergunta que decidiu' })).toBeVisible(); // markdown body rendered
    // Share is chrome (share.share): pt-BR renders "Compartilhar" under the pinned locale.
    await expect(page.getByRole('button', { name: 'Compartilhar' })).toBeVisible();
  });
});
