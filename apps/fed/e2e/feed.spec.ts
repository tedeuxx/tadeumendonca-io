import { test, expect } from '@playwright/test';

// Public journeys — the static site (landing + CV + portfolio + blog). No auth, no backend.
test.describe('static site', () => {
  test('the landing is the content shop window, not the CV', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Artigos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Portfólio' })).toBeVisible();
    // The personal name lives on /cv only.
    await expect(page.getByRole('heading', { level: 1, name: 'Luiz Tadeu Mendonça' })).toHaveCount(0);
  });

  test('navigates to the CV from the nav', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: 'CV', exact: true }).click();
    await expect(page).toHaveURL(/\/cv$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Luiz Tadeu Mendonça' })).toBeVisible();
  });

  test('shows the contact links with a WhatsApp click-to-message link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Onde me encontrar' })).toBeVisible();
    // The aside and the #contato region each carry the link — assert on the aside's copy.
    const wa = page.getByRole('link', { name: 'WhatsApp' }).first();
    await expect(wa).toHaveAttribute('href', /wa\.me\/5521986619954\?text=/);
  });

  test('filters the articles by track without touching the URL', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Vida pessoal' }).click();
    await expect(page.getByRole('tab', { name: 'Vida pessoal' })).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/\/$/); // local state only — the canonical URL never changes
  });

  test('keeps the retired /profile deep-link working by redirecting to /cv', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/cv$/);
  });
});
