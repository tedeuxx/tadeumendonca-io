import { test, expect, type Page } from '@playwright/test';

// The funnel events (#597), asserted AGAINST THE BUILT SITE rather than against a mock — which is what
// acceptance criterion 2 asks for and is the only way this suite can say the real components emit.
//
// The harness this rides on already existed and is worth naming, because the tempting shortcut is to
// stub gtag and call the criterion met: CI's build step sets a TEST measurement id
// (`VITE_GA_MEASUREMENT_ID: G-TEST00000000`, `.github/workflows/app.yml`), and `consent.spec.ts`
// established the pattern of aborting every request to Google. So the REAL `loadAnalytics` runs, the
// REAL gtag shim is installed, and the assertions read `window.dataLayer` — the queue gtag.js would
// consume — while not one byte reaches Google.
//
// THE SHARE AND CONTACT DESTINATIONS ARE ABORTED TOO. Three of the five contact channels share a
// hostname with a share destination, so these journeys click links that would otherwise leave the site
// (and, in a `_blank` tab, reach LinkedIn and X from CI). Aborting them keeps the run hermetic and
// costs nothing: the event is emitted on the click, before anything navigates.
test.use({ locale: 'en-US' });

const ARTICLE = '/en/blog/my-commitment';

/** Every `gtag('event', …)` the page has queued, flattened out of the `arguments` objects gtag.js
 *  requires (see `lib/analytics` for why the queue holds those rather than Arrays). */
async function events(page: Page): Promise<{ name: string; params: Record<string, unknown> }[]> {
  return page.evaluate(() =>
    (window.dataLayer ?? [])
      .map((entry) => Array.from(entry as ArrayLike<unknown>))
      .filter((args) => args[0] === 'event')
      .map((args) => ({ name: args[1] as string, params: (args[2] ?? {}) as Record<string, unknown> })),
  );
}

const named = async (page: Page, name: string) => (await events(page)).filter((event) => event.name === name);

const banner = (page: Page) => page.getByRole('region', { name: 'Cookie notice' });

async function accept(page: Page) {
  await banner(page).getByRole('button', { name: 'Accept' }).click();
  await expect(banner(page)).toHaveCount(0);
}

/** Scroll the article in steps, so the intermediate blocks actually enter the viewport. A single jump
 *  to the bottom is the LEAP the hook is built to reject, and it is asserted as such below. */
async function scrollThrough(page: Page) {
  const steps = 14;
  for (let i = 1; i <= steps; i += 1) {
    await page.evaluate((fraction) => {
      window.scrollTo(0, document.body.scrollHeight * fraction);
    }, i / steps);
    await page.waitForTimeout(150);
  }
}

test.beforeEach(async ({ context }) => {
  await context.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
  await context.route(/linkedin\.com|x\.com|wa\.me|github\.com/, (route) => route.abort());
});

test.describe('funnel events', () => {
  // THE CONSENT GATE, end to end. This is the property the whole slice widens the blast radius of: five
  // more events now ride on it, and one of them is a click through to the reader's own LinkedIn.
  test('emits nothing at all before the reader accepts', async ({ page }) => {
    await page.goto(ARTICLE);
    await expect(banner(page)).toBeVisible();

    await page.getByRole('link', { name: 'LinkedIn: My Commitment' }).first().click();
    await scrollThrough(page);

    expect(await events(page)).toEqual([]);
  });

  test('a share from the footer block emits share_complete with its target', async ({ page }) => {
    await page.goto(ARTICLE);
    await accept(page);

    await page.getByRole('link', { name: 'LinkedIn: My Commitment' }).first().click();

    await expect.poll(() => named(page, 'share_complete')).toEqual([
      { name: 'share_complete', params: { locale: 'en', target: 'linkedin' } },
    ]);
    // THE COLLISION, asserted on the built site: a share to LinkedIn is not a contact click. The two
    // destinations differ only in their path, so a hostname-based classifier would report this as the
    // career funnel's terminal event and both numbers would still look plausible.
    expect(await named(page, 'contact_click')).toEqual([]);
  });

  test('a share from the modal emits share_complete for a clipboard destination', async ({ page }) => {
    await page.goto(ARTICLE);
    await accept(page);

    await page.getByRole('button', { name: 'Share' }).click();
    await page.getByRole('dialog').getByText('Copy link to clipboard').click();

    await expect.poll(() => named(page, 'share_complete')).toEqual([
      { name: 'share_complete', params: { locale: 'en', target: 'copy-link' } },
    ]);
  });

  test('a click on a contact channel emits contact_click with its target', async ({ page }) => {
    await page.goto('/en');
    await accept(page);

    await page.getByRole('link', { name: 'LinkedIn', exact: true }).first().click();

    await expect.poll(() => named(page, 'contact_click')).toEqual([
      { name: 'contact_click', params: { locale: 'en', target: 'linkedin' } },
    ]);
    expect(await named(page, 'share_complete')).toEqual([]);
  });

  // The two article events, from a REAL scroll through a REAL article. The floor is derived from this
  // piece's own length (~390 words → ~23s at the implausibility bound), so the poll waits rather than
  // sleeping a hard-coded number that would go stale the day the article is edited.
  test('scrolling through an article emits article_progress and then article_end_reached', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(ARTICLE);
    await accept(page);

    await scrollThrough(page);

    const percents = async () => (await named(page, 'article_progress')).map((event) => event.params.percent);
    await expect.poll(percents).toEqual([25, 50, 75]);

    // The end is on screen and the reader stays there; the hook re-checks when the dwell floor elapses.
    await expect
      .poll(() => named(page, 'article_end_reached'), { timeout: 90_000, intervals: [2_000] })
      .toEqual([{ name: 'article_end_reached', params: { locale: 'en', slug: 'my-commitment' } }]);
  });

  // THE LEAP. End key: the last block enters the viewport and the middle blocks never do — the journey
  // document-100% cannot tell apart from a read, and the reason the intermediate event exists at all.
  //
  // IT RUNS ON THE LONGEST ARTICLE THIS SITE HAS, and that choice is a finding rather than a detail.
  // Written first against `my-commitment`, it FAILED, correctly: that piece is about one and a half
  // viewports tall, so the first screen holds its 25% block and the last screen holds its 75% one. An
  // End press there genuinely puts every block on screen, and calling it a leap would have been the
  // test lying rather than the code. A milestone condition can only discriminate on a page with a
  // middle, so the assertion is made where a middle exists — and the honest reading is that on a very
  // short article the dwell floor is the only guard left.
  //
  // WHAT THIS ISOLATES, stated exactly. The PRIMARY assertion is that the skipped middle milestone
  // never fires in a real browser; nothing but the mechanism produces that. The absence of
  // `article_end_reached` is SECONDARY and is not isolated — this article's floor is about four
  // minutes, so the floor is unmet here too and either condition alone would satisfy it. The condition
  // that blocks the terminal event on a missing milestone ALONE is pinned in
  // `useArticleProgress.test.tsx` ("does NOT emit when only the shallow milestone was met before the
  // jump"), where the clock can be moved rather than waited out.
  // AND IT RUNS UNDER `prefers-reduced-motion: reduce`, which is the second finding and the sharper
  // one. This site sets `html { scroll-behavior: smooth }` for everyone else (`styles/index.css`), so
  // an End press ANIMATES to the bottom and every block genuinely passes through the viewport — the
  // milestones all fire, and no observer-based condition can see a leap that never happened. Under
  // `reduce` the same stylesheet resets `scroll-behavior: auto`, the jump is instant, and the middle is
  // skipped for real. So the milestone condition is a NARROW guard on this site rather than the main
  // one; the dwell floor is what carries the discrimination for the majority of readers. That is
  // recorded on the hook and asserted here in the configuration where it applies.
  test('jumping to the end skips the middle milestone and reports no read', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en/blog/blast-radius-supernova');
    await accept(page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3_000);

    const percents = (await named(page, 'article_progress')).map((event) => event.params.percent);
    expect(percents).not.toContain(50);
    expect(await named(page, 'article_end_reached')).toEqual([]);
  });
});
