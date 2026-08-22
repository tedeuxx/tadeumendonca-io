import { test, expect } from '@playwright/test';
import { LOCALE_OFFER_LABEL, LOCALE_OFFER_LABELS } from './locale-offer-labels';

// Per-locale URLs (ADR-0036). Every public route is served under a first-class locale prefix — /pt/… and
// /en/… — each with its own prerendered, self-canonical, OG-complete HTML and reciprocal hreflang
// alternates. The bare/unprefixed URL client-side redirects to the detected locale (path → persisted →
// navigator → en), preserving the sub-path; the bare-root snapshot is an x-default English page for the
// JS-less crawler. There is NO edge/Accept-Language logic — the redirect is pure client-side React
// (ADR-0004 holds).
//
// These journeys fold in the plan-reviewer's extra assertions. The served-HTML checks inspect the raw HTTP
// BODY (request.get, no JS) so they prove the PRERENDERED per-locale file was served, not the generic SPA
// shell falling through — the same anti-masquerade rigor as seo.spec.ts. The discriminator is decisive: the
// x-default shell carries en (lang, og:locale, canonical), so a pt file that were really the shell would
// fail every pt assertion.

const SITE = 'https://tadeumendonca.io';

// A distinctive pt-only vs en-only marker inside the profile summary (the /me og:description source).
const PT_ONLY = /aplicando desenvolvimento AI-native/;
const EN_ONLY = /applying AI-native development/;

// 1 · Path beats the browser AND a persisted preference — a shared /pt/… link wins over everything.
test.describe('the path is authoritative', () => {
  test.describe('en-US browser context', () => {
    test.use({ locale: 'en-US' });

    test('/pt/me resolves in Portuguese even in an English browser (path beats browser)', async ({ page }) => {
      await page.goto('/pt/me');
      await expect(page).toHaveURL(/\/pt\/me$/); // no redirect away — the path stands
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
      await expect(page.getByText(/\d+\+ anos em SDLC/)).toBeVisible(); // a pt-only string
      await expect(page.getByText(/\d+\+ years across SDLC/)).toHaveCount(0); // the en counterpart absent
    });

    test('/pt/me resolves in Portuguese even with a persisted en preference (path beats localStorage)', async ({
      page,
    }) => {
      // Seed a persisted 'en' override BEFORE the app loads: the path must still win.
      await page.addInitScript(() => window.localStorage.setItem('locale', 'en'));
      await page.goto('/pt/me');
      await expect(page).toHaveURL(/\/pt\/me$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
      await expect(page.getByText(/\d+\+ anos em SDLC/)).toBeVisible();
    });
  });

  // 2 · The mirror: /en/me resolves in English inside a pt-BR browser.
  test.describe('pt-BR browser context', () => {
    test.use({ locale: 'pt-BR' });

    test('/en/me resolves in English even in a Portuguese browser', async ({ page }) => {
      await page.goto('/en/me');
      await expect(page).toHaveURL(/\/en\/me$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.getByText(/\d+\+ years across SDLC/)).toBeVisible();
      await expect(page.getByText(/\d+\+ anos em SDLC/)).toHaveCount(0);
    });
  });
});

// 3 · Served-HTML (JS-off) per locale — the prerendered file carries the right lang / og:locale /
// og:description / self-canonical, and it is the PRERENDERED page, not the SPA shell (which is en).
//
// The requests use a TRAILING SLASH (`/pt/me/`): the CloudFront rewrite maps both `/pt/me` and `/pt/me/`
// to `/pt/me/index.html` in production, and the trailing slash also makes `vite preview` (sirv) resolve the
// directory index locally — so the SAME raw-HTTP assertion proves the prerendered file in both. A CLEAN
// `/pt/me` under vite preview falls through to the SPA shell (no rewrite), which would mask the check.
test.describe('served-HTML is prerendered per locale', () => {
  test('/pt/me serves Portuguese prerendered HTML, not the en shell', async ({ request }) => {
    const body = await (await request.get('/pt/me/')).text();
    expect(body).toMatch(/<html[^>]*lang="pt-BR"/);
    expect(body).toContain('property="og:locale" content="pt_BR"');
    expect(body).toContain(`rel="canonical" href="${SITE}/pt/me"`);
    // og:description is the Portuguese edition.
    expect(body).toMatch(new RegExp(`property="og:description" content="[^"]*${PT_ONLY.source}`));
    // Anti-masquerade: this is NOT the x-default English shell falling through.
    expect(body).not.toContain('property="og:locale" content="en_US"');
    expect(body).not.toContain(`rel="canonical" href="${SITE}/en/me"`);
  });

  test('/en/me serves English prerendered HTML', async ({ request }) => {
    const body = await (await request.get('/en/me/')).text();
    expect(body).toMatch(/<html[^>]*lang="en"/);
    expect(body).toContain('property="og:locale" content="en_US"');
    expect(body).toContain(`rel="canonical" href="${SITE}/en/me"`);
    expect(body).toMatch(new RegExp(`property="og:description" content="[^"]*${EN_ONLY.source}`));
    expect(body).not.toContain('property="og:locale" content="pt_BR"');
  });
});

// 3b · The PORTFOLIO body is per-locale too (#235). The head was already right — og:locale, canonical,
// hreflang all localized — while the page's own copy was Portuguese in both editions, because
// `catalog.ts` typed its prose as plain strings. So a head-only check would have passed on the defect;
// this asserts the BODY, in both directions, on the built artifact where the bug actually lived.
test.describe('the portfolio body is per-locale', () => {
  // One assertion per prose field, both directions. `proof` is covered explicitly because the first
  // version of this guard asserted only `tagline` and `description` — so a `proof` that regressed to
  // Portuguese on /en would have matched no negative and left the E2E green, one layer above where the
  // unit test catches it. Partial coverage of a three-field defect is how the three days happened.
  test('/en/portfolio serves English copy and no Portuguese', async ({ request }) => {
    const body = await (await request.get('/en/portfolio/')).text();
    expect(body).toContain('This site — a static React/Vite SPA'); // tagline
    expect(body).toContain('provisioned with Terraform'); // description
    expect(body).toContain('where to start reading the repo, and what to reuse'); // proof
    expect(body).toContain('The bar for getting listed here'); // the bar (#246)
    expect(body).not.toContain('Este site — SPA estático');
    expect(body).not.toContain('provisionada com Terraform');
    expect(body).not.toContain('onde começar a ler o repo, e o que levar');
    expect(body).not.toContain('A régua pra entrar aqui');
  });

  test('/pt/portfolio serves Portuguese copy and no English', async ({ request }) => {
    const body = await (await request.get('/pt/portfolio/')).text();
    expect(body).toContain('Este site — SPA estático'); // tagline
    expect(body).toContain('provisionada com Terraform'); // description
    expect(body).toContain('onde começar a ler o repo, e o que levar'); // proof
    expect(body).toContain('A régua pra entrar aqui'); // the bar (#246)
    expect(body).not.toContain('This site — a static React/Vite SPA');
    expect(body).not.toContain('where to start reading the repo, and what to reuse');
    expect(body).not.toContain('The bar for getting listed here');
  });

  // #313, the second catalog entry. Asserted separately from the pair above rather than folded into
  // it, and PER FIELD, because the guard those tests document is per-ENTRY as well as per-field: the
  // defect that shipped Portuguese to /en did so for whatever entries existed at the time, and a new
  // entry gets no coverage from assertions naming the old one's strings.
  //
  // NOT the card's NAME. `tadeumendonca-skills` is a fact, authored once and identical in both
  // editions by design, so an assertion on it passes in either locale and cannot fail for the defect
  // this describes. The issue asked for this explicitly and it is the trap worth naming: the most
  // obvious string to assert on a card is the one that proves nothing about its language.
  const SKILLS_CARD = {
    en: ['The harness that builds this site', 'the bottleneck becomes trusting it', 'what you can install into your own repo today'],
    pt: ['O harness que constrói este site', 'o gargalo vira confiar nele', 'o que dá para instalar no seu repo hoje'],
  } as const;

  for (const locale of ['en', 'pt'] as const) {
    const other = locale === 'en' ? 'pt' : 'en';
    test(`/${locale}/portfolio serves the skills card in its own language`, async ({ request }) => {
      const body = await (await request.get(`/${locale}/portfolio/`)).text();
      for (const s of SKILLS_CARD[locale]) expect(body).toContain(s);
      for (const s of SKILLS_CARD[other]) expect(body).not.toContain(s);
    });
  }

  // THE HUMAN HALF, pinned separately and in both editions, because it is the half that went missing.
  //
  // The card's first draft said the verification is mechanical and stopped there — describing a loop
  // with no human in it, which a reader who has not clicked through parses as *the irreversible is
  // handled mechanically*: the opposite of what the hook routes to. `brand-guardian` caught it. The
  // practice term is `agent-led verification, HUMAN-RESIDUAL`, and every other surface states the pair
  // (`architecture.{en,pt}.md`, the plugin's README).
  //
  // Not covered by the per-locale test above, and that is the point rather than duplication: those
  // assertions pin that each edition is in its OWN LANGUAGE. A card that drops the human half in both
  // editions equally is perfectly bilingual and still wrong, so it passes them. This asserts the CLAIM;
  // those assert the locale. Different defects, and one cannot stand in for the other.
  const HUMAN_HALF = { en: 'the human keeps what is theirs', pt: 'o humano fica com o que é dele' } as const;
  for (const locale of ['en', 'pt'] as const) {
    test(`/${locale}/portfolio keeps the human in the loop the card describes`, async ({ request }) => {
      const body = await (await request.get(`/${locale}/portfolio/`)).text();
      expect(body).toContain(HUMAN_HALF[locale]);
    });
  }

  // The bar's LINK, asserted on the served artifact rather than only in the unit test — the sentence
  // claims the standard is checkable, and a claim whose link never shipped is the claim failing, not a
  // cosmetic miss. Asserted in both editions because the href is authored once and shared: a defect here
  // would be identical in both, which is exactly the kind that a single-edition check reports as fine.
  const BAR_HREF = 'https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/catalog-ready.md';
  for (const locale of ['pt', 'en'] as const) {
    test(`/${locale}/portfolio serves the bar's link, not just its sentence`, async ({ request }) => {
      const body = await (await request.get(`/${locale}/portfolio/`)).text();
      expect(body).toContain(BAR_HREF);
    });
  }

  // The LANDING must NOT carry it — the shape proposed in PR #251. `PortfolioSection` is shared, so the bar
  // reached the storefront for free and the default had to be flipped to opt-in to stop it. This is the
  // assertion that makes that decision durable: it is one prop away from regressing, and the landing is
  // the surface where a correction costs most (CloudFront, plus the OG card scrapers pin on first fetch).
  //
  // Asserted on the served artifact rather than in the unit test alone, because the bare `/` snapshot is
  // what the JS-less crawler reads and it is prerendered separately from the locale landings.
  // The /portfolio OG DESCRIPTION, per locale. This is the string LinkedIn, X and WhatsApp pin on first
  // fetch, so it is the least reversible copy on the page — and until now it had no assertion at any
  // level, while the body sentence beneath it had nine. The proportionality was inverted against this
  // slice's own risk model, and it was caught by mutation: reverting this string to the copy it replaced
  // left every unit test and every E2E green.
  //
  // `/me` has carried this assertion since #182 (above). `/portfolio` is the surface whose description
  // actually changed, and it did not.
  const PORTFOLIO_OG = {
    pt: 'a régua que decide o que entra',
    en: 'the bar that decides what gets listed',
  };
  for (const locale of ['pt', 'en'] as const) {
    const other = locale === 'pt' ? 'en' : 'pt';
    test(`/${locale}/portfolio serves its own og:description, not the other edition's`, async ({ request }) => {
      const body = await (await request.get(`/${locale}/portfolio/`)).text();
      expect(body).toMatch(new RegExp(`property="og:description" content="[^"]*${PORTFOLIO_OG[locale]}`));
      expect(body).not.toContain(PORTFOLIO_OG[other]);
    });
  }

  // The /architecture OG description, and the reason it is here is uncomfortable enough to write down:
  // the slice that added the assertion above then changed THIS string with no assertion at all, one page
  // over, in a diff whose stated rationale was that the vocabulary split had landed "in the surface with
  // the worst correction cost". Same defect, same surface class, immediately after fixing it.
  //
  // The pt marker is the term UNTRANSLATED. `agent-led verification` stays English in both locales, like
  // `agentic` and `AI-native` (#245) — this string used to translate it while `architecture.pt.md` kept
  // it with a gloss, so a pt reader met the canonical term in the body and never in the share card.
  // The negative is the translated form it replaced, so a silent revert fails rather than passes — and it
  // is scoped to the TAG, not the document. The pt BODY legitimately carries the gloss
  // ("agent-led verification, human-residual (verificação liderada pelo agente…)") because that is where
  // there is room to teach the term; a document-wide negative would forbid the gloss the page needs.
  const ARCHITECTURE_OG = { pt: 'dev-loop de agent-led verification', en: 'agent-led verification dev-loop' };
  for (const locale of ['pt', 'en'] as const) {
    test(`/${locale}/architecture serves the canonical term in its og:description, untranslated`, async ({
      request,
    }) => {
      const body = await (await request.get(`/${locale}/architecture/`)).text();
      const og = /property="og:description" content="([^"]*)"/.exec(body)?.[1] ?? '';
      expect(og).toContain(ARCHITECTURE_OG[locale]);
      expect(og).not.toContain('verificação liderada pelo agente');
    });
  }

  // CONTAINMENT IS NOT THE RULE `messages.ts` STATES, and that gap shipped: the assertion above was
  // green while a rewrite moved `agent-led verification` from pt 43 → 119 and en 28 → 101 in the same
  // string. The rule four lines above `architecture.metaDescription` is positional — *"Term FIRST,
  // stack after. It used to sit around character 120 — inside the window LinkedIn, X and SERP previews
  // cut"* — so a term present but past the cut satisfies every assertion here and none of the rule.
  //
  // 120 IS TAKEN FROM THE RULE'S OWN RECORDED FAILURE POINT, not from a fresh claim about any one
  // platform's cut. The term must END before it, so the reader of a truncated card meets the whole
  // term or the assertion reddens. At the string this landed with, the margin is large (pt ends at 37,
  // en at 25) — the bound is a floor, not a target.
  //
  // PINNED ON THE TERM'S POSITION, NOT ON THE WHOLE STRING, deliberately: rewording the description
  // around the term is routine and must stay free, while moving the term past the cut is the
  // regression. Mutation-checked by pushing the pt term past 120 with the en edition untouched — pt
  // reddened alone, `en` stayed green.
  const OG_TERM_MUST_END_BEFORE = 120;
  for (const locale of ['pt', 'en'] as const) {
    test(`/${locale}/architecture puts the canonical term before the preview truncation`, async ({
      request,
    }) => {
      const body = await (await request.get(`/${locale}/architecture/`)).text();
      const og = /property="og:description" content="([^"]*)"/.exec(body)?.[1] ?? '';
      const start = og.indexOf(ARCHITECTURE_OG[locale]);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(start + ARCHITECTURE_OG[locale].length).toBeLessThan(OG_TERM_MUST_END_BEFORE);
    });
  }

  // /library, and it is here because the gate PROVED the hole rather than suspecting it: it reverted both
  // editions of `library.metaDescription` to the contents-form the copy lens had blocked, rebuilt, and got
  // 603 unit green and 120 E2E green with the wrong sentence sitting in the served HTML of both editions,
  // in three head slots each. `/me`, `/portfolio` and `/architecture` all carry this assertion; `/library`
  // was the only one of the four without it, and the only one whose description has ALREADY shipped wrong.
  //
  // THE POSITIVE PINS THE RULE FORM AND THE NEGATIVE PINS THE CONTENTS FORM, which is the whole point of
  // the string rather than a phrasing preference. A contents sentence ("each book with a rating") is false
  // at zero entries and true at twenty; a rule sentence ("only what I've read gets in") is true at both.
  // The shelf ships empty, so the contents form was untrue at the moment of publication — and this string
  // reaches `<meta name="description">`, `og:description` and `twitter:description` at once, on a route the
  // sitemap advertises to search from merge with no in-site link. The negative is the exact retired
  // wording, so a silent revert to it fails here instead of shipping green.
  const LIBRARY_OG = {
    pt: { rule: 'só entra o que eu li', contents: 'cada livro com nota de 1 a 5' },
    en: {
      rule: 'only what I have actually read gets in',
      contents: 'each book with a 1–5 rating and what I took from it',
    },
  };
  for (const locale of ['pt', 'en'] as const) {
    const other = locale === 'pt' ? 'en' : 'pt';
    test(`/${locale}/library states the shelf's RULE in its og:description, never its contents`, async ({
      request,
    }) => {
      const body = await (await request.get(`/${locale}/library/`)).text();
      const og = /property="og:description" content="([^"]*)"/.exec(body)?.[1] ?? '';
      expect(og).toContain(LIBRARY_OG[locale].rule);
      expect(og).not.toContain(LIBRARY_OG[locale].contents);
      expect(og).not.toContain(LIBRARY_OG[other].rule);
    });
  }

  for (const path of ['/', '/pt/', '/en/'] as const) {
    test(`${path} (the landing) does not carry the curation claim`, async ({ request }) => {
      const body = await (await request.get(path)).text();
      expect(body).not.toContain('A régua pra entrar aqui');
      expect(body).not.toContain('The bar for getting listed here');
      expect(body).not.toContain(BAR_HREF);
    });
  }
});

// 4 · hreflang reciprocity + self-canonical — each locale page lists pt + en + x-default with ABSOLUTE
// URLs; the canonical is SELF, never cross-locale; both editions advertise the SAME alternate set.
test.describe('hreflang reciprocity + self-canonical', () => {
  // x-default is the PREFIXED English URL (#200). It used to be the bare `/me`, which the prerender never
  // snapshots — CloudFront answers it 200 from /index.html, i.e. with the HOME page's OG card.
  const ALT = {
    pt: `hreflang="pt" href="${SITE}/pt/me"`,
    en: `hreflang="en" href="${SITE}/en/me"`,
    xDefault: `hreflang="x-default" href="${SITE}/en/me"`,
  };

  test('the pt edition lists the full alternate set and self-canonicals', async ({ request }) => {
    const body = await (await request.get('/pt/me/')).text();
    expect(body).toContain(ALT.pt);
    expect(body).toContain(ALT.en);
    expect(body).toContain(ALT.xDefault);
    expect(body).toContain(`rel="canonical" href="${SITE}/pt/me"`); // self, not /en/me
  });

  test('the en edition lists the SAME alternate set and self-canonicals', async ({ request }) => {
    const body = await (await request.get('/en/me/')).text();
    expect(body).toContain(ALT.pt);
    expect(body).toContain(ALT.en);
    expect(body).toContain(ALT.xDefault);
    expect(body).toContain(`rel="canonical" href="${SITE}/en/me"`); // self, not /pt/me
  });
});

// 4b · Per-locale ARTICLE slugs (ADR-0037, this issue): the two editions live at DIFFERENT slugs — EN
// `/en/blog/my-commitment`, PT `/pt/blog/meu-compromisso`. Each prerendered edition self-canonicals to its
// OWN slug and advertises the reciprocal hreflang pair. The old shared EN URL `/en/blog/meu-compromisso`
// is a client-side not-found (never prerendered, never in the sitemap).
//
// x-default is the PREFIXED English article URL (#200). The bare `/blog/my-commitment` was worse than
// merely un-snapshotted: unprefixed paths redirect PRESERVING the path and slugs are per-locale, so a
// pt-BR reader following it landed on `/pt/blog/my-commitment` — a route that does not exist — and fell
// through to the blog listing. It never reached the article at all.
test.describe('per-locale article slugs', () => {
  const EN_ART = `${SITE}/en/blog/my-commitment`;
  const PT_ART = `${SITE}/pt/blog/meu-compromisso`;
  const ALT = {
    pt: `hreflang="pt" href="${PT_ART}"`,
    en: `hreflang="en" href="${EN_ART}"`,
    xDefault: `hreflang="x-default" href="${EN_ART}"`,
  };

  test('the en edition self-canonicals to its own slug and lists the reciprocal pair', async ({ request }) => {
    const body = await (await request.get('/en/blog/my-commitment/')).text();
    expect(body).toMatch(/<html[^>]*lang="en"/);
    expect(body).toContain(`rel="canonical" href="${EN_ART}"`); // self, English slug
    expect(body).toContain(ALT.pt);
    expect(body).toContain(ALT.en);
    expect(body).toContain(ALT.xDefault);
  });

  test('the pt edition self-canonicals to its own slug and lists the SAME reciprocal pair', async ({ request }) => {
    const body = await (await request.get('/pt/blog/meu-compromisso/')).text();
    expect(body).toMatch(/<html[^>]*lang="pt-BR"/);
    expect(body).toContain(`rel="canonical" href="${PT_ART}"`); // self, Portuguese slug
    expect(body).toContain(ALT.pt);
    expect(body).toContain(ALT.en);
    expect(body).toContain(ALT.xDefault);
  });

  test('the old shared EN slug /en/blog/meu-compromisso is an in-app not-found', async ({ page }) => {
    await page.goto('/en/blog/meu-compromisso');
    // The article body never renders; the not-found notice does (English chrome).
    await expect(page.getByRole('heading', { level: 1, name: /My Commitment/ })).toHaveCount(0);
    await expect(page.getByText(/does not exist or is not published/i)).toBeVisible();
  });

  // The withdrawn article (published 2026-08-14, taken down 2026-08-21) — both editions. The sitemap
  // guard below proves the URLs are no longer ADVERTISED; this proves they no longer SERVE the piece,
  // which is the half a reader with the link in their history actually experiences. Kept as a live
  // assertion rather than deleted with the content: the article is held on
  // `content/hold-engineer-the-loop` for a deliberate re-publication, and until that happens "this URL
  // shows the not-found, not the article" is a behaviour worth pinning.
  //
  // The not-found notice is asserted in the ROUTE'S OWN language, not with an either-locale regex: the
  // withdrawn URLs are locale-prefixed, so a notice served in the wrong language is its own defect and
  // an OR would pass straight through it — the same shape as the shared-slug test above.
  for (const [url, title, notice] of [
    ['/pt/blog/por-que-eu-projeto-o-loop', /Por Que Eu Projeto o Loop/, /não existe ou não está publicado/i],
    ['/en/blog/why-i-engineer-the-loop', /Why I Engineer the Loop/, /does not exist or is not published/i],
  ] as const) {
    test(`the withdrawn article ${url} is an in-app not-found`, async ({ page }) => {
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1, name: title })).toHaveCount(0);
      await expect(page.getByText(notice)).toBeVisible();
    });
  }

  // #204 — the UNPREFIXED article URL must reach the article in BOTH locales. It is the "clean" form a
  // human types or shares, and it is what was advertised as x-default until #200. Because the redirect
  // re-prefixed the path verbatim while slugs are per-locale, a pt-BR reader following the English slug
  // landed on `/pt/blog/my-commitment` — nonexistent — and fell through to the landing. An English reader
  // got the article, so the bug was invisible to the person most likely to test it.
  test('a bare article URL reaches the article for a pt-BR reader, mapping the slug', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'pt-BR' });
    const page = await ctx.newPage();
    await page.goto('/blog/my-commitment'); // the ENGLISH slug, unprefixed
    await expect(page).toHaveURL(/\/pt\/blog\/meu-compromisso$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Meu Compromisso' })).toBeVisible();
    await ctx.close();
  });

  test('a bare article URL reaches the article for an English reader, mapping the slug', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'en-US' });
    const page = await ctx.newPage();
    await page.goto('/blog/meu-compromisso'); // the PORTUGUESE slug, unprefixed
    await expect(page).toHaveURL(/\/en\/blog\/my-commitment$/);
    await expect(page.getByRole('heading', { level: 1, name: 'My Commitment' })).toBeVisible();
    await ctx.close();
  });

  test('a bare article URL with an unknown slug still falls to the in-locale not-found', async ({ page }) => {
    await page.goto('/blog/no-such-article');
    await expect(page.getByText(/does not exist or is not published/i)).toBeVisible();
  });
});

// 5 · x-default served-HTML — the bare-root snapshot is English, OG-complete, hreflang x-default → the bare
// origin.
test.describe('x-default root snapshot', () => {
  test('serves an English, OG-complete x-default page at bare /', async ({ request }) => {
    const body = await (await request.get('/')).text();
    expect(body).toMatch(/<html[^>]*lang="en"/);
    expect(body).toContain('property="og:locale" content="en_US"');
    expect(body).toContain(`hreflang="x-default" href="${SITE}/"`);
    expect(body).toContain(`hreflang="pt" href="${SITE}/pt"`);
    expect(body).toContain(`hreflang="en" href="${SITE}/en"`);
    // OG-complete: title, image + wide-card dimensions present.
    expect(body).toContain('property="og:title"');
    expect(body).toContain('property="og:image" content="' + SITE + '/og-default.png"');
    expect(body).toContain('property="og:image:width" content="1200"');
  });
});

// 5b · The card is in the reader's language too, not only the text beside it (#167).
//
// Read off the SERVED HTML rather than the hook, because the hook is what I wrote and the artifact is
// what a scraper fetches. Asserted as the FULL attribute: `toContain('og-default')` would pass on the
// English card, so it could not fail for the defect it is named after.
test.describe('per-locale default OG card', () => {
  test('a pt route advertises the pt card, an en route the unsuffixed one', async ({ request }) => {
    // Trailing slash: `vite preview` serves the prerendered file, it does not do the clean-URL rewrite
    // — that is the CloudFront Function's job and `edge-rewrite.spec.ts` is what proves it runs.
    const pt = await (await request.get('/pt/me/')).text();
    expect(pt).toContain(`property="og:image" content="${SITE}/og-default.pt.png"`);
    expect(pt).toContain('property="og:image:alt" content="tadeumendonca.io — aprenda a construir com IA');

    const en = await (await request.get('/en/me/')).text();
    expect(en).toContain(`property="og:image" content="${SITE}/og-default.png"`);
    expect(en).toContain('property="og:image:alt" content="tadeumendonca.io — learn to build with AI');
  });

  // Both cards must actually be SERVED — the head can advertise a URL the deploy never uploaded, and a
  // 404 og:image is pinned by every scraper that fetches it exactly like a good one is.
  test('both default cards are served, as PNGs', async ({ request }) => {
    for (const path of ['/og-default.png', '/og-default.pt.png']) {
      const res = await request.get(path);
      expect(res.status(), `${path} must be served`).toBe(200);
      expect(res.headers()['content-type']).toContain('image/png');
    }
  });
});

// 6 · The bare-root redirect preserves the sub-path, per detected locale.
test.describe('bare-root redirect preserves the sub-path', () => {
  test.describe('pt-BR context', () => {
    test.use({ locale: 'pt-BR' });
    test('/me → /pt/me and bare / → /pt', async ({ page }) => {
      await page.goto('/me');
      await expect(page).toHaveURL(/\/pt\/me$/);
      await page.goto('/');
      await expect(page).toHaveURL(/\/pt$/);
    });
  });

  test.describe('en-US context', () => {
    test.use({ locale: 'en-US' });
    test('/me → /en/me and bare / → /en', async ({ page }) => {
      await page.goto('/me');
      await expect(page).toHaveURL(/\/en\/me$/);
      await page.goto('/');
      await expect(page).toHaveURL(/\/en$/);
    });
  });
});

// 7 · The locale OFFER (#172). A shared link pins the sharer's language (ADR-0036), so a pt-BR reader can
// land on `/en/...` with no obvious way back. The offer surfaces the switch WITHOUT taking the decision:
// the link keeps working as sent, and the reader opts in.
test.describe('locale offer on a link that pins the other language', () => {
  test.describe('a pt-BR reader on an English link', () => {
    test.use({ locale: 'pt-BR' });

    test('is offered Portuguese, and accepting lands on the sibling URL', async ({ page }) => {
      await page.goto('/en/me/');
      const offer = page.getByRole('region', { name: LOCALE_OFFER_LABEL.pt });
      await expect(offer).toBeVisible();
      // Written in the reader's language, not the page's — the whole point is that they may not read
      // the page's language.
      await expect(offer).toHaveAttribute('lang', 'pt-BR');

      await offer.getByRole('button', { name: 'Ler em português' }).click();
      await expect(page).toHaveURL(/\/pt\/me\/?$/);
      // Same logical route, not the landing.
      await expect(page.getByRole('heading', { level: 1, name: 'Luiz Tadeu Mendonça' })).toBeVisible();
      // Not re-offered on the edition just chosen.
      await expect(page.getByRole('region', { name: new RegExp(LOCALE_OFFER_LABELS.join('|')) })).toHaveCount(0);
    });

    test('is not offered again after dismissing, on this or another page', async ({ page }) => {
      await page.goto('/en/me/');
      await page.getByRole('button', { name: 'Continuar em inglês' }).click();
      await expect(page.getByRole('region', { name: LOCALE_OFFER_LABEL.pt })).toHaveCount(0);
      await page.goto('/en/portfolio/');
      await expect(page.getByRole('region', { name: LOCALE_OFFER_LABEL.pt })).toHaveCount(0);
    });

    // The branch the plan-review flagged as most likely to regress silently: a reader who CHOSE the
    // English edition with the toggle is reading it on purpose, and must not be second-guessed. Driven
    // through the real toggle rather than by seeding localStorage, so it exercises the same write the
    // product does.
    test('is not offered when the reader chose this edition with the toggle', async ({ page }) => {
      await page.goto('/pt/me/');
      await page.getByRole('group', { name: 'Idioma' }).getByRole('button', { name: 'EN' }).click();
      await expect(page).toHaveURL(/\/en\/me\/?$/);
      await expect(page.getByRole('region', { name: LOCALE_OFFER_LABEL.pt })).toHaveCount(0);
    });
  });

  test.describe('an en-US reader on the English edition', () => {
    test.use({ locale: 'en-US' });
    test('is offered nothing — the page is already their language', async ({ page }) => {
      await page.goto('/en/me/');
      await expect(page.getByRole('region', { name: new RegExp(LOCALE_OFFER_LABELS.join('|')) })).toHaveCount(0);
    });
  });

  // #323, and this journey is the ONE that could have caught the defect. Every other assertion about the
  // offer lives within a single visit; this one crosses sessions, which is where the bug was — the dismiss
  // handler wrote only the dismissal flag, so the next open at the bare root fell through to
  // navigator.language and served English forever, with the offer permanently silenced.
  //
  // It belongs at THIS layer specifically. jsdom was green for the entire life of the defect: it has no
  // real bare-root redirect, so nothing below Playwright can assert that a stored choice actually decides
  // which edition a later visit lands on. That is criterion 6 — behaviour proved where it runs — and on a
  // static site this suite is the only artifact that can carry it.
  test.describe('the dismissal that means "stay in this language" survives the session', () => {
    test.use({ locale: 'en-US' });

    test('answering the offer on /pt makes the bare root resolve to /pt afterwards', async ({ page }) => {
      // en-US visitor on the Portuguese edition: the offer appears, written in English.
      await page.goto('/pt/me/');
      const offer = page.getByRole('region', { name: LOCALE_OFFER_LABEL.en });
      await expect(offer).toBeVisible();

      // "Continue in Portuguese" — an affirmative statement of preference, not merely closing the notice.
      await offer.getByRole('button', { name: 'Continue in Portuguese' }).click();
      await expect(page.getByRole('region', { name: LOCALE_OFFER_LABEL.en })).toHaveCount(0);

      // A later visit entering at the bare root. Before the fix this resolved to /en — the browser is
      // still en-US and nothing had been stored — which is the reported symptom in one line.
      await page.goto('/');
      await expect(page).toHaveURL(/\/pt\/?$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    });
  });
});

// 8 · Sitemap drift guard — one <loc> per (locale, route) plus the x-default root, each with xhtml:link
// alternates, and no retired/redirect paths.
test.describe('sitemap advertises every per-locale URL', () => {
  // Shared-slug routes: the same logical path under both prefixes. `/library` (#166) joins them —
  // one English slug prefixed twice, like the five before it. This arithmetic going red when a route is
  // added is the guard working; it is updated in the same commit as the route.
  const SHARED = ['/', '/me', '/portfolio', '/ramp-up', '/architecture', '/library'];
  // Every article carries a PER-LOCALE slug (ADR-0037), so each one's two <loc>s do NOT share a path.
  // This list moves by one entry per article — the same "arithmetic going red" guard as SHARED above.
  // It moves in BOTH directions: an article withdrawn from `src/content/blog/` leaves this list in the
  // same commit, and its two URLs move to WITHDRAWN below rather than simply disappearing from the file.
  const ARTICLES = [
    { pt: `${SITE}/pt/blog/meu-compromisso`, en: `${SITE}/en/blog/my-commitment` },
    { pt: `${SITE}/pt/blog/da-cloud-a-ia-sem-trocar-de-cracha`, en: `${SITE}/en/blog/from-cloud-to-ai-same-badge` },
  ];
  // Slugs that were published and have been CORRECTED (ADR-0010's back-compat contract). Unlike WITHDRAWN
  // below, the article is still live — at a different address — so these must stay reachable via redirect
  // and must NOT be advertised: a redirect in the sitemap tells a crawler two URLs are canonical for one
  // page, which is the duplicate-content signal the per-locale canonical exists to avoid. The redirect
  // itself is asserted in routes.spec.ts; this is the other half — that the retired address is gone from
  // everything that ADVERTISES a URL.
  const SUPERSEDED = [
    `${SITE}/pt/blog/o-problema-parou-de-variar`,
    `${SITE}/en/blog/the-problem-stopped-changing`,
  ];
  // Articles that were live and were taken down. Asserted absent, not merely dropped from ARTICLES:
  // deleting the entry alone would leave the count green if the prerender ever kept serving the route,
  // and a URL that stays advertised after a takedown is what keeps a crawler coming back to it.
  // `why-i-engineer-the-loop` / `por-que-eu-projeto-o-loop` — published 2026-08-14, withdrawn 2026-08-21;
  // the content is held on `content/hold-engineer-the-loop` for a deliberate re-publication.
  const WITHDRAWN = [`${SITE}/pt/blog/por-que-eu-projeto-o-loop`, `${SITE}/en/blog/why-i-engineer-the-loop`];
  const LOGICAL_COUNT = SHARED.length + ARTICLES.length;

  test('lists routes × locales + x-default, with alternates and no retired paths', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text();
    expect(body).toContain('xmlns:xhtml=');

    for (const route of SHARED) {
      const pt = route === '/' ? `${SITE}/pt` : `${SITE}/pt${route}`;
      const en = route === '/' ? `${SITE}/en` : `${SITE}/en${route}`;
      expect(body).toContain(`<loc>${pt}</loc>`);
      expect(body).toContain(`<loc>${en}</loc>`);
    }
    // Every article's per-locale <loc>s.
    for (const article of ARTICLES) {
      expect(body).toContain(`<loc>${article.pt}</loc>`);
      expect(body).toContain(`<loc>${article.en}</loc>`);
    }
    // The old shared-slug EN URL is NEVER advertised (it is a not-found now).
    expect(body).not.toContain(`<loc>${SITE}/en/blog/meu-compromisso</loc>`);
    // Neither is any withdrawn article, in either locale.
    for (const url of WITHDRAWN) expect(body).not.toContain(`<loc>${url}</loc>`);
    // Nor any corrected-away address: it redirects, and a redirect is never a <loc>.
    for (const url of SUPERSEDED) expect(body).not.toContain(`<loc>${url}</loc>`);
    // The x-default homepage entry.
    expect(body).toContain(`<loc>${SITE}/</loc>`);

    // Every <url> carries alternates.
    const locCount = (body.match(/<loc>/g) ?? []).length;
    const altCount = (body.match(/xhtml:link/g) ?? []).length;
    expect(locCount).toBe(LOGICAL_COUNT * 2 + 1); // routes × locales + x-default root
    expect(altCount).toBe(locCount * 3); // pt · en · x-default per <url>

    // No retired/redirect paths, and no UNPREFIXED locale routes advertised (only the x-default root is bare).
    expect(body).not.toContain('/articles');
    expect(body).not.toContain('/profile');
    expect(body).not.toContain(`<loc>${SITE}/cv</loc>`);
    expect(body).not.toContain(`<loc>${SITE}/me</loc>`); // bare /me is a redirect, never a <loc>
    expect(body).not.toContain(`<loc>${SITE}/library</loc>`); // and neither is the bare /library (#166)
    expect(body).not.toContain(`<loc>${SITE}/blog</loc>`);
    // The localized-slug pair was proposed for this surface and declined (2026-08-05). A half-reverted
    // routing change fails the same way a half-shipped one does, so the absence is asserted rather than
    // assumed — no edition of any URL here carries the Portuguese word.
    expect(body).not.toContain('biblioteca');
  });
});

// 9 · PDF single-source — one downloadable CV, the English canonical (ADR-0024/0034). Both /me editions
// point at the SAME static /cv.pdf asset (not a per-locale PDF), and it is a real PDF.
// The prerender snapshots every route in an en-US browser, so anything rendering off the VISITOR rather
// than the route leaks that browser's identity into HTML served to everyone. The locale offer (#172) is
// the first such component, and it did leak: the initial implementation gated on a post-mount flag, which
// this prerender defeats by construction — it snapshots a live, already-hydrated page.
//
// Asserted against the SHIPPED HTML rather than in a component test, because that is where the defect
// existed: every unit test passed while `dist/pt/**` carried an offer to read in English.
test.describe('the prerendered HTML carries nothing visitor-specific', () => {
  // The LIVENESS legs. The guard's real assertion is negative, and a negative assertion never fails on a
  // bad selector: rename `localeSuggestion.notice` and the greps below search for a string that exists
  // nowhere, and pass having checked nothing (#231). So each label is first proven live on a page where
  // the offer MUST appear, matching the exact value the grep will use.
  //
  // BOTH directions, deliberately. The first version of this proved only `pt`, which left the `en` label
  // in exactly the state this exists to fix — and English is the canonical edition (ADR-0024), so an
  // English-only copy edit is the MORE likely one, and it was the one still unguarded.
  const STALE = 'the offer label changed — update e2e/locale-offer-labels.ts, or the absence check below verifies nothing';

  test.describe('a pt-BR reader on the English edition', () => {
    test.use({ locale: 'pt-BR' });
    test('still sees the Portuguese offer label', async ({ page }) => {
      await page.goto('/en/me/');
      await expect(page.getByRole('region', { name: LOCALE_OFFER_LABEL.pt }), STALE).toBeVisible();
    });
  });

  test.describe('an en-US reader on the Portuguese edition', () => {
    test.use({ locale: 'en-US' });
    test('still sees the English offer label', async ({ page }) => {
      await page.goto('/pt/me/');
      await expect(page.getByRole('region', { name: LOCALE_OFFER_LABEL.en }), STALE).toBeVisible();
    });
  });

  test('no locale-suggestion offer is baked into either edition', async ({ request }) => {
    for (const path of ['/pt/', '/en/', '/pt/me/', '/en/me/']) {
      const html = await (await request.get(path)).text();
      // Both directions: the pt snapshot must not offer English, and the en snapshot must not offer
      // Portuguese. Matching the aria-label catches the region whatever the button copy becomes.
      for (const label of LOCALE_OFFER_LABELS) {
        expect(html, `${path} carries a baked locale offer`).not.toContain(label);
      }
    }
  });
});

test.describe('the CV PDF is a single English-canonical asset', () => {
  test('both /me editions link the one shared /cv.pdf', async ({ page }) => {
    await page.goto('/en/me');
    await expect(page.getByRole('link', { name: /Download CV|Baixar/ }).first()).toHaveAttribute('href', '/cv.pdf');
    await page.goto('/pt/me');
    await expect(page.getByRole('link', { name: /Download CV|Baixar/ }).first()).toHaveAttribute('href', '/cv.pdf');
  });

  test('/cv.pdf is a real PDF, not the SPA shell', async ({ request }) => {
    const body = await (await request.get('/cv.pdf')).body();
    expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });
});
