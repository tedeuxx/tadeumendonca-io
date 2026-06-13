import { test, expect } from '@playwright/test';

// Public journeys — content detail pages (blog article + feed post) and the share affordance.
test.describe('content detail', () => {
  test('opens an article (blog) by slug and renders its markdown', async ({ page }) => {
    await page.goto('/blog/building-serverless-on-aws');
    await expect(page.getByRole('heading', { name: 'Building Serverless on AWS' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why serverless' })).toBeVisible(); // markdown body rendered
  });

  test('a post detail page shows the post and a share control', async ({ page }) => {
    await page.goto('/posts/welcome');
    await expect(page.getByText('Hello from the feed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible(); // ShareButton (aria-label "Share")
  });
});
