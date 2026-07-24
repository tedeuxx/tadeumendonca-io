import { test, expect, type Page } from '@playwright/test';

// Analytics consent journeys (GA4 opt-in banner). The property under test is the "nothing third-party
// until the reader asks" contract in lib/analytics + lib/consent: gtag.js is injected ONLY after an
// explicit Accept — never before a choice, never after Decline — and the choice persists in
// localStorage so the banner does not reappear on the next visit. The footer "Cookie preferences"
// control re-opens the banner so consent can be withdrawn/redecided.
//
// The banner renders only when a measurement id is configured at BUILD time (VITE_GA_MEASUREMENT_ID).
// CI's build-test.yml Build step sets a TEST id (G-TEST00000000); `npm run e2e:local` wires the same
// test-only default into its rebuild. The real production id is never used here.
//
// Locale is pinned to en-US so the assertions anchor on deterministic English chrome ("Cookie notice",
// Accept/Decline, "Cookie preferences") rather than whatever the headless browser would auto-detect.
//
// CRITICAL — no real network to Google: every request to googletagmanager.com / google-analytics.com is
// aborted, so even with a test id no hit leaves the run. We assert the <script> TAG is present in the DOM
// (JS injected the node), NOT that it loaded — the aborted request never fetches, the node still exists.
test.use({ locale: 'en-US' });

const CONSENT_KEY = 'analytics-consent';

const banner = (page: Page) => page.getByRole('region', { name: 'Cookie notice' });
// The gtag.js loader tag injected by loadAnalytics() — the DOM proof that analytics was turned on.
const gtagScript = (page: Page) => page.locator('script[src*="googletagmanager.com/gtag/js"]');
const storedConsent = (page: Page) =>
  page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY);

test.describe('analytics consent banner', () => {
  // Hard-block Google before any navigation, on the whole context so it also covers reloads and any
  // page opened here. route.abort() means the injected gtag tag's request is refused — asserting the
  // TAG (below) proves injection without a single byte reaching Google.
  test.beforeEach(async ({ context }) => {
    await context.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
  });

  // Journeys 1 + 2: a first-time visitor sees the banner, and nothing third-party has loaded yet.
  test('first visit shows the banner and injects no analytics before a choice', async ({ page }) => {
    await page.goto('/');

    await expect(banner(page)).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Accept' })).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Decline' })).toBeVisible();

    // The gate: no gtag script and no recorded choice until the reader chooses.
    await expect(gtagScript(page)).toHaveCount(0);
    expect(await storedConsent(page)).toBeNull();
  });

  // Journey 3: Decline hides the banner, loads nothing, records 'denied', and stays gone on reload.
  test('Decline hides the banner, injects nothing, and persists the refusal across a reload', async ({ page }) => {
    await page.goto('/');
    await expect(banner(page)).toBeVisible();

    await banner(page).getByRole('button', { name: 'Decline' }).click();

    await expect(banner(page)).toHaveCount(0);
    await expect(gtagScript(page)).toHaveCount(0);
    await expect.poll(() => storedConsent(page)).toBe('denied');

    // Returning: the stored refusal keeps the banner gone and analytics inert.
    await page.reload();
    await expect(banner(page)).toHaveCount(0);
    await expect(gtagScript(page)).toHaveCount(0);
  });

  // Journey 4: Accept hides the banner, injects the gtag tag, records 'granted', and on the next visit
  // the stored grant re-injects gtag on mount (no second click needed) while the banner stays gone.
  test('Accept hides the banner, injects gtag, and re-injects it for a returning granted visitor', async ({ page }) => {
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
    // Precondition made explicit: nothing loaded before the click.
    await expect(gtagScript(page)).toHaveCount(0);

    await banner(page).getByRole('button', { name: 'Accept' }).click();

    await expect(banner(page)).toHaveCount(0);
    await expect(gtagScript(page)).toHaveCount(1);
    await expect.poll(() => storedConsent(page)).toBe('granted');

    // Returning with a stored grant: gtag is injected on mount, the banner does not reappear.
    await page.reload();
    await expect(banner(page)).toHaveCount(0);
    await expect(gtagScript(page)).toHaveCount(1);
  });

  // Journey 5: withdrawal is as reachable as granting — the footer "Cookie preferences" control
  // re-opens the banner after a decision so the reader can re-decide.
  test('the footer Cookie preferences control re-opens the banner after a decision', async ({ page }) => {
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Decline' }).click();
    await expect(banner(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Cookie preferences' }).click();

    // The banner is back, undecided again, so a fresh choice can be made.
    await expect(banner(page)).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Accept' })).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Decline' })).toBeVisible();
  });
});
