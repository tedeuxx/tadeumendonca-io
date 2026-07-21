import { test, expect } from '@playwright/test';

// Public journey — a blog article (rendered from markdown-in-repo) with a share affordance.
test.describe('content detail', () => {
  test('opens an article by slug, renders its markdown, and offers a share control', async ({ page }) => {
    await page.goto('/blog/building-serverless-on-aws');
    // The detail header reads "Blog".
    await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Building Serverless on AWS' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why serverless' })).toBeVisible(); // markdown body rendered
    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
  });
});
