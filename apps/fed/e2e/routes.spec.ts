import { test, expect } from '@playwright/test';

// #318. The shape of a link into the decision library. Asserted as a PATTERN over every row rather than
// against the generated artifact: importing it would tie this spec to Node types the E2E tsconfig does
// not carry, and a pattern over all 41 links is a stronger claim than an exact match on one of them.
const ADR_LINK = /^https:\/\/github\.com\/tedeuxx\/tadeumendonca-io\/blob\/main\/docs\/adr\/\d{4}-[a-z0-9-]+\.md$/;

// Pinned to pt-BR chrome: these journeys assert localized strings ("Portfólio", "Ver no GitHub",
// "Artigos", "Ver catálogo completo"). The i18n auto-detect layer (ADR-0032) makes en-US the default
// rendered chrome, so pin the context to pt-BR to keep the routing assertions deterministic. Routing
// itself is language-neutral; only the visible labels these checks anchor on are localized.
//
// Per-locale URLs (ADR-0036): every route is served under a locale prefix. These journeys drive the
// pt-prefixed pages directly; the bare/redirect behaviour is covered in per-locale.spec.ts.
test.use({ locale: 'pt-BR' });

// Routing regression. The landing/CV split moved every route, and the back-compat redirects exist so
// shared URLs and og:image deep-links keep resolving. Component tests can't prove a route still
// answers — only a real navigation can, so each route in App.tsx gets a journey here.
test.describe('routes', () => {
  test('/portfolio serves the full catalog with its GitHub links', async ({ page }) => {
    await page.goto('/pt/portfolio');
    await expect(page).toHaveTitle(/Portfólio/);
    await expect(page.getByRole('heading', { name: 'Portfólio' })).toBeVisible();

    // The catalog is owner-curated and non-empty — an empty catalog renders the fallback copy
    // instead, which would silently pass a laxer assertion.
    const repoLink = page.getByRole('link', { name: /Ver no GitHub/ }).first();
    await expect(repoLink).toBeVisible();
    await expect(repoLink).toHaveAttribute('href', /^https:\/\/github\.com\//);
  });

  // #329. The release affordance, asserted on the SERVED artifact because that is the only layer where
  // it can be wrong: a stale tag passes every unit test that reads the same literal it renders.
  //
  // Two claims, and the second is the one with teeth. The tag the card DISPLAYS must be the tag its href
  // points at — checked by reading the label and building the expectation from it, so the assertion
  // holds at any version and fails the moment the two are derived separately. And the URL must actually
  // RESOLVE: a release-notes link is a promise that the notes exist, and pointing at a tag GitHub does
  // not have is the same class of defect as showing a stale one.
  test('the .io card names the repo and links the running build\'s release notes', async ({ page, request }) => {
    await page.goto('/pt/portfolio');

    // The card's title IS the repo name now, not the site's brand — the rule stated on `CatalogProject.name`.
    // Scoped to the card: `tadeumendonca.io` legitimately appears elsewhere on the page (it is the site),
    // so a page-wide absence assertion would fail for the right reason and hide the wrong one.
    const card = page.locator('article', { has: page.getByRole('heading', { name: 'tadeumendonca-io' }) });
    await expect(card).toBeVisible();
    await expect(card.getByRole('heading', { name: 'tadeumendonca.io', exact: true })).toHaveCount(0);

    // Found by its ACCESSIBLE NAME rather than its text: the link carries an aria-label, which overrides
    // the text content for `name`. The visible text is asserted separately below, since the label is
    // precisely what lets it stay a bare version string.
    const release = card.getByRole('link', { name: /Notas da release/ });
    const tag = (await release.textContent())!.replace('⌂', '').trim();
    expect(tag).toMatch(/^v\d+\.\d+\.\d+$/);
    await expect(release).toHaveAttribute(
      'href',
      `https://github.com/tedeuxx/tadeumendonca-io/releases/tag/${tag}`,
    );

    // The tag must actually exist on GitHub — a release-notes link is a promise the notes are there, and
    // pointing at a tag that was never cut is the same class of defect as showing a stale one.
    //
    // ONLY A 404 FAILS THIS, and the first version of this block got that wrong in a way both reviewers
    // caught. It read `.catch(() => null)` and asserted `status() === 200`, with a comment claiming a
    // suite that goes red because GitHub is down is testing GitHub. `.catch` fires on a transport-level
    // rejection; Playwright RETURNS on any HTTP status — so a 429 or a 503 landed in `res` and turned the
    // BLOCKING playwright job red for a GitHub reason, on a healthy branch. The comment described
    // behaviour the code did not have.
    //
    // That is also the exact failure this slice's own argument refused: option (b) was rejected because a
    // build-time GitHub read can redden a healthy `main` on rate-limiting. Reintroducing it one layer over,
    // on a gate that blocks the PR, would have been the same defect wearing a test's clothes.
    //
    // So: a throttle, an outage or an unreachable network is NOT this repo's problem and is skipped out
    // loud; a definitive 404 is, and fails.
    const res = await request.get(`https://github.com/tedeuxx/tadeumendonca-io/releases/tag/${tag}`).catch(() => null);
    if (!res || res.status() === 429 || res.status() >= 500) {
      test.info().annotations.push({ type: 'skip-reason', description: `GitHub unavailable (${res?.status() ?? 'no response'}) — tag existence not verified` });
    } else {
      expect(res.status(), `GitHub has no release tagged ${tag}`).not.toBe(404);
    }
  });

  // The other card, and the assertion that matters is the ABSENCE: no tag may appear for a repo whose
  // version this build cannot read. A tag here could only have come from somewhere that can go stale.
  test('the skills card links its releases index and shows no tag', async ({ page }) => {
    await page.goto('/pt/portfolio');

    const card = page.locator('article', { has: page.getByRole('link', { name: 'tadeumendonca-skills', exact: true }) });
    await expect(card.getByRole('link', { name: /Releases/ })).toHaveAttribute(
      'href',
      'https://github.com/tedeuxx/tadeumendonca-skills/releases',
    );
    await expect(card.getByText(/^v\d+\.\d+\.\d+$/)).toHaveCount(0);
  });

  // The ramp-up page is the fourth public surface. Its body is markdown-in-repo rendered through the
  // shared <Markdown>, so this journey proves the whole chain — route answers, markdown renders, and
  // the YouTube links became click-to-load facades rather than eager third-party frames.
  test('/ramp-up serves the plan, with the videos behind a facade', async ({ page }) => {
    await page.goto('/pt/ramp-up');
    await expect(page.getByRole('heading', { level: 1, name: /Ramp-Up/ })).toBeVisible();
    // This file pins the context to pt-BR, and the BODY is bilingual too — so the Portuguese edition
    // is what must render here. Asserting the English heading would pass only against a stale build.
    await expect(page.getByRole('heading', { name: /Primeiro, acerte a categoria/ })).toBeVisible();

    // The property the facade exists to protect: no third-party frame until the reader asks.
    await expect(page.locator('iframe')).toHaveCount(0);
    const facades = page.getByRole('button', { name: /Reproduzir vídeo/ });
    await expect(facades).toHaveCount(4);

    // Pin WHICH videos on the SERVED build, not only in the unit parity test: each id was verified
    // against the channel it is attributed to, and on this page the attribution is the claim. A count
    // alone passes a silent swap — one wrong id keeps the count and republishes someone else's video
    // under a verified name.
    const thumbs = await page.locator('img[src*="/vi/"]').evaluateAll((imgs) =>
      imgs.map((img) => img.getAttribute('src') ?? ''),
    );
    for (const id of ['rKV5JcALQoQ', 'fl1DSmwQKKY', 'P1-8da1GgBg', 'I4B37S1dyQQ']) {
      expect(thumbs.some((src) => src.includes(`/vi/${id}/`))).toBe(true);
    }

    // Clicking one swaps in the privacy-preserving player.
    await facades.first().click();
    await expect(page.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\//);
  });

  test('reaches the ramp-up page from the nav', async ({ page }) => {
    await page.goto('/pt');
    await page.getByRole('navigation').getByRole('link', { name: 'Ramp-up' }).click();
    await expect(page).toHaveURL(/\/pt\/ramp-up$/);
    await expect(page.getByRole('heading', { level: 1, name: /Ramp-Up/ })).toBeVisible();
  });

  // The architecture page is the fifth public surface. Its body is markdown-in-repo rendered through the
  // shared <Markdown>, and it is an orientation LAYER — it links canonical detail rather than restating
  // it. Unlike the ramp-up page it carries no video embeds, so this journey anchors on the heading plus
  // at least one outbound canonical link (both public repos + the catalog-ready gate must be reachable).
  test('/architecture serves the blueprint, linking canonical detail out', async ({ page }) => {
    await page.goto('/pt/architecture');
    await expect(page.getByRole('heading', { level: 1, name: /Arquitetura/ })).toBeVisible();
    // pt-BR context: the Portuguese body must render (asserting the English heading would pass only
    // against a stale build).
    await expect(page.getByRole('heading', { name: /O registro de decisões É a documentação/ })).toBeVisible();

    // The orientation contract, on the real page: both public repos and catalog-ready are reachable.
    await expect(page.getByRole('link', { name: 'docs/catalog-ready.md' })).toHaveAttribute(
      'href',
      'https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/catalog-ready.md',
    );

    // #318. The two repos are no longer inline links in a bulleted list — they are the section's closing
    // CALL TO ACTION, rendered as <RepoCard>s by the lone-URL facade (ADR-0035). Located by testid and
    // asserted on href rather than by accessible name, because a card's name is its whole body (owner/name
    // + language + description + "view on GitHub") and pinning that string would make this journey go red
    // on a copy edit — a check somebody deletes, not a check that caught something.
    const cards = page.getByTestId('repo-card');
    await expect(cards).toHaveCount(2);
    expect(
      await cards.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href.replace(/\/$/, ''))),
      'the closing element leaves for both public repos, in order',
    ).toEqual([
      'https://github.com/tedeuxx/tadeumendonca-io',
      'https://github.com/tedeuxx/tadeumendonca-skills',
    ]);
    // The mark #318 asked for, and the reason it is asserted rather than trusted: it is decorative
    // (aria-hidden), so nothing in the accessible tree would notice it vanishing.
    const mark = cards.first().locator('svg');
    await expect(mark).toHaveCount(1);

    // The accent tint, and this check's reach is stated rather than assumed because it is narrower than
    // it looks. The mark is accent-coloured by THREE independent causes — `.markdown a` paints every
    // anchor in this container, the enclosing span carries `group-hover:text-primary`, and the mark
    // itself carries `text-primary` — so removing any ONE of them leaves this green. Both the resting
    // and the hover form were mutation-checked against a build with `text-primary` deleted, and both
    // passed; that is recorded here instead of a mutation-proof claim this assertion cannot support.
    //
    // What it does catch is the failure no unit test can see: `--primary` redefined, or the anchor rule
    // in index.css re-coloured, either of which silently ends "a GitHub mark in the accent" site-wide.
    // The class itself is pinned in RepoCard.test.tsx, where deleting it DOES go red.
    //
    // `rgb(255, 89, 0)` and not `255, 90, 0`: the accent is authored as `--primary: 21 100% 50%`, and the
    // browser's HSL→RGB rounding lands one unit under #FF5A00. Pinned as the browser computes it rather
    // than as the hex is written, or the test is right about the design system and red about the product.
    expect(await mark.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(255, 89, 0)');
  });

  // #318. The decision index is compiled from `docs/adr/` at build time, so what is worth asserting on
  // the real page is what distinguishes that from a table someone typed: that it holds the WHOLE library
  // rather than a curated handful, that its rows leave the page for the canonical record, and that a
  // reader with no JavaScript gets it — the whole reason it is prerendered.
  test('/architecture serves the full decision index, generated and outbound', async ({ page, request }) => {
    await page.goto('/pt/architecture');

    const table = page.getByRole('table', { name: /Índice de decisões/ });
    await expect(table).toBeVisible();

    // Against the artifact's own size, never a literal: a hardcoded number goes red every time an ADR is
    // written, and a check that fails on correct behaviour is a check somebody deletes.
    // A floor, not an exact count: the library grows, and a check that goes red every time an ADR is
    // written is a check somebody deletes. What it must catch is the table rendering a curated handful
    // instead of the whole library, which a floor this high does.
    const rowCount = await table.getByRole('row').count();
    expect(rowCount, 'the index must hold the whole library, not a sample').toBeGreaterThan(30);

    // EVERY row leaves for its record — the property the whole feature exists for, since the page links
    // canonical detail rather than restating it, and the thing a hand-typed table quietly loses one row
    // at a time. Asserted over all of them because the failure mode is one bad href among forty good
    // ones, which spot-checking the first row cannot see.
    const hrefs = await table
      .getByRole('link')
      .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    expect(hrefs, 'one link per record row').toHaveLength(rowCount - 1);
    expect(hrefs.filter((h) => !ADR_LINK.test(h)), 'every row links into docs/adr/').toEqual([]);

    // The status column is localised chrome around canonical English titles. Asserted in the PT edition
    // because that is the direction that can go wrong: the titles stay English by design, so a reader
    // needs the column that tells them what the row MEANS to be in their language.
    await expect(table.getByText('substituída').first()).toBeVisible();

    // And a JS-less crawler gets it. `page.goto` runs the app and would pass whether or not the table
    // was ever prerendered, which is the same trap #170 recorded for the diagrams.
    const html = await (await request.get('/pt/architecture/')).text();
    expect(html, 'the index must be in the prerendered bytes').toContain(
      'docs/adr/0002-fully-static-spa-no-backend.md',
    );
  });

  // #170. The diagram is compiled to inline SVG at BUILD time, so the properties worth asserting are the
  // ones that distinguish that from every cheaper thing it could have been.
  // Both figures, not one. The first version pinned only the infra diagram by caption, so the dev-loop
  // diagram — added in the same issue's second slice — had no E2E at all. That is the wrong thing to
  // leave uncovered given what this feature's real failure looks like: the defect this slice actually
  // shipped was a diagram drawn in the page's own background colour, present and legible to every
  // assertion and invisible to a reader.
  test('/architecture renders BOTH diagrams as inline SVG, sized, in the reader’s language', async ({ page }) => {
    await page.goto('/pt/architecture');

    for (const name of [/Como uma requisição vira uma página/, /Onde o humano fica no loop/]) {
      const figure = page.getByRole('figure', { name });
      await expect(figure, `${name} must render`).toBeVisible();

      // NOT `toBeVisible` alone, which passes on a 0x0 SVG and on a viewBox-less one — an element that
      // is present, "visible", and shows the reader nothing.
      const box = await figure.boundingBox();
      expect(box, `${name} must occupy a real box`).not.toBeNull();
      expect(box!.width).toBeGreaterThan(300);
      expect(box!.height).toBeGreaterThan(100);

      // Real <text>, not <foreignObject> HTML and not an <img>: the reason inline SVG was chosen at all.
      expect(await figure.locator('svg text').count()).toBeGreaterThan(3);
      await expect(figure.locator('foreignObject')).toHaveCount(0);

      // BACKGROUND-EQUALITY, not contrast — and the distinction is the point rather than pedantry.
      // The palette assertions check MEMBERSHIP, so a diagram drawn entirely in the canvas colour
      // satisfies them and shows nothing; that is the defect that reached production in slice one, and
      // this catches exactly it. It does NOT catch #0B0B0B on #0A0A0A. A legibility check this is not,
      // and saying so here matters because the previous round's finding was a comment claiming more
      // than its assertion did.
      const strokes = await figure.locator('svg path.flowchart-link').evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).stroke),
      );
      expect(strokes.length, `${name} must draw edges at all`).toBeGreaterThan(2);
      // Read the canvas colour from `.diagram-canvas`, NOT from the <figure>. The figure has no
      // background of its own — it computes to rgba(0,0,0,0) — so comparing against it made this
      // assertion pass on the very defect it was written for. Caught by running the mutation instead of
      // trusting the assertion, which is the only reason it is not still wrong.
      const canvas = await figure
        .locator('.diagram-canvas')
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(canvas, 'the canvas must have a real background to compare against').not.toBe('rgba(0, 0, 0, 0)');
      expect(strokes.filter((s) => s === canvas), `${name} draws edges in the background colour`).toEqual([]);
    }
  });

  test('reaches the architecture page from the nav', async ({ page }) => {
    await page.goto('/pt');
    await page.getByRole('navigation').getByRole('link', { name: 'Arquitetura' }).click();
    await expect(page).toHaveURL(/\/pt\/architecture$/);
    await expect(page.getByRole('heading', { level: 1, name: /Arquitetura/ })).toBeVisible();
  });

  // #315. Both locales, because the nav href is built by `useLocalePath` and a prefix bug shows up in
  // exactly one of them. The old entry (`/#portfolio`) would fail this by landing on the LANDING with a
  // fragment — same origin, same 200, different page — which is why the assertion is on the URL and on
  // something only the catalog can render, rather than on the click succeeding.
  const barLink = 'docs/catalog-ready.md'; // a filename, identical in both editions by design
  for (const [locale, label] of [
    ['pt', 'Portfólio'],
    ['en', 'Portfolio'],
  ] as const) {
    test(`the ${locale} nav's Portfolio entry lands on the catalog, not the landing's shortlist`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await page.getByRole('navigation').getByRole('link', { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/portfolio$`));
      // NOT the heading. `PortfolioSection` is shared, so the landing and the page render the SAME
      // `portfolio.heading` — an assertion on it passes in both places and would have gone green on the
      // old `/#portfolio` entry, which is the exact defect this test exists for. The curation bar is
      // opted into by `PortfolioPage` and by nothing else, so it is the one thing on screen that can
      // only be true of the catalog.
      await expect(page.getByRole('link', { name: barLink })).toBeVisible();
    });
  }

  // The section the nav entry USED to point at is still there and still reachable by its anchor. The
  // regression this guards is not hypothetical: removing a nav entry and removing the region it named
  // are one edit apart, and nothing else asserts the landing still carries `id="portfolio"`.
  test('keeps #portfolio a live landing anchor after the nav entry became a route', async ({ page }) => {
    await page.goto('/pt/#portfolio');
    await expect(page).toHaveURL(/\/pt\/#portfolio$/);
    await expect(page.locator('#portfolio')).toBeVisible();
  });

  test('reaches the full catalog from the landing shortlist', async ({ page }) => {
    await page.goto('/pt');
    await page.getByRole('link', { name: /Ver catálogo completo/ }).click();
    await expect(page).toHaveURL(/\/pt\/portfolio$/);
    await expect(page.getByRole('heading', { name: 'Portfólio' })).toBeVisible();
  });

  test('keeps the retired /blog list deep-link working by redirecting to the landing, in-locale', async ({ page }) => {
    await page.goto('/pt/blog');
    await expect(page).toHaveURL(/\/pt\/#artigos$/);
    await expect(page.getByRole('heading', { name: 'Artigos' })).toBeVisible();
  });

  // An in-locale unknown path falls to the locale landing (/pt), NOT bare / — avoiding a redirect loop.
  test('sends an in-locale unknown path to the locale landing instead of a dead end', async ({ page }) => {
    await page.goto('/pt/rota-que-nao-existe');
    await expect(page).toHaveURL(/\/pt$/);
    await expect(page.getByRole('heading', { name: 'Artigos' })).toBeVisible();
  });
});

// The skip link (#250). A unit test can prove the anchor is first in the DOM and that `main` is
// focusable; only a real browser proves the two together do what a keyboard visitor needs — that one
// Tab reaches it, that it is VISIBLE while focused (an off-screen ghost is useless to a sighted
// keyboard user), and that activating it leaves focus inside the content rather than on the link.
test.describe('skip link', () => {
  test('one Tab reaches it, it is visible, and activating it moves focus into the content', async ({ page }) => {
    await page.goto('/pt/');

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(skip).toBeFocused();

    // Revealed, and asserted on the BOX rather than on `toBeVisible()`. Playwright's visibility is
    // "non-empty bounding box and not visibility:hidden", and Tailwind's `sr-only` leaves a 1x1 CLIPPED
    // box — so `toBeVisible()` passes on the exact off-screen ghost this control must never be. Verified
    // by mutation: reducing the class list to `sr-only` alone left both these tests green.
    //
    // A readable control is what the criterion actually says, so that is what is measured: real
    // dimensions, and `clip: auto` — the property `sr-only` sets and `not-sr-only` restores.
    const box = await skip.boundingBox();
    expect(box, 'the focused skip link must occupy a real box').not.toBeNull();
    expect(box!.width).toBeGreaterThan(60);
    expect(box!.height).toBeGreaterThan(20);
    await expect(skip).toHaveCSS('clip', 'auto');

    await page.keyboard.press('Enter');

    // The assertion that matters: focus is INSIDE main. Without tabIndex the browser scrolls and
    // leaves focus on the link, so this is what separates a working skip link from a decorative one.
    const focusedIsMain = await page.evaluate(() => document.activeElement?.id === 'main');
    expect(focusedIsMain).toBe(true);
  });

  test('serves the English edition its own label', async ({ page }) => {
    await page.goto('/en/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  });
});
