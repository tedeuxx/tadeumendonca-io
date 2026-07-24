import { test, expect } from '@playwright/test';

// These journeys assert the pt-BR chrome ("Artigos", "Portfólio", "Onde me encontrar", "Vida pessoal").
// With the i18n auto-detect layer (ADR-0032) the DEFAULT (en-US) browser context now renders English
// chrome, which would break these string assertions non-deterministically. Pin the browser context to
// pt-BR so the chrome these tests were written for is explicit and stable. The i18n behaviour itself
// (detect / toggle / persist) is covered in i18n.spec.ts.
test.use({ locale: 'pt-BR' });

// Public journeys — the static site (landing + CV + portfolio + blog). No auth, no backend.
test.describe('static site', () => {
  test('the landing is the content shop window, not the CV', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Artigos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Portfólio' })).toBeVisible();
    // The personal name lives on /me only.
    await expect(page.getByRole('heading', { level: 1, name: 'Luiz Tadeu Mendonça' })).toHaveCount(0);
  });

  test('navigates to the profile from the nav', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: 'Perfil', exact: true }).click();
    await expect(page).toHaveURL(/\/me$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Luiz Tadeu Mendonça' })).toBeVisible();
  });

  test('reaches the ramp-up page from the hero CTA (not only the navbar)', async ({ page }) => {
    await page.goto('/');
    // Scope to the hero (#top) — the navbar also carries a Ramp-up link.
    await page.locator('#top').getByRole('link', { name: 'Ramp-up' }).click();
    await expect(page).toHaveURL(/\/ramp-up$/);
  });

  test('shows the contact links with a WhatsApp click-to-message link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Onde me encontrar' })).toBeVisible();
    // The aside and the #contato region each carry the link — assert on the first (aside) copy.
    const wa = page.getByRole('link', { name: 'WhatsApp' }).first();
    await expect(wa).toHaveAttribute('href', /wa\.me\/5521986619954\?text=/);
    await expect(page.getByRole('link', { name: 'X', exact: true }).first()).toHaveAttribute('href', 'https://x.com/tedeuxx');
  });

  test('filters the articles by track without touching the URL', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Vida pessoal' }).click();
    await expect(page.getByRole('tab', { name: 'Vida pessoal' })).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/\/$/); // local state only — the canonical URL never changes
  });
});
