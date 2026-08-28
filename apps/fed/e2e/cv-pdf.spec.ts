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

  // The page-count constraint is the whole point of the print stylesheet, and it is invisible: the
  // build succeeds, the asset is a valid PDF, and every other assertion here passes at five pages just
  // as happily as at the budgeted number. Nothing but a page count catches the regression, and the
  // regression arrives through CONTENT — one more role in profile.ts, a longer summary — not through a
  // CSS edit anyone would think to re-check the PDF for.
  //
  // THE NUMBER MOVED FROM 1 TO 2 (#317, owner 2026-07-31), deliberately and with the artifact looked at
  // rather than inferred. The one-page edition was working exactly as designed and the design was the
  // complaint: "o pdf não tá legal em 1 página, fica tudo muito apertado". It bought recruiter-
  // friendliness with 7.4pt type, sub-quarter-rem gaps, and a skills block reflowed into one continuous
  // keyword band with its proficiency meters hidden. At that density the sheet stops being scanned.
  //
  // UPDATING THIS ASSERTION IS THE POINT OF IT, NOT AN EXCEPTION TO IT. A page count that silently
  // drifts is the defect; a page count changed in the same commit as the decision, with the reason, is
  // the guard doing its job. What must never happen is the number being raised to make a red test green.
  //
  // AND FROM 2 TO 3 (#542, owner 2026-08-27) — same route, same discipline. Asked directly whether
  // `/cv.pdf` may grow or must stay at two with something else cut, he answered «pode aumentar sem
  // problemas». What the third page BUYS is the thing the two-page budget had been paying for with:
  // the current role's hands-on evidence. Four measured builds on 2026-08-27 had established that the
  // two named launches and the hands-on artefacts could not coexist inside two pages, so the hands-on
  // clause was dropped and `print_highlight_index` was left unset on every role — which left a reader
  // of the printed CV alone meeting ZERO building verbs under the current role. That is what #542 was
  // opened about, in the owner's words: «senao as pessoas entendem como somente papel».
  //
  // MEASURED, NOT PREDICTED: `npm run build:static` then this file's own regex over `dist/cv.pdf` → 3.
  // The number is raised in the same commit as the decision that spends it, which is the only form
  // this comment permits — and note what did NOT happen: nothing here was red first. The count was
  // taken after the copy change and the assertion follows it.
  //
  // THE CEILING IS ADR-0034's AND THE AMENDMENT IS `tech-lead`'s, not this file's. This assertion is
  // the mechanism, never the record. It is deliberately still a NUMBER rather than an upper bound or a
  // deleted test: a budget that is simply removed removes the measurement with it, and the artifact
  // then grows one honest slice at a time until someone reads it and is surprised.
  //
  // Counted straight out of the bytes rather than with a PDF library: `/Type /Page` (excluding the
  // `/Pages` tree node) is stable in Chromium's output, and a dependency for one integer is not worth
  // the supply-chain surface on a repo that pins and audits them.
  test('fits the budgeted three A4 pages', async ({ request }) => {
    const body = (await (await request.get('/cv.pdf')).body()).toString('latin1');
    const pages = body.match(/\/Type\s*\/Page(?![s/\w])/g) ?? [];
    expect(pages, 'the CV PDF must stay within three pages — trim the print view, not this assertion').toHaveLength(
      3,
    );
  });

  // ADR-0034's 2026-07-28 amendment gave up "the PDF cannot disagree with /me" and replaced it with a
  // narrower promise: every ROLE, every CERTIFICATION and every SKILL keyword survives into print —
  // what the one-page edition drops is elaboration and decoration, never a claim. That invariant was
  // unguarded, and it is the more dangerous of the two: the page-count test would happily pass on a
  // print stylesheet that fits by deleting a job.
  //
  // Counted rather than enumerated — screen first, print second, and the two must agree. A hardcoded
  // list would have to be edited every time profile.ts grows, and an assertion nobody maintains is one
  // somebody eventually weakens to make it pass.
  test('print drops no role, no certification and no skill', async ({ page }) => {
    await page.goto('/en/me');
    // `goto` resolves at 'load', which here is the SPA shell — the CV blocks are not in the DOM yet, and
    // a raw querySelectorAll at that moment counts zero of everything. The other tests in this file never
    // hit it because `toBeVisible()` auto-waits; this one reads the DOM directly, so it has to wait
    // explicitly or it would compare nothing to nothing and pass.
    await expect(page.locator('[data-print-block="04"]')).toBeVisible();

    const countVisible = (selector: string) =>
      page.evaluate(
        // Serialized into the browser page — `document`/`getComputedStyle` are the page's, not Node's.
        (sel) => [...document.querySelectorAll(sel)].filter((el) => getComputedStyle(el).display !== 'none').length,
        selector,
      );
    // Roles, certification entries (link or plain), and skill keywords.
    const SELECTORS = [
      '[data-print-block="01"] > div:last-child > div > div',
      '[data-print-block="03"] > div:last-child > div > *',
      '[data-print-block="04"] > div:last-child > div > div > div:last-child > span',
    ];

    const onScreen = await Promise.all(SELECTORS.map(countVisible));
    // Sanity: the counts must be non-zero, or the selectors have drifted and this test would "pass" by
    // comparing nothing to nothing — the exact failure mode it exists to prevent.
    for (const [i, n] of onScreen.entries()) expect(n, `nothing matched ${SELECTORS[i]}`).toBeGreaterThan(0);

    await page.emulateMedia({ media: 'print' });
    const inPrint = await Promise.all(SELECTORS.map(countVisible));

    expect(inPrint, 'the print edition may drop elaboration and decoration — never a claim').toEqual(onScreen);
  });

  // The page count above no longer says anything about whether a bullet printed, and #542 is the reason:
  // it set `print_highlight_index` on the current role AND lengthened the practice lines past the point
  // where the budget discriminated. Measured 2026-08-27, three builds, one variable — `main` 0 bullets /
  // 2 pages, head 1 bullet / 3 pages, head with the index out of range 0 bullets / STILL 3 pages. The
  // slice created the exposure and destroyed the signal, so the printed bullet needs its own guard.
  //
  // TWO LAYERS, DELIBERATELY, because they fail on different mutations and neither subsumes the other:
  //   · `src/data/resolveProfile.test.ts` proves the index is IN RANGE — it catches `99`, on every role,
  //     with no build. That is the floor.
  //   · this test proves the kept bullet is the RIGHT one and that it SURVIVES print — it catches `0`
  //     (in range, wrong meaning, invisible to the floor) and it catches a stylesheet regression that
  //     would hide the <li> the data correctly marked. Neither of those is a data-shape defect, so
  //     neither is reachable from a unit test over `profile.ts`.
  //
  // The TOKEN is pinned, not the sentence — the same shape `types/profile.ts` prescribes for the
  // unpinned `GenAI` clause. Rewording the bullet stays free; losing the build verb under the current
  // role does not, because that verb IS #542 («senao as pessoas entendem como somente papel»).
  test('the print edition keeps a hands-on bullet under the current role', async ({ page }) => {
    await page.goto('/en/me');
    // Same wait as the count test above: `goto` resolves at the SPA shell, and a locator read before
    // hydration would count zero of everything and pass.
    await expect(page.locator('[data-print-block="01"]')).toBeVisible();

    const kept = page.locator('[data-print-block="01"] li[data-print-keep]');
    // Exactly one, across every role: the selection rule prints ONE item, and two kept bullets would be
    // a page-budget change nobody decided.
    await expect(kept).toHaveCount(1);
    await expect(kept, 'the printed CV must keep a bullet written as BUILDING under the current role').toContainText(
      'Built, hands-on,',
    );

    await page.emulateMedia({ media: 'print' });
    // The data marking a bullet and the stylesheet printing it are two mechanisms; assert the second.
    expect(await display(kept), 'the marked highlight must survive into the print edition').toBe('list-item');
    // …and the control: an unmarked sibling is still dropped, so a stylesheet that printed EVERY <li>
    // (blowing the budget silently, since the count assertion is a fixed number in the other direction)
    // would redden here rather than read as this test passing.
    const dropped = page.locator('[data-print-block="01"] li:not([data-print-keep])').first();
    expect(await display(dropped), 'unmarked highlights must stay dropped from the print edition').toBe('none');
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
    // "Stack", not "Subjects" — the strip's label changed on 2026-07-31 and this locator was left
    // pointing at a string the app no longer contains. Because the check is conditional, it would
    // have gone on passing forever while verifying nothing: `count()` returns 0 and the block is
    // skipped. A guard that can never find its subject is indistinguishable from a guard that found
    // it and was satisfied.
    const marquee = page.locator('[aria-label="Stack"]');
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
