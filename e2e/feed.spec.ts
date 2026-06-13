import { test, expect } from '@playwright/test';

// Public journey — the home feed. No auth needed; runs against any environment (baseURL from config).
test.describe('feed (home)', () => {
  test('renders the unified feed with seeded content', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible();
    await expect(page.getByText('Hello from the feed')).toBeVisible(); // seeded post
    await expect(page.getByText('Building Serverless on AWS')).toBeVisible(); // seeded article in the feed
  });

  test('navigates to the Blog list', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Blog' }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
  });
});
