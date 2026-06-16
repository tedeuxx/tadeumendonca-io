import { test, expect } from '@playwright/test';

// Public journeys — content detail pages (blog article + feed post) and the share affordance.
test.describe('content detail', () => {
  test('opens an article (blog) by slug, renders its markdown, and offers a share control', async ({ page }) => {
    await page.goto('/blog/building-serverless-on-aws');
    // The detail header reads "Blog" (not "Artigo") — the article surface is labelled Blog.
    await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Building Serverless on AWS' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why serverless' })).toBeVisible(); // markdown body rendered
    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible(); // articles are shareable too
  });

  test('a post detail page shows the post and a share control', async ({ page }) => {
    await page.goto('/posts/welcome');
    await expect(page.getByText('Hello from the feed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible(); // ShareButton (aria-label "Share")
  });

  test('an article short link /p/<code> redirects to the canonical /blog/<slug>', async ({ page }) => {
    await page.goto('/p/demoart'); // seeded article short code
    await expect(page).toHaveURL(/\/blog\/building-serverless-on-aws$/);
    await expect(page.getByRole('heading', { name: 'Building Serverless on AWS' })).toBeVisible();
  });
});
