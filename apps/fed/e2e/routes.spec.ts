import { test, expect } from '@playwright/test';

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

  test('keeps the retired /articles list deep-link working by redirecting to the landing', async ({ page }) => {
    await page.goto('/articles');
    await expect(page).toHaveURL(/\/#artigos$/);
    await expect(page.getByRole('heading', { name: 'Artigos' })).toBeVisible();
  });

  test('keeps the legacy /articles/:slug permalink rendering the article', async ({ page }) => {
    await page.goto('/articles/building-serverless-on-aws');
    await expect(page.getByRole('heading', { name: 'Building Serverless on AWS' })).toBeVisible();
  });

  test('sends an unknown path back to the landing instead of a dead end', async ({ page }) => {
    await page.goto('/rota-que-nao-existe');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Artigos' })).toBeVisible();
  });
});
