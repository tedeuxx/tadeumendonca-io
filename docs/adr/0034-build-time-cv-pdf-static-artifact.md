# 0034. The downloadable CV is a build-time PDF, printed from `/me` to a static asset

- **Status:** accepted
- **Date:** 2026-07-25
- **Deciders:** the owner
- **Driven by:** [ADR-0002](./0002-fully-static-spa-no-backend.md), [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md), [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)

## Context & problem
The CV exists on the site as versioned data — `profile.ts`, the canonical structured CV ([ADR-0024](./0024-profile-canonical-cv-cross-surface.md)) rendered at `/me` ([ADR-0010](./0010-routing-landing-cv-split-redirects.md)). But a *downloadable* CV — the file a recruiter saves or attaches — lived somewhere else entirely: a hand-maintained Canva design. Every positioning change therefore had to be authored twice, once into `profile.ts` and once, by re-typing, into Canva. That is exactly the cross-surface drift ADR-0024 exists to prevent, appearing as a **document** rather than as a claim: the two CVs can silently disagree because nothing derives one from the other.

So the site needs a decision about *how it produces a downloadable CV* that keeps it derived from the same single source — under the static-site constraint (no backend, no runtime compute — [ADR-0002](./0002-fully-static-spa-no-backend.md)) and without forfeiting the brutalist-mono identity ([ADR-0008](./0008-brutalist-mono-identity.md)).

## Decision drivers
- **Single source of truth for the CV** — the downloadable file must be *derived from* `profile.ts` (ADR-0024), not a parallel document that drifts.
- **The static-site constraint** — no backend, no runtime XHR, no request-time compute (ADR-0002); whatever produces the PDF runs at build, not on demand.
- **Brand fidelity** — the download should be the brutalist-mono site, not a generic résumé template ([ADR-0008](./0008-brutalist-mono-identity.md)).
- **Reuse over new dependency** — the build already owns a headless-browser prerender pass (Playwright — ADR-0004's accepted cost); prefer paying that cost again over adding a client-side PDF library.

## Considered options
1. **`window.print()` of a print view** — a `@media print` stylesheet and a "print / save as PDF" button that triggers the browser's print dialog. *Why not:* not a true one-click download — the reader lands in a print dialog and must choose "save as PDF"; fidelity is **browser- and OS-dependent** (margins, headers/footers, page breaks differ per client), so the artifact the owner reviews is not the artifact the reader gets.
2. **Client-side PDF library (react-pdf / pdf-lib)** — generate the PDF in the browser from `profile.ts`. *Why not:* adds a runtime dependency **and** forces a **second, duplicated CV layout** authored in the library's primitives — a parallel rendering of the same data, which reintroduces the very drift this decision is meant to close, just moved from Canva into code.
3. **Build-time Playwright print → static asset → link (chosen)** — the prerender pass (`scripts/prerender.mjs`) calls Playwright `page.pdf()` on the English `/me` route, formatted by a `@media print` stylesheet, emitting a static `/cv.pdf`; `/me` links it with `<a href="/cv.pdf" download>`. *Trade-off:* the PDF is **build-frozen** — regenerated only on deploy, exactly like the prerendered HTML and the OG images (ADR-0004). Acceptable because the CV content is *itself* build-time material (`profile.ts` + markdown), so there is nothing fresher a runtime render could capture.

## Decision outcome
Chosen: **option 3 — a build-time PDF, printed from the real `/me` page to a static asset.** The prerender pass renders `/me` (en-US) and calls Playwright `page.pdf()`; a `@media print` stylesheet formats it; the result ships as a plain static S3/CloudFront object `/cv.pdf`, linked from `/me` via `<a href="/cv.pdf" download>`. No backend, no runtime XHR, and **no new dependency** — Playwright is already a build-time cost (ADR-0004). Because the PDF is printed from the *actual rendered page*, it inherits the brutalist-mono identity for free and cannot layout-drift from the on-screen CV.

The `/cv.pdf` name collides with nothing: the `/cv` route redirect was **dropped pre-launch** (ADR-0010's 2026-07-24 amendment), so the path is free.

## Consequences
**Good**
- **One source, one CV.** The download is derived from `profile.ts` through the same render the site already ships — the on-screen CV and the downloadable CV cannot disagree, because one *is a print of* the other.
- **Full brand fidelity, no extra layout.** It prints the real page, so the brutalist-mono identity carries into the PDF with no second layout to maintain.
- **No new dependency and no backend.** It reuses the existing Playwright prerender pipeline; the static story (ADR-0002) holds end to end — the PDF is just another static object in the bucket.
- **True one-click download** — `<a download>` on a static asset, not a print dialog.

**Bad / accepted costs**
- **The PDF is build-frozen** (inherited from ADR-0004) — it regenerates only on deploy, exactly like the OG images and prerendered HTML. A `profile.ts` edit is not reflected in `/cv.pdf` until the next build ships. Consistent with the build-time-render cost the site already accepts.
- **EN-only for now.** The PDF is printed from the English prerender baseline ([ADR-0032](./0032-i18n-locale-layer-english-baseline.md)) — the canonical edition (ADR-0024). A pt-BR edition (`cv.pt.pdf`) is a clean follow-on that reuses the same pipeline against the pt route; it is deliberately deferred, not designed out.
- **The build owns one more headless-browser step** — a second Playwright pass (print, alongside the HTML snapshot). A small addition to the build-time cost ADR-0004 already books.

**Scope boundaries (deliberate)**
- **Not a crawlable route.** `/cv.pdf` is a static binary object, not an HTML page, so it is kept **out of `scripts/routes.mjs`** and out of the sitemap. ADR-0005 governs OG/SEO completeness for **HTML routes**; a PDF asset is not one, so the "every public URL is OG-complete" contract does not reach it and must not be stretched to.
- **The CI `build-test` gate was switched to `build:static`** so the artifact is actually produced and exercised on the PR — not only at deploy — keeping the gate honest (ADR-0018): the PR verifies what merge will ship.

**Cross-surface note — this does not retire Canva (deliberately).** This ADR records a new site **capability**: the site can now emit its own downloadable CV. It does **not** assert "the site is the single CV source" or "Canva is retired" — ADR-0024 still lists the Canva CV as a live surface, and the actual Canva teardown is an owner-driven decision outside this slice. When Canva is genuinely retired, ADR-0024's cross-surface set gets a **future amendment** recording that change; this ADR does not pre-decide it.

## Amendment (2026-07-26) — the PDF source route string is now `/en/me`
[ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) introduces symmetric per-locale URL prefixes, so the
CV route the prerender prints from moves **`/me` → `/en/me`** (English is still the canonical print edition —
ADR-0024). Nothing else here changes: the PDF is still Playwright-printed from the English CV page to the same
static `/cv.pdf`, linked from the CV surface. Only the *source route string* carries the `/en` prefix now;
the deferred `cv.pt.pdf` edition (below) would print from `/pt/me`.

## Links
- Driven by ADR-0002 (static, no backend), ADR-0004 (build-time render; Playwright already a build cost), ADR-0024 (`profile.ts` canonical CV — this derives the downloadable edition from it, without yet retiring Canva).
- Source route string moved `/me` → `/en/me` by [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) (per-locale URL prefixes); the English print edition and `/cv.pdf` output are unchanged.
- `/cv.pdf` is linked from `/me` (ADR-0010); the `/cv` redirect was dropped pre-launch, so the path is free.
- EN-only on the English prerender baseline (ADR-0032); a pt-BR edition is a deferred follow-on.
- Deliberately **outside** ADR-0005's HTML-route OG/SEO coverage (a static asset, not a crawlable route); exercised on the PR via `build:static` (ADR-0018).
- Implements Issue #140.
