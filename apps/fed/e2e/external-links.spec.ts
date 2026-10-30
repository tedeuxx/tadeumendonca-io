import { test, expect } from '@playwright/test';

// #712 — an external link in an article body opens in a NEW TAB; a site-internal one does not.
//
// The owner, reading a held preview, followed an article's link to a worked example and the example
// replaced the article. The unit suite pins the rule in jsdom; this pins it on the BUILT, PRERENDERED
// page, in both places a reader can meet it: the served HTML (what a reader gets before hydration, and
// what a crawler reads) and the hydrated DOM. A rule that only held after hydration, or that hydration
// stripped, would pass jsdom and fail here.
//
// The fixture is a PUBLISHED article that carries both kinds of link in its body, so the positive case
// and its control come from the same render: `tedeuxx/mhw` on GitHub (external) and `/architecture`
// (internal, localized to `/en/architecture`).
const ARTICLE = '/en/blog/what-my-agents-do';
const EXTERNAL = 'https://github.com/tedeuxx/mhw';
const INTERNAL = '/en/architecture';

test.describe('article links (#712)', () => {
  test('the prerendered HTML already carries target and rel on the external link', async ({ request }) => {
    // The trailing slash addresses the article's own prerendered snapshot; without it the local preview
    // serves the SPA fallback, which has no article body. The anchor being FOUND is the anti-vacuity
    // control: the fallback carries no such link, so a fallback response fails here rather than passing.
    const response = await request.get(`${ARTICLE}/`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    const anchor = html.match(new RegExp(`<a[^>]*href="${EXTERNAL}"[^>]*>`))?.[0];
    expect(anchor, 'the external link is in the served HTML').toBeTruthy();
    expect(anchor).toContain('target="_blank"');
    expect(anchor).toContain('rel="noopener noreferrer"');
  });

  test('after hydration, external opens a new tab and internal stays in this one', async ({ page }) => {
    await page.goto(ARTICLE);
    const body = page.locator('.markdown');

    const external = body.locator(`a[href="${EXTERNAL}"]`).first();
    await expect(external).toHaveAttribute('target', '_blank');
    await expect(external).toHaveAttribute('rel', 'noopener noreferrer');

    const internal = body.locator(`a[href="${INTERNAL}"]`).first();
    await expect(internal).toBeVisible();
    await expect(internal).not.toHaveAttribute('target');
  });
});
