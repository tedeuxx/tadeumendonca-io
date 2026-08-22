import { test, expect, type Page } from '@playwright/test';

// Scroll position across a client-side route change. The reported defect, in the owner's words:
// "quando você clica no artigo na home a página do artigo não está carregando no topo do artigo" —
// click an article card partway down the landing and the article opens at the offset the landing was
// left at, mid-paragraph.
//
// ONLY A REAL NAVIGATION CAN PROVE THIS. jsdom has no layout and no scroll position, so the unit test
// beside the hook can assert WHICH call is made and never that the reader ends up at the top. That is
// this file's whole reason to exist.
//
// AND EVERY JOURNEY HERE SCROLLS BEFORE IT ASSERTS, which is the trap this specific test walks into:
// a fresh page load starts at the top anyway, so `expect(scrollY).toBe(0)` after a navigation passes
// on a completely unfixed build unless the previous page was genuinely scrolled first. Each test
// therefore asserts a non-zero offset BEFORE the click, as a guard on itself.
test.use({ locale: 'pt-BR' });

const offset = (page: Page) => page.evaluate(() => window.scrollY);

test.describe('scroll position on route change', () => {
  test('opening an article from the landing lands at the top of the article', async ({ page }) => {
    await page.goto('/pt/');

    // The last "Ler artigo" control — the deepest row in the list, so the landing is genuinely scrolled
    // rather than nudged.
    const read = page.getByRole('link', { name: 'Ler artigo' }).last();
    await read.scrollIntoViewIfNeeded();

    // THE SELF-GUARD. Without a real offset here the assertion at the end of this test is vacuous.
    const before = await offset(page);
    expect(before).toBeGreaterThan(200);

    await read.click();
    await expect(page).toHaveURL(/\/pt\/blog\/[^/]+$/);
    // The article's own title — proof the route rendered, so the offset below is measured on the
    // article page and not on a landing that never navigated. `.last()` because the page carries TWO
    // level-1 headings: the "Blog" column header in the shell, then the article title.
    await expect(page.getByRole('heading', { level: 1 }).last()).toBeVisible();

    await expect.poll(() => offset(page)).toBe(0);
  });

  // The back button is the half a naive scroll-to-top-on-every-navigation breaks, and it breaks it
  // silently: every forward journey stays green. A reader who opens an article and returns expects the
  // row they were reading, not the top of a list they already scrolled.
  test('going back from an article restores the reader position on the landing', async ({ page }) => {
    await page.goto('/pt/');

    const read = page.getByRole('link', { name: 'Ler artigo' }).last();
    await read.scrollIntoViewIfNeeded();
    const before = await offset(page);
    expect(before).toBeGreaterThan(200);

    await read.click();
    await expect(page).toHaveURL(/\/pt\/blog\/[^/]+$/);
    await expect.poll(() => offset(page)).toBe(0);

    await page.goBack();
    await expect(page).toHaveURL(/\/pt\/$/);

    // Restored to roughly where they were. Not exact: the browser's own restoration re-derives the
    // offset from the document it renders, and asserting equality would make this test a claim about
    // pixel-identical relayout rather than about the reader keeping their place.
    await expect.poll(() => offset(page)).toBeGreaterThan(before - 100);
  });

  // `/blog` → `/#artigos` is a live in-app redirect (App.tsx). It is a router navigation carrying a
  // hash, so it is exactly what a blanket scroll-to-top would break — the reader would be dropped at
  // the hero instead of on the articles section they asked for.
  test('the /blog redirect still lands on the #artigos section, not at the top', async ({ page }) => {
    await page.goto('/pt/blog');
    await expect(page).toHaveURL(/\/pt\/#artigos$/);

    const articles = page.locator('#artigos');
    await expect(articles).toBeVisible();

    // The section ends up at the top of the viewport. POLLED, not read once: this branch deliberately
    // leaves `behavior` at the default so it inherits `html { scroll-behavior: smooth }`, so the
    // offset is ANIMATING — the first version of this test read the rect once and caught it mid-flight
    // at 468px. Polling is what makes the assertion about where the reader lands rather than about how
    // fast the machine running it is.
    await expect
      .poll(() => articles.evaluate((el) => Math.abs(el.getBoundingClientRect().top)))
      .toBeLessThan(80); // the section carries scroll-mt-[--header-h], and --header-h is 56px

    // And NOT at offset 0 — which is the difference between "the anchor was honoured" and "we scrolled
    // to the top and the section happens to be visible from there".
    expect(await offset(page)).toBeGreaterThan(200);
  });
});
