import { test, expect } from '@playwright/test';

// Pinned to pt-BR chrome: these journeys assert localized strings ("Portfólio", "Ver no GitHub",
// "Artigos", "Ver catálogo completo"). The i18n auto-detect layer (ADR-0032) makes en-US the default
// rendered chrome, so pin the context to pt-BR to keep the routing assertions deterministic. Routing
// itself is language-neutral; only the visible labels these checks anchor on are localized.
test.use({ locale: 'pt-BR' });

// Routing regression. The landing/CV split moved every route, and the back-compat redirects exist so
// shared URLs and og:image deep-links keep resolving. Component tests can't prove a route still
// answers — only a real navigation can, so each route in App.tsx gets a journey here.
test.describe('routes', () => {
  test('/portfolio serves the full catalog with its GitHub links', async ({ page }) => {
    await page.goto('/portfolio');
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
    await page.goto('/ramp-up');
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
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: 'Ramp-up' }).click();
    await expect(page).toHaveURL(/\/ramp-up$/);
    await expect(page.getByRole('heading', { level: 1, name: /Ramp-Up/ })).toBeVisible();
  });

  // The architecture page is the fifth public surface. Its body is markdown-in-repo rendered through the
  // shared <Markdown>, and it is an orientation LAYER — it links canonical detail rather than restating
  // it. Unlike the ramp-up page it carries no video embeds, so this journey anchors on the heading plus
  // at least one outbound canonical link (both public repos + the catalog-ready gate must be reachable).
  test('/architecture serves the blueprint, linking canonical detail out', async ({ page }) => {
    await page.goto('/architecture');
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
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: 'Arquitetura' }).click();
    await expect(page).toHaveURL(/\/architecture$/);
    await expect(page.getByRole('heading', { level: 1, name: /Arquitetura/ })).toBeVisible();
  });

  test('reaches the full catalog from the landing shortlist', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Ver catálogo completo/ }).click();
    await expect(page).toHaveURL(/\/portfolio$/);
    await expect(page.getByRole('heading', { name: 'Portfólio' })).toBeVisible();
  });

  test('keeps the retired /blog list deep-link working by redirecting to the landing', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveURL(/\/#artigos$/);
    await expect(page.getByRole('heading', { name: 'Artigos' })).toBeVisible();
  });

  test('sends an unknown path back to the landing instead of a dead end', async ({ page }) => {
    await page.goto('/rota-que-nao-existe');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Artigos' })).toBeVisible();
  });
});
