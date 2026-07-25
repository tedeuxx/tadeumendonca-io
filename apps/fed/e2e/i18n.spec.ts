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

// Nav labels per locale — the visible chrome. The profile label localizes (Profile/Perfil), so it is
// also a locale discriminator now (unlike the old "CV", which was identical in both).
const NAV = {
  en: { articles: 'Articles', portfolio: 'Portfolio', contact: 'Contact', profile: 'Profile' },
  pt: { articles: 'Artigos', portfolio: 'Portfólio', contact: 'Contato', profile: 'Perfil' },
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
      await expect(nav.getByRole('link', { name: NAV.en.profile, exact: true })).toBeVisible();
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
      await expect(nav.getByRole('link', { name: NAV.pt.profile, exact: true })).toBeVisible();
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
      await page.goto('/me');
      await expect(page.getByRole('heading', { level: 1, name: CV_NAME })).toBeVisible();
      // Prose is Portuguese.
      await expect(page.getByText(/\d+\+ anos em SDLC/)).toBeVisible();
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
      await page.goto('/me');
      await expect(page.getByRole('heading', { level: 1, name: CV_NAME })).toBeVisible();
      await expect(page.getByText(/\d+\+ years across SDLC/)).toBeVisible();
      await expect(page.getByText(OFFICIAL_ROLE)).toBeVisible();
      // Section chrome flips to English: "Experience" label and the "Present" marker.
      await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();
      await expect(page.getByText(/–\s*Present/)).toBeVisible();
    });
  });

  test.describe('the toggle switches the CV itself', () => {
    test.use({ locale: 'en-US' });

    test('flipping to PT re-renders the CV in Portuguese', async ({ page }) => {
      await page.goto('/me');
      await expect(page.getByText(/\d+\+ years across SDLC/)).toBeVisible();
      await page.getByRole('button', { name: 'PT', exact: true }).click();
      await expect(page.getByText(/\d+\+ anos em SDLC/)).toBeVisible();
      await expect(page.getByText(OFFICIAL_ROLE)).toBeVisible();
    });
  });
});

// Criterion: LONG-FORM content follows the locale too — the parity rule. Everything the reader reads is
// authored in both languages, so the ramp-up page's markdown BODY flips with the chrome, not just the
// labels around it. Each journey asserts both halves: the target language is present AND the other is
// absent — a fallback that rendered both, or the wrong file, would pass a one-sided check.
test.describe('i18n — long-form content follows the locale', () => {
  test.describe('pt-BR context', () => {
    test.use({ locale: 'pt-BR' });

    test('serves the Portuguese edition of the ramp-up page', async ({ page }) => {
      await page.goto('/ramp-up');
      await expect(page.getByRole('heading', { name: /Primeiro, acerte a categoria/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Get the category right first/ })).toHaveCount(0);
    });
  });

  test.describe('en-US context', () => {
    test.use({ locale: 'en-US' });

    test('serves the English edition of the ramp-up page', async ({ page }) => {
      await page.goto('/ramp-up');
      await expect(page.getByRole('heading', { name: /Get the category right first/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Primeiro, acerte a categoria/ })).toHaveCount(0);
    });
  });

  test.describe('the toggle switches the body, not only the chrome', () => {
    test.use({ locale: 'en-US' });

    test('flipping to PT re-renders the long-form body in Portuguese', async ({ page }) => {
      await page.goto('/ramp-up');
      await expect(page.getByRole('heading', { name: /Get the category right first/ })).toBeVisible();
      await page.getByRole('button', { name: 'PT', exact: true }).click();
      await expect(page.getByRole('heading', { name: /Primeiro, acerte a categoria/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Get the category right first/ })).toHaveCount(0);
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

// Criterion (#83): the BLOG article body follows the locale — the blog is now bilingual, one markdown
// file per locale (<slug>.pt.md / <slug>.en.md), resolved by lib/content.ts against the active locale.
// This is the blog counterpart of the ramp-up long-form test above, on the deep-linked /blog/:slug route.
// The journey loads one article and toggles PT↔EN, asserting three things at once:
//   (1) the prose flips — the title AND a section heading render in the other language;
//   (2) no prose leak — a distinctive body phrase of the hidden edition is absent (a fallback that
//       rendered both files, or the wrong one, would pass a one-sided "target present" check);
//   (3) the FACTS are shared, not translated — the tag, the article's ISO date, and the slug/URL are
//       authored once and MUST NOT change across the toggle. Note the date's *rendered* text localizes
//       its format (asserted in the dates block above), so the stable fact is the machine-readable
//       `<time datetime>` ISO, not the human string — that is what "the date does not change" means here.
test.describe('i18n — the blog article body follows the locale', () => {
  const SLUG = 'building-serverless-on-aws';
  const DATE_ISO = '2026-07-22T19:00:00.000Z'; // the shared fact, authored once across both editions

  // English is the canonical edition and the prerender baseline, so an en-US context lands on it.
  test.use({ locale: 'en-US' });

  test('toggling PT↔EN re-renders the article body, keeps the facts, and never leaks the other language', async ({
    page,
  }) => {
    await page.goto(`/blog/${SLUG}`);

    // --- English edition (detected) ---
    await expect(page.getByRole('heading', { level: 1, name: /I retired my own site's backend/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /What serverless solves/ })).toBeVisible();
    // No pt prose leaked into the English edition.
    await expect(page.getByText(/dívida sem receita/)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Aposentei o backend/ })).toHaveCount(0);

    // Facts, captured on the English edition: tag, the ISO date, and the slug/URL.
    await expect(page.getByText(/#aws/)).toBeVisible();
    await expect(page.locator('time')).toHaveAttribute('datetime', DATE_ISO);
    await expect(page).toHaveURL(new RegExp(`/blog/${SLUG}$`));

    // --- Toggle to Portuguese: the body must flip, not just the chrome ---
    await page.getByRole('button', { name: 'PT', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Aposentei o backend/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /O que serverless resolve/ })).toBeVisible();
    // No en prose leaked into the Portuguese edition.
    await expect(page.getByText(/debt with no revenue/)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /I retired my own site's backend/ })).toHaveCount(0);

    // The facts are unchanged by the toggle — same tag, same ISO date, same slug/URL.
    await expect(page.getByText(/#aws/)).toBeVisible();
    await expect(page.locator('time')).toHaveAttribute('datetime', DATE_ISO);
    await expect(page).toHaveURL(new RegExp(`/blog/${SLUG}$`));

    // --- Round-trip back to English: the English edition returns ---
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: /I retired my own site's backend/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Aposentei o backend/ })).toHaveCount(0);
  });
});
