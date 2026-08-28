# 0034. The downloadable CV is a build-time PDF, printed from `/me` to a static asset

- **Status:** accepted · **amended 2026-07-26** (the source route string) · **amended 2026-07-28** (a one-page edition, not a faithful print) · **amended 2026-08-02** (the print palette becomes the page's own; the budget goes to two pages and the proficiency meters come back) · **amended 2026-08-26** (the print edition carries no experience highlight; the page budget is recorded as what prices the selection) · **amended 2026-08-27** (the budget goes to THREE pages on the owner's call, and the third page buys back the current role's printed hands-on bullet)
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
- **the experience `highlights`, ~~all but one~~ *all of them*** — measured at 88 of 143px per role, each
  running 3–5 lines.
  Clamping them to two lines truncates mid-sentence, which reads worse than dropping them. Each role's
  one-sentence `description` survives, and the rest stay in full on `/me`. **Struck 2026-08-26 (#522) —
  see the amendment of that date below.** The measurement and the argument in this bullet are unchanged
  and still load-bearing; only the exception is gone.

~~**The one highlight that survives, and why the count is one.** Dropping the lists wholesale left every AI
statement in the PDF as either self-description or a certification, while the surviving role bodies read
landing zones, mainframe migration, observability and CRM integration — the repositioning **asserted
rather than shown**, which is the exact ratio the owner's own framing rules exist to prevent. Exactly one
highlight is kept: the one that shows something agentic actually **built**. It also restores the
"MVP in progress" qualifier that kept "ship production-ready systems" calibrated.~~

**Struck 2026-08-26 (#522), and the premise is what fell rather than the reasoning.** This paragraph kept
one highlight because the print edition otherwise carried the repositioning *asserted rather than shown*.
#522 rewrote every role's `description` into a fixed-shape practice line that names the arc and the
function, so the shown-evidence the exception existed to buy is now in the sentence the paragraph itself
calls the survivor — and the qualifier clause is doubly stale, because the bullet carrying
*"MVP in progress"* is no longer the one printed and, under the amendment below, nothing is. Struck rather
than rewritten: a reader who took the one-highlight rule from this record needs to find out it changed,
not to find it silently gone.

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

## Amendment (2026-08-02) — the PDF keeps the page's palette, and buys a second sheet with the space it needs

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

### 4 · The meter carries the headline terms too — owner decision, 2026-08-02

`brand-guardian` escalated this rather than blocking it, and it was the right call to put up: with the
meters restored, the printed sheet shows the full 1–4 self-assessment, so **`AI-DLC` and
`Harness Engineering` appear at level 2 on the same page whose headline leads with them.**

Nothing there is false — if anything it under-claims. What changed is what the **detached** artifact
asserts: `/cv.pdf` travels by email and into an ATS without the surrounding page, so it now carries
those terms as a rated self-assessment where it used to carry them as keywords.

**Decided: the meter carries every skill, including the headline terms.** No carve-out. The scale is an
honesty device, and a scale with an exemption for the two entries the author most wants believed is not
one — it would be the flattening this ADR's 2026-07-28 amendment already refused, applied selectively
and in the author's favour.

The adjacent question — whether identity terms belong in a proficiency-metered list *at all* — is
**still open** and is not decided here. It is recorded on `-io`#325's thread and PR #320, it is about
`profile.ts` rather than about the print stylesheet, and it would change `/me` as much as `/cv.pdf`.
This amendment decides only that the PDF does not diverge from the page on it.

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

## Amendment (2026-08-26) — the print edition carries NO experience highlight, and the page budget is why

Issue [#522](https://github.com/tedeuxx/tadeumendonca-io/issues/522) gave every experience `description`
a fixed-shape **practice line** — what kind of work the role was, then his function in it — in both
editions. The printed bullets were then set on all five roles, which is what falsified the three
sentences struck above. This amendment records the decision taken after that, and one constraint this
record should have carried since 2026-07-28 and did not.

### The decision

**The practice lines stay. The per-role printed bullet goes — the print edition carries no experience
`highlights` entry at all.** The 2026-07-28 exception ("exactly one, the one that shows something
agentic built") is retired, not narrowed: the evidence it existed to buy now sits in the `description`
the same amendment already called the survivor, so the exception buys nothing and costs a page.

**No acceptance criterion is waived here, because none applies.** Issue #522 sets nine acceptance
criteria and **not one of them requires a printed highlight** — read off the Issue at head rather than
from any account of it (`gh issue view 522 --repo <owner>/<repo> --json body --jq .body`). Its criterion
3 reads *"**2017** is scannable on a public surface"*. So there is nothing to discharge and nothing to
excuse: **the print bullets are dropped because the two-page budget does not fit them alongside the
practice lines. That is the whole reason.**

The one criterion the print edition does touch is **9** — *"A reader scanning only titles and the first
line under each, on `/me` and `/cv.pdf`, can say what he builds"* — and dropping the bullets does not
threaten it, it is what makes it legible: **the first line under each title IS the practice line**, which
is what criterion 1 put there.

~~Issue #522's own criterion 3 is satisfied by its escape clause — *"or the Issue records explicitly why a
role does not"* — and the reason is the measurement below, not an editorial preference.~~
**Struck within the hour it stood (2026-08-26).** The quoted clause **is not in Issue #522** and never
was — it belonged to a draft body that was replaced wholesale when intake returned the closed
description, and the dead version went on being cited. Falsifier, at head:
`gh issue view 522 --json body --jq .body | grep -c "records explicitly why"` → **0**. Struck rather than
deleted because it is the third time this MR has carried a claim inherited from a superseded source
instead of checked against the live one, and a record that quietly drops the evidence teaches nothing.
**The decision and the measurement are unchanged; only this justification was false.**

### The constraint that was never recorded, which is the finding worth more than the corrected sentences

The 2026-07-28 amendment recorded a **selection rule** for what the print edition carries, and the
2026-08-02 amendment recorded a **page budget** ("The budget is TWO pages"). Neither recorded that they
are the same budget. **A printed bullet and a practice line cost about the same vertical space, and the
sheet fits one of them, not both.** So the number of printed bullets was never a free choice at any point
after 2026-08-02 — it was a trade against every other print-selection decision in this record.

Whoever set an index before this had no way to know that adding one could cost a page, because this ADR
described the rule that selects a highlight and never the constraint that prices it. **That is why the
drift happened.** Recording the selection rule without its budget is what made a claim-preserving edit
look free.

**Measured on the artifact, by the merge gate on PR #523, by toggling one lever at a time in the DOM and
editing no repository file:** practice lines with NO printed bullet fit the budget; the pre-#522 shape fits it only WITHOUT the practice lines;
practice lines plus even one printed bullet does not — including the pre-#522 single index, and including the SHORTEST highlight anywhere in the experience block (117 characters, forced into the print slot by the merge gate — shorter than the 149-character minimum available inside the current role). Every one renders three pages. **No shape that prints any bullet fits.** Runnable falsifier, unchanged by this amendment:

```
npm --prefix apps/fed run build:static
grep -ao "/Type /Page[s]*" apps/fed/dist/cv.pdf | sort | uniq -c
```

~~**The budget itself is untouched at two pages, and `e2e/cv-pdf.spec.ts` is not edited by this decision.**~~
**Struck 2026-08-27 (#542).** It was true of the 2026-08-26 decision — that slice did move the print
selection rather than the ceiling — and it is false read at head, which is the only way anyone reads it:
it is a present-tense claim about *the budget*, in a record whose budget is now **three** pages and whose
spec now asserts `3`. Restated with its scope: **the 2026-08-26 decision did not touch the budget or the
spec; the 2026-08-27 amendment below does both.** Struck rather than edited because the sentence is the
argument for choosing that lever, and a reader needs to see the claim that stopped being true, not a
tidied version of it.

That is the point of choosing this lever: the spec's own instruction — *"What must never happen is the
number being raised to make a red test green"* — is honoured by changing what prints, not what is
asserted. **That instruction still binds and was not spent by the 2026-08-27 amendment** — see its
*"Nothing was red first"* paragraph, which records the ordering rather than asserting the discipline.

### Considered options

1. **Drop the printed bullets, keep the practice lines (chosen).** *Trade-off:* the print edition loses
   its only per-role sub-item, so a role's printed evidence is exactly one sentence. Accepted because
   that sentence is now the fixed-shape practice line, which is *denser* per line than the bullet it
   replaces. **It is not the best of several fitting shapes — under the two-page budget it is the ONLY one**, per the measurement above.
2. **Keep one bullet per role and shorten the practice lines until the sheet fits.** *Rejected:* the
   practice lines are byte-pinned against the private surfaces record and against what already shipped
   to LinkedIn, so shortening them is a change on three surfaces and re-opens a cross-surface identity
   #522 exists to close. **And it was then measured infeasible outright**, which is stronger than the cost argument and supersedes it: the shortest available bullet still overflows, so there is no length of practice line that buys room for one. Recorded as rejected-and-then-disproved rather than dropped, because the cost argument is what a future reader would otherwise re-run.
3. **Raise the budget to three pages.** — **SUPERSEDED 2026-08-27 (#542): this option was TAKEN.** The
   rejection below is kept intact and unedited, because it was **not wrong, it was outdated**: it
   recorded in its own words that the budget *"could move again on the owner's call with the artifact
   looked at"*, and on 2026-08-27 the owner looked at the artifact and moved it — «pode aumentar sem
   problemas». Its stated condition for rejection was *"nothing was measured to be missing from the
   two-page sheet"*; #542 is that condition failing, from the owner's own reading. See the
   *"Amendment (2026-08-27)"* section below. *Rejected here, but rejected as a decision rather than as an
   impossibility* — the budget has moved deliberately once already (one → two, 2026-08-02) and could
   move again on the owner's call with the artifact looked at. It is rejected in this slice because
   nothing was measured to be missing from the two-page sheet; the third page would exist to carry the
   bullets, and option 1 establishes that the bullets are what the practice lines already say.
4. **Cut print volume elsewhere in the stylesheet to buy room for the bullets.** *Rejected:* every
   remaining block was already argued into the sheet by the two amendments above, so this trades a
   decision with a recorded reason for one without.

### What survives unexercised, deliberately

**No longer unexercised as of 2026-08-27 (#542) — this section's own bet paid, and that is why it is
marked rather than struck.** It reasoned that keeping the mechanism means *"a future budget change is one
flag rather than a re-derivation of the selection machinery"*; the budget changed twenty-four hours
later and the change was exactly one flag (`print_highlight_index: 3`). Read the rest as the disposition
that was taken and the cost that was accepted — both still accurate about the mechanism — with its
present tense now historical.

`ExperienceSource.print_highlight_index` and the two `[data-print-block='01'] li` rules that read it are
kept as a mechanism with no instances, rather than deleted. Keeping an unexercised convention is the
correct disposition for a rule that is current but not currently fired, and it means a future budget
change is one flag rather than a re-derivation of the selection machinery.

*Its cost, stated as a cost:* a mechanism nothing exercises is a mechanism nothing re-tests, and this one
already has a known unguarded hole — an out-of-range index prints **zero** bullets for that role
silently, which is precisely the defect #522 found by hand. Nothing asserts the index is in range.

**The shape this landed in, verified rather than assumed:** the implementing diff removes every
`print_highlight_index` assignment from `profile.ts` and **keeps the optional field on both interfaces**
in `types/profile.ts` — the disposition this section prefers. It has one dependency worth naming, and it
is discharged: [ADR-0012](./0012-snake-case-content-no-mapping.md)'s convention table cites
`print_highlight_index` as a `profile.ts` snake_case example, and that example **still stands**, because
the field survives. Were a later slice to remove the field outright, that table moves in the same MR.

### Why this is an amendment and not a new record

One decision per ADR — and this *is* the same decision this record has taken twice already (2026-07-28
selected one highlight; 2026-08-02 re-priced the budget it is selected against). A new record would
restate the operative rule for *what the print edition carries*, which creates a second surface to keep
true about one artifact — the failure this MR exists to correct, reproduced one level up. The
significance gate fires on *alters a previously-recorded decision*; that is satisfied by amending the
record that holds it.

**No History row and no `## What this replaced` fold are owed.** Those dispositions govern a record that
is *leaving* the library — *"This rule is about whole records, not about sentences inside a live one"* —
and this record stays `accepted`. Inside a live record the convention is unchanged and is what was applied
above: **amend by appending, strike in place, never rewrite.**

## Amendment (2026-08-27) — the budget is THREE pages, and the third page buys back the printed hands-on bullet

### The decision, in the owner's words

Asked directly — may `/cv.pdf` grow to three pages, or must it stay at two with something else removed? —
he answered:

> «pode aumentar sem problemas»

**The budget is three pages.** `e2e/cv-pdf.spec.ts` asserts `toHaveLength(3)`, and
`print_highlight_index` is set again on the current role.

### Measured at head, not inherited

Taken on this branch by `tech-lead` writing this amendment, from a real build rather than from any
account of one — the same falsifier the 2026-08-26 amendment published, unchanged:

```
npm --prefix apps/fed run build:static
grep -ao "/Type /Page[s]*" apps/fed/dist/cv.pdf | sort | uniq -c
   3 /Type /Page
   1 /Type /Pages
```

**Three pages. That is the artifact this amendment is about, and it is why the ceiling had to move in
this MR rather than after it** — merging the copy change without it leaves `main` publishing a rejected
option as the current decision.

### Why the ceiling moved — the substantive part

The 2026-08-26 amendment established, and this amendment does **not** disturb, that *"no shape that
prints any bullet fits"* two pages. Four further measured builds on 2026-08-27 established the same
constraint one level up on the **practice line itself**: the two named launches (the streaming
replacement and the oil & gas landing zone) and the hands-on artefacts (`tadeumendonca.io`, its agent
harness and plugin, the internal knowledge platform) **cannot coexist inside two pages.** The launches
were kept and **the hands-on clause was dropped to hold the ceiling.**

**That is what emptied criterion 5 of Issue [#522](https://github.com/tedeuxx/tadeumendonca-io/issues/522)
on the printed surface.** #522's own answer to *where is the hands-on evidence of this period* was **the
work built in the open** — accurately, because the client work of the period is leadership and
architecture and rewriting it as building would make it false. With the practice line's hands-on clause
gone and `print_highlight_index` unset on every role, **a reader of `/cv.pdf` alone met no artefact he
personally built under the current role, and no building verb at all.**

**Issue [#542](https://github.com/tedeuxx/tadeumendonca-io/issues/542) is where the owner named that
consequence**, reading his own profile, before anyone connected it to the budget:

> «tem que ter algo mais indicando hands-on»
> «senão as pessoas entendem como somente papel»

So the ceiling did not move for space. **It moved because the thing the ceiling was being paid for with
turned out to be the one claim the artifact exists to make.** Two pages was a good budget while what it
cost was elaboration; it stopped being one when what it cost was the evidence.

### `print_highlight_index` is a live lever again

This record's own measurement — printing any bullet means three pages — is **unchanged, and now spent
deliberately rather than avoided.** #542's body recorded this lever as *"measured and closed … this lever
does not exist"*; that was correct **under the two-page ceiling**, and the ceiling is what moved. Nothing
about the measurement was revised.

`print_highlight_index: 3` on the current role prints
*"Built, hands-on, the serverless data integration…"* — the one bullet of that role's six written as
building, and a **completed** artefact. Chosen against the selection rule rather than around it: the
practice line's restored hands-on clause names the internal knowledge platform and `tadeumendonca.io`,
both in progress, so the printed bullet carries what the practice line does not and nothing is named
twice inside one role.

### The assertion moved WITH the decision, not after it went red

Recorded explicitly, because the two acts are different and only one of them is legitimate.
`e2e/cv-pdf.spec.ts` went `toHaveLength(2)` → `3` **in the same commit as the copy change that spends the
page**, and **nothing was red first**: the count was taken from a build after the copy change, and the
assertion was written to the number that was measured, with the reason in the file. The spec's standing
instruction — *"What must never happen is the number being raised to make a red test green"* — is intact
and unspent. An assertion loosened *because* it failed is a defect; an assertion moved with the decision
that moved the artifact is the guard doing its job, and this record says which one happened so a later
reader does not have to infer it from the diff.

### A NUMBER, not an unbounded artifact — decided here, because «pode aumentar sem problemas» does not say which

The owner's sentence authorises growth. It does not choose between *"the ceiling is now three"* and
*"there is no ceiling"*, and the record's author has to, because **silently having neither is the failure
this repository names most often.**

**The budget's value was never the number.** It was that every change to `profile.ts` had to be measured
against something. That property is what caught the practice-line slice going to three pages on
2026-08-27, what caught the architecture-diagram slice, and why every PR body this week carries a page
count from a real build. **A ceiling raised from 2 to 3 keeps that property in full; a ceiling removed
destroys it** — with no asserted number, nothing reports that the CV grew, and it grows one honest slice
at a time until someone opens it and is surprised. That is not hypothetical here: this record already
documents one silent drift of exactly that shape (*"Whoever set an index before this had no way to know
that adding one could cost a page"*).

**So: three pages, asserted.** The spec is the mechanism, this record is the ceiling, and the next slice
that wants a fourth page pays the same price this one did — a measurement, an owner decision, and an
amendment. Reporting-without-enforcing was considered and rejected below.

### Considered options

1. **Raise the ceiling to three and keep it asserted (chosen).** *Trade-off:* a three-page CV is a longer
   document than a recruiter's convention prefers, and the ceiling will be argued again the next time
   `profile.ts` grows. Accepted, because the argument is the point — the ceiling's job is to make growth
   a decision rather than a drift, and it does that at 3 exactly as it did at 2.
2. **Remove the ceiling; report the page count without enforcing it.** *Rejected:* it reads as the
   permissive reading of «pode aumentar sem problemas» and it is the option that quietly discards the
   only property the budget ever bought. A reported number nothing fails on is a number nobody reads —
   and every drift this record documents was found by a *failing* count, never by a printed one.
   *Its real cost, stated:* one fewer amendment the next time the CV legitimately needs a page.
3. **Hold two pages and cut something else to fit the printed bullet.** *Rejected, and measured rather
   than argued:* the 2026-08-26 amendment's option 4 already established that every remaining print block
   was argued into the sheet by an earlier amendment, so this trades a decision with a recorded reason
   for one without — and the 2026-08-27 builds add that the launches and the hands-on artefacts do not
   both fit either. There is no cut left that is cheaper than the page.
4. **Keep the two-page PDF and carry the hands-on weight on screen only.** *Rejected:* it is the state
   #542 was opened about. `/cv.pdf` is the file a recruiter saves and forwards, so a claim that exists
   only on `/me` is absent from the surface that travels — which is the whole reason ADR-0024 makes the
   PDF derived rather than optional.

### Consequences

**Good.** The printed CV carries a building verb and a named, completed artefact under the current role
again — criterion 5 of #522 holds on both surfaces, not one. The practice line keeps both launches. The
`print_highlight_index` mechanism kept unexercised by the 2026-08-26 amendment turned out to be one flag,
exactly as that section bet. The budget survives as an asserted number, so growth stays a decision.

**Bad, and named rather than solved.** The PDF is 50% longer than the edition this record opened with, and
a third page is a real cost against a recruiter's scan. **The out-of-range hole this record already
flagged is now live rather than theoretical** — *"an out-of-range index prints zero bullets for that role
silently"*, and an index is now set; nothing asserts it is in range, and the page-count assertion would
not catch it, because printing zero bullets makes the document *shorter*. And the two-page measurement
this record spent three amendments establishing is now historical: a future reader must read the
2026-08-26 measurement as *why the ceiling was expensive*, not as *what the ceiling is*.

### Why this is an amendment and not a new record

The same reason the 2026-08-26 amendment gave, and it is stronger here: this is the **third** movement of
one budget in one record (1 → 2 on 2026-08-02, priced against the selection rule on 2026-08-26, 2 → 3
here). A separate record would put the current ceiling in one file and its three prior values in another,
which is precisely the second-surface failure this record has now corrected twice. The significance gate
fires on *alters a previously-recorded decision*. No History row and no `## What this replaced` fold are
owed — this record stays `accepted` and nothing is leaving the library.

## Links
- Driven by ADR-0002 (static, no backend), ADR-0004 (build-time render; Playwright already a build cost), ADR-0024 (`profile.ts` canonical CV — this derives the downloadable edition from it; the Canva retirement it deferred was taken by 0024's 2026-07-28 amendment, #225).
- Source route string moved `/me` → `/en/me` by [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) (per-locale URL prefixes); the English print edition and `/cv.pdf` output are unchanged.
- `/cv.pdf` is linked from `/me` (ADR-0010); the `/cv` redirect was dropped pre-launch, so the path is free.
- EN-only because it prints from the English canonical edition (ADR-0024), not because the prerender is English — that baseline was retired by [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) (#234); a pt-BR edition is a deferred follow-on.
- Deliberately **outside** ADR-0005's HTML-route OG/SEO coverage (a static asset, not a crawlable route); exercised on the PR via `build:static` (ADR-0018).
- Implements Issue #140; amended by Issue #161 (one-page edition — the "cannot disagree" consequence above
  is superseded by the "every claim survives" invariant).
- Amended by Issue #522 / PR #523 (2026-08-26) — the practice line replaces the printed highlight, and the
  two-page budget is recorded as the constraint that prices every print-selection decision here. The
  "every ROLE, every CERTIFICATION and every SKILL keyword survives" invariant is **untouched**: a
  highlight is elaboration, and this drops no role, no credential and no keyword.
- Interacts with [ADR-0012](./0012-snake-case-content-no-mapping.md) — its convention table names
  `print_highlight_index` as a `profile.ts` snake_case example; the field is kept, so that example stands.
  Since 2026-08-27 the field is also *set*, so the example is now exercised rather than merely declared.
- Amended by Issue #542 / PR #552 (2026-08-27) — the budget goes to three pages on the owner's call
  («pode aumentar sem problemas»), the 2026-08-26 amendment's considered option 3 is superseded as
  **taken**, and `print_highlight_index` returns on the current role. The 2026-08-26 measurement is
  unchanged; only the ceiling it was measured against moved.
