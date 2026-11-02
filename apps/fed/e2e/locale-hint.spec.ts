import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { LOCALE_OFFER_LABEL } from './locale-offer-labels';

// The CLIENT step that reads the edge's locale hint (#788, slice B2 of #669). Contract: ADR-0036's section
// "The edge exposes a locale hint, never a locale decision". Precedence: path → persisted override →
// edge hint → navigator.languages → English. `locale_hint=pt` resolves step 3 to Portuguese; `other`,
// `unknown`, a missing cookie and any other value resolve nothing and fall through to the browser.
//
// THE SEAM IS THE COOKIE. The suite cannot make CloudFront geolocate it, but it can set the cookie the
// edge would have set, before the first script runs — which is when `detectLocale` reads it.
//
// LOCAL ONLY, except the last block. Against the live apex the edge answers every HTML request with its
// own `Set-Cookie: locale_hint=…`, which replaces an injected value before the page's script runs, so an
// injected `pt` would be measuring the runner's geography instead of the client. The post-deploy smoke
// therefore runs only the coherence check at the bottom, which reads whatever the edge set and asserts
// the client honoured it. Playwright reports the skipped tests as SKIPPED, not passed.
const isLocal = (baseURL: string | undefined) =>
  ['localhost', '127.0.0.1', '[::1]', '::1'].includes(new URL(baseURL!).hostname);

const hint = (context: BrowserContext, baseURL: string | undefined, value: string) =>
  context.addCookies([{ name: 'locale_hint', value, url: baseURL! }]);

const NAV = { en: 'Articles', pt: 'Artigos' };

async function expectEdition(page: Page, locale: 'pt' | 'en') {
  const other = locale === 'pt' ? 'en' : 'pt';
  await expect(page.locator('html')).toHaveAttribute('lang', locale === 'pt' ? 'pt-BR' : 'en');
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: NAV[locale] })).toBeVisible();
  await expect(nav.getByRole('link', { name: NAV[other] })).toHaveCount(0);
}

test.describe('locale hint — an English browser', () => {
  test.use({ locale: 'en-US' });
  test.skip(({ baseURL }) => !isLocal(baseURL), 'the live edge overwrites an injected locale_hint');

  test('hint pt sends the bare root to /pt, above the English browser', async ({ page, context, baseURL }) => {
    await hint(context, baseURL, 'pt');
    await page.goto('/');
    await expect(page).toHaveURL(/\/pt$/);
    await expectEdition(page, 'pt');
  });

  // The control for the test above: identical context, no cookie. Without it, a pt landing could come
  // from something other than the hint.
  test('with no hint the bare root follows the browser to /en', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/en$/);
    await expectEdition(page, 'en');
  });

  for (const value of ['other', 'unknown', 'garbage']) {
    test(`hint ${value} resolves nothing and the browser decides: /en`, async ({ page, context, baseURL }) => {
      await hint(context, baseURL, value);
      await page.goto('/');
      await expect(page).toHaveURL(/\/en$/);
      await expectEdition(page, 'en');
    });
  }

  test('hint pt reaches unprefixed sub-paths and the bare article path', async ({ page, context, baseURL }) => {
    await hint(context, baseURL, 'pt');
    await page.goto('/me');
    await expect(page).toHaveURL(/\/pt\/me$/);
    await page.goto('/blog/my-commitment');
    await expect(page).toHaveURL(/\/pt\/blog\/meu-compromisso$/);
    await expect(page.locator('article h1')).toBeVisible();
  });

  test('a prefixed path wins over hint pt', async ({ page, context, baseURL }) => {
    await hint(context, baseURL, 'pt');
    await page.goto('/en/me');
    await expect(page).toHaveURL(/\/en\/me$/);
    await expectEdition(page, 'en');
  });

  test('a stored English choice wins over hint pt', async ({ page, context, baseURL }) => {
    await hint(context, baseURL, 'pt');
    await page.addInitScript(() => window.localStorage.setItem('locale', 'en'));
    await page.goto('/');
    await expect(page).toHaveURL(/\/en$/);
    await expectEdition(page, 'en');
  });

  test('switching to English after hint pt survives a reload and a new bare visit', async ({
    page,
    context,
    baseURL,
  }) => {
    await hint(context, baseURL, 'pt');
    await page.goto('/');
    await expect(page).toHaveURL(/\/pt$/);
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page).toHaveURL(/\/en$/);
    await page.reload();
    await expectEdition(page, 'en');
    await page.goto('/');
    await expect(page).toHaveURL(/\/en$/);
    await expectEdition(page, 'en');
  });

  // The offer still reads the BROWSER, on purpose (#788 scope item 4): a reader the IP served the wrong
  // language is offered their own, which is what makes a wrong geolocation recoverable.
  test('a reader IP-served Portuguese with an English browser is offered English', async ({
    page,
    context,
    baseURL,
  }) => {
    await hint(context, baseURL, 'pt');
    await page.goto('/');
    await expect(page).toHaveURL(/\/pt$/);
    // The offer speaks the language it offers, so its region carries the English label.
    await expect(page.getByRole('region', { name: LOCALE_OFFER_LABEL.en })).toBeVisible();
  });

  // The prerender is not a visitor (ADR-0036, 2026-07-28): the snapshot browser ignores the hint, so the
  // bare root it captures stays the English x-default page.
  test('the snapshot browser ignores hint pt at the bare root', async ({ page, context, baseURL }) => {
    await hint(context, baseURL, 'pt');
    await page.addInitScript(() => {
      (window as unknown as { __PRERENDER__: boolean }).__PRERENDER__ = true;
    });
    await page.goto('/');
    await expect(page).toHaveURL(/\/en$/);
    await expectEdition(page, 'en');
  });
});

test.describe('locale hint — a Portuguese browser', () => {
  test.use({ locale: 'pt-BR' });
  test.skip(({ baseURL }) => !isLocal(baseURL), 'the live edge overwrites an injected locale_hint');

  test('hint pt sends the bare root to /pt', async ({ page, context, baseURL }) => {
    await hint(context, baseURL, 'pt');
    await page.goto('/');
    await expect(page).toHaveURL(/\/pt$/);
    await expectEdition(page, 'pt');
  });

  // `other` does not mean English: it means "not decided by geography", so the browser still decides.
  test('hint other does not mean English: the browser keeps /pt', async ({ page, context, baseURL }) => {
    await hint(context, baseURL, 'other');
    await page.goto('/');
    await expect(page).toHaveURL(/\/pt$/);
    await expectEdition(page, 'pt');
  });

  test('a stored English choice wins over hint pt and the browser', async ({ page, context, baseURL }) => {
    await hint(context, baseURL, 'pt');
    await page.addInitScript(() => window.localStorage.setItem('locale', 'en'));
    await page.goto('/');
    await expect(page).toHaveURL(/\/en$/);
    await expectEdition(page, 'en');
  });

  test('a prefixed English path wins over hint pt and the browser', async ({ page, context, baseURL }) => {
    await hint(context, baseURL, 'pt');
    await page.goto('/en');
    await expect(page).toHaveURL(/\/en$/);
    await expectEdition(page, 'en');
  });
});

// Runs on EVERY target, the live apex included. Whatever the edge set (or nothing, locally), an English
// browser with no stored choice must land in Portuguese exactly when the cookie says `pt`.
test.describe('locale hint — the client honours what the edge set', () => {
  test.use({ locale: 'en-US' });

  test('the bare root lands on /pt if and only if locale_hint is pt', async ({ page, context }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(pt|en)$/);
    const cookie = (await context.cookies()).find((c) => c.name === 'locale_hint');
    const expected = cookie?.value === 'pt' ? 'pt' : 'en';
    await expect(page).toHaveURL(new RegExp(`/${expected}$`));
    await expectEdition(page, expected);
  });
});
