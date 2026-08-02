# 0034. The downloadable CV is a build-time PDF, printed from `/me` to a static asset

- **Status:** accepted · **amended 2026-07-26** (the source route string) · **amended 2026-07-28** (a one-page edition, not a faithful print) · **amended 2026-08-01** (the print palette becomes the page's own; the budget goes to two pages and the proficiency meters come back)
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
- **EN-only for now.** The PDF is printed from the **English edition** of `/me` ([ADR-0024](./0024-profile-canonical-cv-cross-surface.md) — English is canonical). *(This said "the English prerender baseline (ADR-0032)"; that baseline was retired 2026-07-26 by [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) — both locales prerender now, so the PDF is EN-only by CHOICE of source route, not because the prerender only produces English. #234.)* A pt-BR edition (`cv.pt.pdf`) is a clean follow-on that reuses the same pipeline against the pt route; it is deliberately deferred, not designed out.
- **The build owns one more headless-browser step** — a second Playwright pass (print, alongside the HTML snapshot). A small addition to the build-time cost ADR-0004 already books.

**Scope boundaries (deliberate)**
- **Not a crawlable route.** `/cv.pdf` is a static binary object, not an HTML page, so it is kept **out of `scripts/routes.mjs`** and out of the sitemap. ADR-0005 governs OG/SEO completeness for **HTML routes**; a PDF asset is not one, so the "every public URL is OG-complete" contract does not reach it and must not be stretched to.
- **The CI `build-test` gate was switched to `build:static`** so the artifact is actually produced and exercised on the PR — not only at deploy — keeping the gate honest (ADR-0018): the PR verifies what merge will ship.

**Cross-surface note — this does not retire Canva (deliberately).** This ADR records a new site **capability**: the site can now emit its own downloadable CV. It does **not** assert "the site is the single CV source" or "Canva is retired" — ADR-0024 still lists the Canva CV as a live surface, and the actual Canva teardown is an owner-driven decision outside this slice. When Canva is genuinely retired, ADR-0024's cross-surface set gets a **future amendment** recording that change; this ADR does not pre-decide it. **→ Discharged 2026-07-28**: Canva **was** retired (logically — the design is kept but is no longer a surface), recorded in [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)'s 2026-07-28 amendment (Issue #225). The paragraph above is left as written because it is an accurate record of what this slice deliberately did *not* decide — but the state it describes is no longer current.

## Amendment (2026-07-26) — the PDF source route string is now `/en/me`
[ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) introduces symmetric per-locale URL prefixes, so the
CV route the prerender prints from moves **`/me` → `/en/me`** (English is still the canonical print edition —
ADR-0024). Nothing else here changes: the PDF is still Playwright-printed from the English CV page to the same
static `/cv.pdf`, linked from the CV surface. Only the *source route string* carries the `/en` prefix now;
the deferred `cv.pt.pdf` edition (below) would print from `/pt/me`.

## Amendment (2026-07-28) — the PDF is a one-page EDITION of `/me`, not a faithful print of it
The original decision above books, as its first Good consequence, that "the on-screen CV and the
downloadable CV **cannot disagree, because one *is a print of* the other**." **That is no longer true, and
the change is deliberate** (Issue #161).

Printed faithfully, `/me` is **five A4 pages**. A recruiter opens page one; the remaining four are a
scrolling liability on the highest-stakes artifact the site emits. So the constraint now governing the
export is **one page, recruiter-first**, and the `@media print` stylesheet is no longer only a formatter —
it **selects** what the printed edition carries.

**What the print edition omits, and why each is claim-preserving rather than a trim:**
- **the portrait** — decorative, already `aria-hidden`; the `<h1>` beside it names the person;
- **the Credly badge images** (and the typographic fallback seal) — artwork; the credential *name* carries
  the claim;
- **the proficiency meters** — a screen device; a recruiter, and an ATS, scan keywords. But the meters are
  a deliberate *honesty* device, not decoration: level 1 marks a keyword, level 4 the moat. Reflowed
  inline, `Amazon Bedrock` printed beside `AWS Lambda` as an equal, which converts a calibrated claim into
  a flat one. So the **graphic** goes and the **calibration stays**, as print-only wording on the low
  levels only (`foundational` / `working`) — 3 and 4 print bare, because they are not what the flattening
  exaggerated. Two labels rather than one: collapsing 1 and 2 into "basic" would under-claim level 2,
  which is the same distortion in the other direction;
- **the experience `highlights`, all but one** — measured at 88 of 143px per role, each running 3–5 lines.
  Clamping them to two lines truncates mid-sentence, which reads worse than dropping them. Each role's
  one-sentence `description` survives, and the rest stay in full on `/me`.

**The one highlight that survives, and why the count is one.** Dropping the lists wholesale left every AI
statement in the PDF as either self-description or a certification, while the surviving role bodies read
landing zones, mainframe migration, observability and CRM integration — the repositioning **asserted
rather than shown**, which is the exact ratio the owner's own framing rules exist to prevent. Exactly one
highlight is kept: the one that shows something agentic actually **built**. It also restores the
"MVP in progress" qualifier that kept "ship production-ready systems" calibrated.

It is named in the DATA (`ExperienceSource.print_highlight_index`), not selected by an `nth-child` in the
stylesheet. An index is positional but the intent is semantic, and a stylesheet rule would silently point
at different prose the first time the list is reordered — the failure would surface only in a PDF nobody
re-reads. The index is locale-independent because the two highlight arrays are parallel, so the entry is
still authored once and the editions cannot drift.

**And one thing the print edition now ADDS.** The original `/cv.pdf` hid the whole metadata row, reasoning
that "the PDF is generated FROM this page, so it must not carry a link back to itself." That was sound
while the PDF was a print of a page the reader was already standing on, and exactly wrong for a detached
one-page edition: the artifact carried **no contact of any kind and no URL** — it made the AI-Engineer
claim and stripped every pointer to the proof, on the surface that travels furthest, while this repo's
whole thesis is that *the argument is the code it links to*. The print edition now carries a plain-text
line with the site and the profile URLs. Plain text, not links: a printed `<a>` is a dead string, so the
URL has to be readable and typeable. **This is what makes the omissions above defensible** — the
elaboration is not lost, it is one URL away.

Relatedly, the issuer line is dropped **by meaning rather than in bulk**: seven of the nine credential
names already contain "AWS", so the attribution is free to drop — but `AI-DLC Ambassador` does not, and
unattributed, the credential closest to the repositioning reads as a self-styled title. The issuer is
printed exactly where the name does not already carry it.

**The invariant that replaces "it cannot disagree":** *every role, every certification and every skill
keyword survives into the PDF.* What is dropped is elaboration and decoration — never a claim, never an
employer, never a credential. Single-source is therefore intact in the sense ADR-0024 cares about
(`profile.ts` remains the one place any of it is authored, and nothing is re-typed anywhere); what is
given up is only the stronger property that the two renderings show the *same amount*.

**What keeps the invariant true:** an E2E assertion that counts roles, certifications and skill keywords
on screen and again under print media, and requires the two to agree (`e2e/cv-pdf.spec.ts`). It is the
more important of the two guards, because the page-count test would pass happily on a stylesheet that
fits by deleting a job. Counted rather than enumerated, so it does not need editing every time
`profile.ts` grows — an assertion nobody maintains is one somebody eventually weakens to make it pass.

**What keeps the one page true:** an E2E assertion that `/cv.pdf` is exactly one page (`e2e/cv-pdf.spec.ts`,
counted from the PDF bytes). Without it the regression is invisible — the build succeeds, the asset is a
valid PDF, and every other assertion passes at five pages as happily as at one. And the regression arrives
through **content** (one more role in `profile.ts`, a longer summary), not through a CSS edit anyone would
think to re-check a PDF for. The failure message says to trim the print view, not the assertion.

**Accepted cost:** body text prints at 7.4pt — legible, but denser than a typical CV. The alternative was
cutting a role, which reads as a gap on a CV. And the print stylesheet is now **content-bearing**, so an
edit to it is an editorial change to what a recruiter reads, not a styling change.

## Amendment (2026-08-01) — the PDF keeps the page's palette, and buys a second sheet with the space it needs

Two things the 2026-07-28 amendment decided are re-decided here, both on the owner's call and both for
the same reason: **the one-page budget was being paid for out of legibility.**

> *"o pdf não tá legal em 1 página, fica tudo muito apertado e não fica bem espaçado. quero que o CV em
> pdf tenha fundo preto e siga o layout com laranja da página pois fica mais ousado na leitura, gostoso
> para os olhos. Use os elementos gráficos da página, adaptando ao mínimo ao formato pdf no que for
> estritamente necessário."*

### 1 · The palette is the page's own — and this is closer to the ORIGINAL decision than the inversion was

`@media print` used to swap the two brand neutrals: the off-white became the sheet, the near-black the
ink. That made the download a *paper* treatment of a *screen* design.

It now inherits the site's palette unchanged — near-black ground, off-white text, safety orange accent.
Worth stating because it reads at first like a reversal and is nearer a return: **the whole argument for
printing from the real page** (the original decision above) **is that the PDF cannot layout-drift from
the on-screen CV.** The palette swap was the one place it deliberately did drift.

`printBackground: true` was already set, so this needed no Playwright change — but the CSS now paints
`html`/`body` explicitly and sets `print-color-adjust: exact`, because a print render starts from a white
canvas and only paints what an element actually fills. That second half also carries the ground when a
*reader* prints the downloaded PDF from their own viewer, where nobody passed Playwright's flag.

**One token is nudged for print and only one:** `--muted-foreground`, the warm grey carrying dates,
issuers and role subtitles, is lifted from `#8C8880`. It reads on a backlit screen; at print DPI, and
worse on a printer that dithers, it is the first thing to go muddy.

### 2 · The budget is TWO pages — and the previous amendment was right, for a page count that has changed

Nothing in the 2026-07-28 reasoning was wrong. Five faithful pages *is* a scrolling liability, and one
page *did* fix it. What it cost only became visible in the artifact: **7.4pt type, sub-quarter-rem gaps,
and a skills block reflowed into a single continuous keyword band with its proficiency meters hidden.**

That last one is where the trade stopped being worth it. That amendment argued the meters could go
because "the **graphic** goes and the **calibration stays**" as print-only wording on levels 1–2. In the
rendered sheet the result was seven categories and ~60 keywords in one justified paragraph, with
`(working)` glosses scattered through it — the eye has nothing to land on, and levels 3 and 4 print bare,
so the reader cannot tell a moat from a competence at all. The calibration survived as text and died as
information.

**So the meters come back, the categories are blocks again, and the type goes to 8.6pt/1.42.** Two pages
is still a long way from five, and the recruiter-first argument survives the change: what made the
one-page edition scannable was never the page count, it was the selection — and the selection is intact.

### 3 · The Credly badges come back — a badge is an attestation, not artwork

Added on the owner's call after reading the rendered sheets. The 2026-07-28 amendment dropped them as
decoration — *"the credential is the claim; the artwork is decoration"* — which is true as far as it
goes and misses what a badge does that a name does not: **it is the issuer's mark, not the author's**,
so it reads as *attested* rather than *asserted*. On the one artifact whose whole job is to be believed
by someone who has never met him, that is not decoration.

They cost real height, so they are **scaled to the sheet** (2.6rem) rather than dropped from it — the
adaptation this issue asks for rather than the omission the budget forced.

**The portrait still goes**, and the distinction is worth stating because a single `section img` rule
used to hide both and made them look like one decision. The portrait is decorative by the component's
own reckoning — `aria-hidden`, and the `<h1>` beside it names the person — so it costs no claim. A badge
is an attestation. Opposite things, and now opposite rules.

**What no longer applies:** the inline reflow of the certifications block, which stripped every border
and generated `·` separators to stand in for the rows it had removed. With the badges back that prints
nine images in a run-on sentence, so the screen's bordered rows stand and only the rhythm is tightened —
the same correction the skills block needed, for the same reason.

Measured after: content 1966px against a 1047px sheet. Still two pages.

### The cost that is accepted, not solved

**A full-bleed black A4 is expensive to print.** A recruiter who prints it burns toner, and some office
printers render large dark fills poorly or drop the background entirely. The PDF is a *download*, so most
readers meet it on a screen — but the one who prints it is exactly the reader the artifact exists for.

The rejected alternative is a second, paper-treatment artifact. It is rejected for the same reason the
original decision printed from the real page: two layouts is the thing this ADR exists to avoid, and it
would reintroduce the drift the whole approach was chosen to prevent. Accepted knowingly, by the owner,
on the argument that the screen reading is the common case and boldness is the point.

**The page-count guard moves with the decision, in the same commit** (`e2e/cv-pdf.spec.ts`, 1 → 2). A
count that drifts silently is the defect; a count changed alongside its reason is the guard working. What
must not happen is the number being raised to turn a red test green.

## Links
- Driven by ADR-0002 (static, no backend), ADR-0004 (build-time render; Playwright already a build cost), ADR-0024 (`profile.ts` canonical CV — this derives the downloadable edition from it; the Canva retirement it deferred was taken by 0024's 2026-07-28 amendment, #225).
- Source route string moved `/me` → `/en/me` by [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) (per-locale URL prefixes); the English print edition and `/cv.pdf` output are unchanged.
- `/cv.pdf` is linked from `/me` (ADR-0010); the `/cv` redirect was dropped pre-launch, so the path is free.
- EN-only because it prints from the English canonical edition (ADR-0024), not because the prerender is English — that baseline was retired by [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) (#234); a pt-BR edition is a deferred follow-on.
- Deliberately **outside** ADR-0005's HTML-route OG/SEO coverage (a static asset, not a crawlable route); exercised on the PR via `build:static` (ADR-0018).
- Implements Issue #140; amended by Issue #161 (one-page edition — the "cannot disagree" consequence above
  is superseded by the "every claim survives" invariant).
