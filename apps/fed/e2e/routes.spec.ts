import { test, expect } from '@playwright/test';

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
    await expect(facades).toHaveCount(3);

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
    await expect(page.getByRole('link', { name: 'tadeumendonca-io' }).first()).toHaveAttribute(
      'href',
      'https://github.com/tedeuxx/tadeumendonca-io',
    );
    await expect(page.getByRole('link', { name: 'tadeumendonca-skills' }).first()).toHaveAttribute(
      'href',
      'https://github.com/tedeuxx/tadeumendonca-skills',
    );
    await expect(page.getByRole('link', { name: 'docs/catalog-ready.md' })).toHaveAttribute(
      'href',
      'https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/catalog-ready.md',
    );
  });

  test('reaches the architecture page from the nav', async ({ page }) => {
    await page.goto('/pt');
    await page.getByRole('navigation').getByRole('link', { name: 'Arquitetura' }).click();
    await expect(page).toHaveURL(/\/pt\/architecture$/);
    await expect(page.getByRole('heading', { level: 1, name: /Arquitetura/ })).toBeVisible();
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
