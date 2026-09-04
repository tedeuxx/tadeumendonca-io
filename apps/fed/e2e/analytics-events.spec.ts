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

// ===================================================================================================
// SLICE B (#597) — `share_open`, `contact_reach`, `outbound_click`, `nav_click`.
//
// Same harness, same rule: the REAL components on the BUILT, prerendered site, asserted against
// `window.dataLayer`, with every request to Google aborted. Slice A's three defects were each a no-op
// indistinguishable from a pass, and two of them were caught HERE rather than in jsdom — so the
// browser-level assertions below are the ones that carry the properties a unit test cannot reach: a
// real full document load, a section that is genuinely off screen at the top of a real page, and a
// footer link that really does share a hostname with a contact channel.
// ===================================================================================================

test.describe('slice B — nav_click is emitted AT THE CLICK', () => {
  // THE ASSERTION THAT CANNOT SURVIVE THE DEFECT. `/#contato` is a plain anchor, so this click starts a
  // FULL DOCUMENT LOAD and `window.dataLayer` is discarded with the document. The click and the read
  // therefore happen in ONE synchronous evaluate: `.click()` dispatches synchronously, React's handler
  // runs during that dispatch, and the navigation is queued for after the task returns.
  //
  // An implementation that emitted from an effect after navigation returns `[]` here — nothing has been
  // queued yet when the read runs — and the event it eventually emitted on the landing would carry
  // `from: 'home'`, which the second assertion refuses. There is no arrangement of a post-navigation
  // emitter that passes both.
  test('captures from=architecture BEFORE the document load discards the queue', async ({ page }) => {
    await page.goto('/en/architecture');
    await accept(page);

    const captured = await page.evaluate(() => {
      const link = document.querySelector<HTMLAnchorElement>('header nav a[href="/en/#contato"]');
      if (!link) throw new Error('the contact nav anchor was not found — the selector, not the event, is stale');
      link.click();
      return (window.dataLayer ?? [])
        .map((entry) => Array.from(entry as ArrayLike<unknown>))
        .filter((args) => args[0] === 'event' && args[1] === 'nav_click')
        .map((args) => args[2] as Record<string, unknown>);
    });

    expect(captured).toEqual([{ locale: 'en', from: 'architecture', to: 'contact' }]);
    // Said explicitly because it is the whole point: `home` is what a post-navigation emitter would
    // report for this journey, and it is the value the owner ruled the event exists to avoid.
    expect(captured[0].from).not.toBe('home');
  });

  // A route link — client-side, so nothing is discarded and the event can be read normally afterwards.
  // `from` is still the ORIGIN, which is what distinguishes a click-time emitter from a location-time
  // one on this branch too.
  test('reports the origin, not the destination, for a client-side route link', async ({ page }) => {
    await page.goto('/en/me');
    await accept(page);

    await page.getByRole('link', { name: 'Library', exact: true }).click();
    await expect(page).toHaveURL(/\/en\/library$/);

    await expect.poll(() => named(page, 'nav_click')).toEqual([
      { name: 'nav_click', params: { locale: 'en', from: 'me', to: 'library' } },
    ]);
  });
});

test.describe('slice B — contact_reach', () => {
  // THE ABSENT-AT-THE-TOP ASSERTION, and it is the one that would catch the ref-one-element-too-high
  // defect slice A shipped. An observer pointed at the page wrapper rather than at `#contato` is on
  // screen from the first pixel of the landing, and every visit would report a reach. It is asserted
  // here and nowhere else, because only a real browser with a real viewport can tell.
  test('does not fire at the top of the landing, and does once the section is scrolled to', async ({ page }) => {
    await page.goto('/en');
    await accept(page);

    await page.waitForTimeout(1_000);
    expect(await named(page, 'contact_reach')).toEqual([]);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect.poll(() => named(page, 'contact_reach')).toEqual([
      { name: 'contact_reach', params: { locale: 'en' } },
    ]);
  });

  // One per visit. The section stays on screen and is scrolled away from and back; the observer
  // disconnected on the first hit, so nothing else comes out.
  test('fires once however often the section re-enters the viewport', async ({ page }) => {
    await page.goto('/en');
    await accept(page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => named(page, 'contact_reach')).toHaveLength(1);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    expect(await named(page, 'contact_reach')).toHaveLength(1);
  });
});

test.describe('slice B — outbound_click does not collide with contact_click', () => {
  // THE COLLISION, on the built site, on the link that actually makes it real: the shell footer's
  // version link points at `github.com/tedeuxx/tadeumendonca-io/releases/tag/vX.Y.Z`, and the GitHub
  // CONTACT channel is `github.com/tedeuxx`. Same hostname, different path. A hostname-based rule
  // reports this as a contact click; a bounded-form exclusion that was too wide reports nothing at all.
  // Both failures are refused by asserting the WHOLE emitted list for both events.
  test('reports the footer release link as outbound and not as a contact click', async ({ page }) => {
    await page.goto('/en/architecture');
    await accept(page);

    const version = page.getByRole('link', { name: 'Release notes for the running build (GitHub)' });
    const href = await version.getAttribute('href');
    expect(href).toMatch(/^https:\/\/github\.com\/tedeuxx\/tadeumendonca-io\/releases\/tag\/v/);
    await version.click();

    // Derived from the href the page actually published rather than pinned to a version string — the
    // build number moves on every merge, and a hard-coded expectation here would go red for a reason
    // that has nothing to do with the event.
    const url = new URL(href!);
    await expect.poll(() => named(page, 'outbound_click')).toEqual([
      { name: 'outbound_click', params: { locale: 'en', href: `${url.hostname}${url.pathname}` } },
    ]);
    expect(await named(page, 'contact_click')).toEqual([]);
  });

  // The reverse direction, and the positive twin for the negative above: a real contact channel emits
  // `contact_click` and NOT `outbound_click`, on the built page where both delegated listeners are
  // genuinely attached to the same node.
  test('reports a contact channel as a contact click and not as outbound', async ({ page }) => {
    await page.goto('/en');
    await accept(page);

    await page.getByRole('link', { name: 'LinkedIn', exact: true }).first().click();

    await expect.poll(() => named(page, 'contact_click')).toEqual([
      { name: 'contact_click', params: { locale: 'en', target: 'linkedin' } },
    ]);
    expect(await named(page, 'outbound_click')).toEqual([]);
  });

  // A share deeplink is `share_complete`'s. It leaves the site, so it is exactly the click an
  // unconstrained outbound rule would also claim — putting the content funnel's traffic into the
  // "where do readers leave to" series, where nothing would ever have contradicted it.
  test('reports a share as share_complete and not as outbound', async ({ page }) => {
    await page.goto(ARTICLE);
    await accept(page);

    await page.getByRole('link', { name: 'LinkedIn: My Commitment' }).first().click();

    await expect.poll(() => named(page, 'share_complete')).toHaveLength(1);
    expect(await named(page, 'outbound_click')).toEqual([]);
  });
});

test.describe('slice B — share_open', () => {
  test('emits with the article slug when the modal is opened', async ({ page }) => {
    await page.goto(ARTICLE);
    await accept(page);

    await page.getByRole('button', { name: 'Share' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await expect.poll(() => named(page, 'share_open')).toEqual([
      { name: 'share_open', params: { locale: 'en', slug: 'my-commitment' } },
    ]);
  });

  test('emits with the page slug on a markdown surface', async ({ page }) => {
    await page.goto('/en/architecture');
    await accept(page);

    await page.getByRole('button', { name: 'Share' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await expect.poll(() => named(page, 'share_open')).toEqual([
      { name: 'share_open', params: { locale: 'en', slug: 'architecture' } },
    ]);
  });
});

// THE CONSENT GATE, WIDENED TO SLICE B. Slice A asserted it for its own five events; four more now ride
// on it, and one of them fires from a scroll the reader did not ask for. This journey touches every one
// of the four before accepting anything.
test('slice B emits nothing at all before the reader accepts', async ({ page }) => {
  await page.goto('/en/architecture');
  await expect(banner(page)).toBeVisible();

  await page.getByRole('button', { name: 'Share' }).first().click();
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  expect(await events(page)).toEqual([]);
});
