import { test, expect } from '@playwright/test';

// Public journeys — the static site (CV landing + portfolio + blog). No auth, no backend.
test.describe('static site', () => {
  test('the landing leads with the CV and the portfolio section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Luiz Tadeu Mendonça' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Portfólio' })).toBeVisible();
  });

  test('navigates to the Blog list from the nav', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Blog' }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
  });

  test('shows the social links widget (xl aside) with a WhatsApp click-to-message link', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 }); // xl+ so the aside renders
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Onde me encontrar' })).toBeVisible();
    const wa = page.getByRole('link', { name: 'WhatsApp' });
    await expect(wa).toHaveAttribute('href', /wa\.me\/5521986619954\?text=/);
  });
});
