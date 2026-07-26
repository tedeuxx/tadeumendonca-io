import { test, expect, type Locator } from '@playwright/test';

// CV PDF export (#140, ADR-0002 static-asset approach). The PDF is generated at BUILD time by the
// prerender pass (scripts/prerender.mjs drives `page.pdf()` over /me) and served as a plain static
// asset, reached by an `<a href="/cv.pdf" download>` — no runtime JS. These journeys prove: the asset
// is a real PDF (not the SPA shell masquerading as one, same guard as seo.spec.ts's robots/sitemap),
// the download control is present on /me, and the @media print stylesheet turns /me into a clean CV
// (chrome display:none, CV substance kept). No pixel/snapshot comparison (repo convention: no visual
// tests) — only computed style + role/text assertions.
//
// Pinned to en-US: the download label is chrome that localizes, and English is the prerender/E2E
// baseline (the label reads "Download CV (PDF)").
test.use({ locale: 'en-US' });

const display = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).display);

test.describe('CV PDF export', () => {
  test('serves a real static /cv.pdf, not the SPA shell', async ({ request }) => {
    const res = await request.get('/cv.pdf');
    expect(res.status()).toBe(200);
    const body = await res.body();
    // A real PDF starts with the "%PDF-" signature...
    expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    // ...and is NOT index.html falling through (vite preview / CloudFront map a miss → the SPA shell).
    const head = body.subarray(0, 512).toString('latin1').toLowerCase();
    expect(head).not.toContain('<!doctype html>');
    expect(head).not.toContain('<html');
  });

  test('offers a Download-CV link on /me pointing at the static asset', async ({ page }) => {
    await page.goto('/en/me');
    const link = page.getByRole('link', { name: 'Download CV (PDF)' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /\/cv\.pdf$/);
    await expect(link).toHaveAttribute('download', /.+/);
  });

  test('print media hides the web chrome and keeps the CV substance', async ({ page }) => {
    await page.goto('/en/me');
    // The CV is present up front (the substance that must SURVIVE print).
    await expect(page.getByRole('heading', { level: 1, name: 'Luiz Tadeu Mendonça' })).toBeVisible();

    await page.emulateMedia({ media: 'print' });

    // Chrome collapses to display:none via the [data-print="hide"] hook. Each element is targeted
    // directly, so its OWN computed display is 'none' (not merely inside a hidden ancestor). These use
    // DOM/CSS locators, not getByRole: a display:none node is pruned from the accessibility tree, so a
    // role query would resolve to zero elements once print is emulated.
    expect(await display(page.locator('nav').first())).toBe('none');
    expect(await display(page.locator('footer').first())).toBe('none');
    expect(await display(page.locator('[role="group"][aria-label="Language"]').first())).toBe('none');
    expect(await display(page.locator('a[href="/cv.pdf"][download]'))).toBe('none');
    // The marquee lives on the landing, not /me — guard for its absence (like the conditional consent
    // button) rather than assume it renders here.
    const marquee = page.locator('[aria-label="Subjects"]');
    if ((await marquee.count()) > 0) {
      expect(await display(marquee.first())).toBe('none');
    }

    // The CV substance stays: the owner's name + every section heading.
    await expect(page.getByRole('heading', { level: 1, name: 'Luiz Tadeu Mendonça' })).toBeVisible();
    for (const heading of ['Experience', 'Education', 'Certifications', 'Skills']) {
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
  });
});
