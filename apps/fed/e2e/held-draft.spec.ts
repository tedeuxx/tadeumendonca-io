import { test, expect } from '@playwright/test';
import { HELD_KEY, HELD_NONCES, HELD_SLUGS } from '../src/content/heldFixture';

// #510 — the held draft, against the SERVED artifact.
//
// The unit suites prove the decisions (`content.ts` excludes it from the enumeration, `routes.mjs` drops
// it from the route set, `og-cards.mjs` requires no card for it). This file proves the OUTPUT: the
// sitemap the site actually serves, the HTML a crawler actually receives, the page a visitor actually
// lands on. The two layers are not redundant — a hold applied correctly in the module and lost in the
// build would leave every unit test green.
//
// ACCEPTANCE CRITERIA 1, 2, 4, 5 and 6 live here. CRITERION 7 IS DELIBERATELY NOT WRITTEN: under the
// isolation package the held body DOES ship in `dist/assets/index-*.js`, so an assertion that it does not
// would be permanently red. Writing it and then relaxing it is how a gate becomes theatre. That
// consequence is recorded in ADR-0049 with the command that measures it; it is a decision, not a gap.
//
// EVERY assertion below is mutation-checked by flipping the fixture's `draft: true` to `false` and
// confirming it goes red. A held-state assertion that stays green on a published article asserts nothing
// about the hold.
//
// Chrome pinned to pt-BR, like the rest of this suite: the landing assertions read localized labels.
test.use({ locale: 'pt-BR' });

const held = (locale: 'pt' | 'en') => `/${locale}/blog/${HELD_SLUGS[locale]}`;

test.describe('a held article is out of every public enumeration', () => {
  // CRITERION 1. Read from the served sitemap.xml rather than from the generator, because the generator
  // is what the unit test already covers — the question here is what the crawler is handed.
  test('the sitemap advertises zero URLs for either held slug', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text();
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    // The ruler first: a sitemap that failed to generate would make every absence below vacuously true,
    // and an empty sitemap reads identical to a perfectly held article.
    expect(locs.filter((u) => u.includes('/blog/')).length, 'the sitemap must advertise real articles').toBeGreaterThan(0);

    expect(locs.filter((u) => u.includes(HELD_SLUGS.en))).toEqual([]);
    expect(locs.filter((u) => u.includes(HELD_SLUGS.pt))).toEqual([]);
    // hreflang alternates are a second advertisement of the same URL set, and #200 is the record of that
    // set drifting from the <loc> set unnoticed. Checked separately for that reason.
    const alternates = [...body.matchAll(/hreflang="[^"]+" href="([^"]+)"/g)].map((m) => m[1]);
    expect(alternates.filter((u) => u.includes(HELD_SLUGS.en) || u.includes(HELD_SLUGS.pt))).toEqual([]);
  });

  // CRITERION 2, on the served artifact — and it runs ONLY against a deployed target, deliberately.
  //
  // `vite preview` answers the SPA fallback for EVERY nested path, including `/en/me` and
  // `/en/blog/<published>`: measured on this build, both return the template with
  // `canonical → https://tadeumendonca.io/en`. So on the local target a snapshotted route and an
  // unsnapshotted one are INDISTINGUISHABLE over HTTP, and an assertion written here would pass on a held
  // article and on a published one alike — the assertion-that-cannot-fail this repo keeps finding.
  //
  // Rather than write a green that proves nothing, this follows the exception `CLAUDE.md` already states
  // for the CloudFront Function (#216): an assertion that cannot be true before the deploy exists lives
  // in the post-deploy smoke and SKIPS elsewhere. The pre-merge half of criterion 2 is carried by
  // `scripts/routes.test.mjs`, which asserts the held slugs are absent from `localizedRoutes()` — the
  // enumeration `prerender.mjs` IMPORTS rather than re-derives, so absence there is absence from the
  // snapshot set. That assertion is mutation-checked and goes red on a published fixture.
  //
  // The `not.toContain` on the nonce is the whole claim: a snapshot of a held article would carry its
  // body, and the fallback cannot.
  //
  // Skipped on the LOOPBACK ADDRESSES rather than on `E2E_ENV`, copying `edge-rewrite.spec.ts` verbatim:
  // keyed on the env name alone, pointing the harness at 127.0.0.1 would run this against a server that
  // cannot satisfy it and report the local fallback as a production outage.
  test('neither held URL is snapshotted at the edge', async ({ request, baseURL }) => {
    test.skip(
      ['localhost', '127.0.0.1', '[::1]', '::1'].includes(new URL(baseURL!).hostname),
      'vite preview serves the SPA fallback for every nested path, so it cannot tell a snapshot from one',
    );
    for (const locale of ['pt', 'en'] as const) {
      const html = await (await request.get(held(locale))).text();
      expect(html, `${locale}: a held article must not be snapshotted`).not.toContain(HELD_NONCES[locale]);
    }
    // The control that makes the two lines above a measurement rather than a failed search: the same
    // request shape DOES return a real snapshot for a published article, so "nothing is prerendered at
    // all" cannot pass as "the hold works" — the false-green shape #189 already cost this repo once.
    const sitemap = await (await request.get('/sitemap.xml')).text();
    const article = [...sitemap.matchAll(/<loc>([^<]*\/blog\/[^<]+)<\/loc>/g)].map((m) => m[1])[0];
    expect(article, 'the sitemap must advertise an article to compare against').toBeTruthy();
    const path = new URL(article).pathname;
    expect(await (await request.get(path)).text()).toContain(`href="${article}"`);
  });

  // CRITERION 3, on the served surface. The unit suite asserts no card is REQUIRED and none is
  // GENERATED; this asserts none is SERVED. An OG card is a public URL, so a card for a held draft leaks
  // the article's title in both languages to anyone who guesses the (entirely predictable) filename.
  //
  // The assertion is on the CONTENT TYPE, not on a 404, because neither target returns one: `vite
  // preview` falls back to the SPA and CloudFront maps 404 to `/index.html` with a 200. "No image is
  // served here" is the claim that is true on both, and it is also the claim that matters — a scraper
  // fetching `og:image` cares what it receives, not what the status line says.
  test('serves no OG card for the held article, in either locale', async ({ request }) => {
    for (const locale of ['pt', 'en'] as const) {
      const res = await request.get(`/og/${HELD_KEY}.${locale}.png`);
      expect(res.headers()['content-type'], `${locale}: a held article must have no card`).not.toContain('image');
    }
    // The control: the same request shape DOES return an image for a published article, so the assertion
    // above is about the hold rather than about the OG directory being unreachable.
    const published = await request.get('/og/my-commitment.en.png');
    expect(published.headers()['content-type']).toContain('image/png');
  });

  // CRITERION 4. The landing hosts the articles list (#artigos) — there is no separate blog index — so
  // "the index, the feed and the navigation" is this page, in both editions, across every track filter.
  test('never appears in the index, the feed or the navigation', async ({ page }) => {
    for (const locale of ['pt', 'en'] as const) {
      await page.goto(`/${locale}`);
      // The ruler: real articles are listed, so the absence below is a finding rather than an empty page.
      await expect(page.getByRole('heading', { name: locale === 'pt' ? 'Artigos' : 'Articles' })).toBeVisible();
      const body = await page.locator('body').innerText();
      expect(body, `${locale}: the held title must not be listed`).not.toContain(
        locale === 'pt' ? 'Fixture de rascunho retido' : 'Held draft fixture',
      );
      expect(await page.locator(`a[href*="${HELD_SLUGS[locale]}"]`).count()).toBe(0);
    }
  });
});

test.describe('the preview parameter is what distinguishes reading it from not finding it', () => {
  // CRITERION 5. The visitor arriving with no parameter lands on the locale home — the isolation half.
  test('without the parameter, the held URL lands on the locale home', async ({ page }) => {
    for (const locale of ['pt', 'en'] as const) {
      await page.goto(held(locale));
      await expect(page).toHaveURL(new RegExp(`/${locale}$`));
      expect(await page.locator('body').innerText()).not.toContain(HELD_NONCES[locale]);
    }
  });

  // `replace`, so the held URL does not sit in history. Without it the back button bounces the visitor
  // straight back into the redirect, which reads as the site being stuck.
  test('the redirect replaces history rather than stacking it', async ({ page }) => {
    await page.goto('/pt');
    await page.goto(held('pt'));
    await expect(page).toHaveURL(/\/pt$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/pt$/);
  });

  // CRITERION 6. With the parameter, the article renders — title and body — in the real chrome.
  //
  // ITS OWN MUTATION, different from the one every other test here carries: removing the parameter
  // handling reddens this. That is asserted from the other side by the redirect test above, which is why
  // the two are kept as a pair rather than folded together.
  test('with the parameter, the held article renders its title and body', async ({ page }) => {
    for (const locale of ['pt', 'en'] as const) {
      await page.goto(`${held(locale)}?preview`);
      await expect(page).toHaveURL(new RegExp(`${HELD_SLUGS[locale]}\\?preview$`));
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: locale === 'pt' ? 'Fixture de rascunho retido' : 'Held draft fixture',
        }),
      ).toBeVisible();
      expect(await page.locator('body').innerText()).toContain(HELD_NONCES[locale]);
    }
  });

  // The owner's actual journey: read the piece, switch language, read the other edition. It is the reason
  // `getEditions` had to keep resolving a held article rather than only `getPostBySlug` — the toggle maps
  // `/blog/<thisSlug>` → `/blog/<otherSlug>` through the edition group, and a held article missing from it
  // would strand the reader on a dead switch mid-review.
  //
  // The query string surviving the hop is the other half, and it is not free: `LocaleProvider` re-appends
  // `location.search` when it navigates. Without that the toggle would drop `?preview` and bounce the
  // owner to the home page every time he changed language, which reads as the feature being broken.
  test('the locale toggle carries the preview across to the other edition', async ({ page }) => {
    await page.goto(`${held('pt')}?preview`);
    await expect(page.getByRole('heading', { level: 1, name: 'Fixture de rascunho retido' })).toBeVisible();

    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/en/blog/${HELD_SLUGS.en}\\?preview$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Held draft fixture' })).toBeVisible();
    expect(await page.locator('body').innerText()).toContain(HELD_NONCES.en);
  });

  // The unprefixed entry point — the shape of URL a person actually pastes from a note. `RootRedirect`
  // maps the slug into the reader's own edition AND re-appends the query; drop either and the paste lands
  // on the home page, which is indistinguishable from the hold working correctly.
  test('an unprefixed held URL keeps the preview through the locale redirect', async ({ page }) => {
    // The browser context is pinned to pt-BR at the top of this file, so `detectLocale` resolves to `pt`
    // and the target is exact rather than "one of the two" — a loose assertion here would also pass if
    // the redirect landed on the wrong edition, which is precisely the #204 defect.
    await page.goto(`/blog/${HELD_SLUGS.pt}?preview`);
    await expect(page).toHaveURL(new RegExp(`/pt/blog/${HELD_SLUGS.pt}\\?preview$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Fixture de rascunho retido' })).toBeVisible();
    expect(await page.locator('body').innerText()).toContain(HELD_NONCES.pt);
  });

  // Rendered by the SAME components, the same CSS and the same chrome — that is the point of previewing
  // at the real URL rather than in a side channel. The header/footer are the cheapest observable proof.
  test('renders inside the real site chrome, not a bare page', async ({ page }) => {
    await page.goto(`${held('pt')}?preview`);
    await expect(page.getByRole('navigation').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Todos os artigos/ })).toBeVisible();
  });

  // The weaker half of the hold, and asserted as such. Nothing links a held article, so a crawler has no
  // path to it; this covers the URL reaching one anyway. It is emitted from the client head, so it is
  // absent from the raw response by construction — which is why criterion 2 above is the real mechanism.
  test('marks the previewed article noindex', async ({ page }) => {
    await page.goto(`${held('en')}?preview`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });

  // The control. `noindex` must be the held article's property, not the site's — a `robots` tag that
  // appeared on every page would pass the assertion above and de-index the whole site.
  test('leaves a published article free of any robots tag', async ({ page }) => {
    await page.goto('/pt');
    expect(await page.locator('meta[name="robots"]').count()).toBe(0);
  });
});
