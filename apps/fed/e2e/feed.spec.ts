import { test, expect } from '@playwright/test';

// Public journeys. Reframe-first: the landing (/) now leads with the CV + portfolio; the product
// feed moved to /feed. No auth needed; runs against any environment (baseURL from config).
test.describe('landing + feed', () => {
  test('the landing leads with the CV and the portfolio section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Luiz Tadeu Mendonça' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Portfólio' })).toBeVisible();
  });

  test('renders the unified feed with seeded content at /feed', async ({ page }) => {
    await page.goto('/feed');
    await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible();
    await expect(page.getByText('Hello from the feed')).toBeVisible(); // seeded post
    await expect(page.getByText('Building Serverless on AWS')).toBeVisible(); // seeded article in the feed
  });

  test('navigates to the Blog list from the nav', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Blog' }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
  });

  test('navigates to the Feed from the nav', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Feed' }).click();
    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible();
  });

  test('shows the social links widget (xl aside) with a WhatsApp click-to-message link', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 }); // xl+ so the aside renders
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Onde me encontrar' })).toBeVisible();
    const wa = page.getByRole('link', { name: 'WhatsApp' });
    await expect(wa).toHaveAttribute('href', /wa\.me\/5521986619954\?text=/);
  });
});
