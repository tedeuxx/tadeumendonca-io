import { test, expect } from '@playwright/test';

// i18n journeys (ADR-0032). The site is bilingual via a light in-repo locale layer: it auto-detects the
// visitor's native browser language (navigator.language → pt | en, fallback en), a persisted PT/EN nav
// toggle overrides detection, <html lang> tracks the locale (pt-BR | en), and dates follow the locale.
// The CV *content* (profile.ts) is authored bilingually and follows the locale; English stays the
// canonical edition and the facts are shared between editions (ADR-0024 amendment).
//
// These are journey-level checks against the real rendered DOM: chrome strings come from src/i18n/messages.ts,
// the toggle is the role="group" of PT/EN buttons in AppShell.tsx (aria-pressed marks the active locale).
// Playwright drives navigator.language/Accept-Language via test.use({ locale }), which is exactly the
// detection signal detectLocale() reads. The prerendered baseline is pinned to English, so a fresh context
// starts on the English snapshot and the client re-resolves to the detected locale after hydration — every
// assertion below is web-first (auto-retrying) to ride out that settle.

// Nav labels per locale — the visible chrome. 'CV' is intentionally identical in both (it is a label,
// not a translated word), so it is not a useful discriminator and is asserted only for presence.
const NAV = {
  en: { articles: 'Articles', portfolio: 'Portfolio', contact: 'Contact' },
  pt: { articles: 'Artigos', portfolio: 'Portfólio', contact: 'Contato' },
};

test.describe('i18n — auto-detect + <html lang>', () => {
  // Criterion: Auto-detect EN — an en-US context loads / → English chrome + document.lang === 'en'.
  test.describe('en-US context', () => {
    test.use({ locale: 'en-US' });

    test('auto-detects English chrome and sets <html lang> to en', async ({ page }) => {
      await page.goto('/');
      const nav = page.getByRole('navigation');
      await expect(nav.getByRole('link', { name: NAV.en.articles })).toBeVisible();
      await expect(nav.getByRole('link', { name: NAV.en.portfolio })).toBeVisible();
      await expect(nav.getByRole('link', { name: NAV.en.contact })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'CV', exact: true })).toBeVisible();
      // pt-BR chrome must NOT be present — proves detection actually flipped the tree, not a lax match.
      await expect(nav.getByRole('link', { name: NAV.pt.articles })).toHaveCount(0);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
  });

  // Criterion: Auto-detect PT — a pt-BR context loads / → pt-BR chrome + document.lang === 'pt-BR'.
  test.describe('pt-BR context', () => {
    test.use({ locale: 'pt-BR' });

    test('auto-detects pt-BR chrome and sets <html lang> to pt-BR', async ({ page }) => {
      await page.goto('/');
      const nav = page.getByRole('navigation');
      await expect(nav.getByRole('link', { name: NAV.pt.articles })).toBeVisible();
      await expect(nav.getByRole('link', { name: NAV.pt.portfolio })).toBeVisible();
      await expect(nav.getByRole('link', { name: NAV.pt.contact })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'CV', exact: true })).toBeVisible();
      await expect(nav.getByRole('link', { name: NAV.en.articles })).toHaveCount(0);
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    });
  });
});

// Criterion: Toggle switches + persists + overrides — in a pt-BR context the nav EN toggle flips chrome to
// English and <html lang> to 'en'; a reload keeps English (the localStorage override beats pt detection);
// toggling PT restores pt-BR.
test.describe('i18n — the PT/EN toggle', () => {
  test.use({ locale: 'pt-BR' });

  test('toggling EN switches the chrome, persists across reload, and overrides pt detection', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');
    const enBtn = page.getByRole('button', { name: 'EN', exact: true });
    const ptBtn = page.getByRole('button', { name: 'PT', exact: true });

    // Baseline: detection put us in pt-BR, and PT is the active (pressed) toggle.
    await expect(nav.getByRole('link', { name: NAV.pt.articles })).toBeVisible();
    await expect(ptBtn).toHaveAttribute('aria-pressed', 'true');

    // Switch to English.
    await enBtn.click();
    await expect(nav.getByRole('link', { name: NAV.en.articles })).toBeVisible();
    await expect(nav.getByRole('link', { name: NAV.pt.articles })).toHaveCount(0);
    await expect(enBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Reload: still English even though the browser context is pt-BR — the persisted override wins over detection.
    await page.reload();
    await expect(nav.getByRole('link', { name: NAV.en.articles })).toBeVisible();
    await expect(nav.getByRole('link', { name: NAV.pt.articles })).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Toggle back to PT.
    await page.getByRole('button', { name: 'PT', exact: true }).click();
    await expect(nav.getByRole('link', { name: NAV.pt.articles })).toBeVisible();
    await expect(page.getByRole('button', { name: 'PT', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  });
});

// Criterion: the CV CONTENT localizes with the chrome — a pt visitor gets a Portuguese CV, an English
// visitor an English one (ADR-0024 amendment; closes ADR-0032's Slice 3). What does NOT flip are the
// facts: the name, the official job titles, the employers and the dates are authored once and shared, so
// each journey asserts both halves — the prose changed AND the facts did not.
test.describe('i18n — the CV content follows the locale', () => {
  const CV_NAME = 'Luiz Tadeu Mendonça';
  const OFFICIAL_ROLE = 'Senior Cloud Application Architect'; // an official title — English in both

  test.describe('pt-BR context', () => {
    test.use({ locale: 'pt-BR' });

    test('renders a Portuguese CV, with the facts unchanged', async ({ page }) => {
      await page.goto('/cv');
      await expect(page.getByRole('heading', { level: 1, name: CV_NAME })).toBeVisible();
      // Prose is Portuguese.
      await expect(page.getByText(/17 anos em SDLC/)).toBeVisible();
      // Facts are shared, not translated.
      await expect(page.getByText(OFFICIAL_ROLE)).toBeVisible();
      // Section chrome is pt-BR: the "Experiência" label and the ongoing-role "Atual" marker.
      await expect(page.getByRole('heading', { name: 'Experiência' })).toBeVisible();
      await expect(page.getByText(/–\s*Atual/)).toBeVisible();
    });
  });

  test.describe('en-US context', () => {
    test.use({ locale: 'en-US' });

    test('renders an English CV, with the same facts', async ({ page }) => {
      await page.goto('/cv');
      await expect(page.getByRole('heading', { level: 1, name: CV_NAME })).toBeVisible();
      await expect(page.getByText(/17y across SDLC/)).toBeVisible();
      await expect(page.getByText(OFFICIAL_ROLE)).toBeVisible();
      // Section chrome flips to English: "Experience" label and the "Present" marker.
      await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();
      await expect(page.getByText(/–\s*Present/)).toBeVisible();
    });
  });

  test.describe('the toggle switches the CV itself', () => {
    test.use({ locale: 'en-US' });

    test('flipping to PT re-renders the CV in Portuguese', async ({ page }) => {
      await page.goto('/cv');
      await expect(page.getByText(/17y across SDLC/)).toBeVisible();
      await page.getByRole('button', { name: 'PT', exact: true }).click();
      await expect(page.getByText(/17 anos em SDLC/)).toBeVisible();
      await expect(page.getByText(OFFICIAL_ROLE)).toBeVisible();
    });
  });
});

// Criterion: Dates follow the locale — an article date on the landing renders in the active locale's format.
// The format is `toLocaleDateString(dateLocale, { year:'numeric', month:'short', day:'numeric' })`:
//   en-US → "Jul 22, 2026" (comma, no "de")   ·   pt-BR → "22 de jul. de 2026" ("de", no comma)
// Asserting the discriminating markers (comma vs. " de ") proves the format differs by context without
// pinning the exact day, which a timezone shift could otherwise perturb.
test.describe('i18n — dates follow the locale', () => {
  test.describe('en-US context', () => {
    test.use({ locale: 'en-US' });

    test('renders the article date in en-US format', async ({ page }) => {
      await page.goto('/');
      const time = page.locator('time').first();
      await expect(time).toHaveText(/,/); // en-US uses a comma before the year
      await expect(time).not.toHaveText(/ de /); // and none of the pt-BR "de" connectors
    });
  });

  test.describe('pt-BR context', () => {
    test.use({ locale: 'pt-BR' });

    test('renders the article date in pt-BR format', async ({ page }) => {
      await page.goto('/');
      const time = page.locator('time').first();
      await expect(time).toHaveText(/ de /); // pt-BR spells the date with "de"
      await expect(time).not.toHaveText(/,/); // and no en-US comma
    });
  });
});
