# 0024. `profile.ts` is the canonical structured CV; cross-surface coherence

- **Status:** accepted · **amended 2026-11-01** (absorbs the downloadable-CV decision, formerly record
  0034, as the section *The downloadable edition — `/cv.pdf`*; the decision is unchanged, #456) ·
  **amended 2026-11-01** (absorbs the natural-pair join, formerly record 0050, as the section
  *Attribution from outside the CV*; the decision is unchanged, #456)
- **Capability:** `presence-and-cv`
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md#lean-by-design--the-keystone-every-record-is-read-through) (lean by design), [ADR-0002](./0002-fully-static-spa-no-backend.md#the-frontend-toolchain); the
  downloadable edition also by [ADR-0002](./0002-fully-static-spa-no-backend.md) and
  its section [*Content and OG resolved at build time*](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)

## Context & problem
The owner's professional presence spans several surfaces — this site, LinkedIn, and a designed CV (Canva).
They must tell **one coherent story**: the same positioning, the same facts. A contradiction between the
site's CV and LinkedIn undermines the credibility the presence exists to build. So the site needs a
decision about *where its CV lives* and *how it stays coherent* with the other surfaces.

## Decision drivers
- Presence is only as strong as its consistency across surfaces (ADR-0053 (lean by design) — the site is the storefront).
- The site's CV should be **versioned data**, styleable to the brutalist identity, not an opaque import.
- Coherence across surfaces is an ongoing obligation, not a one-time copy.

## Considered options
1. **`profile.ts` as the canonical structured CV + a maintained cross-surface coherence process** (chosen)
   — the CV is a typed, versioned data module the SPA renders (richer than a PDF, styleable to the
   identity); it is kept coherent with LinkedIn and the Canva CV through a maintained sync process, so a
   positioning change propagates to every surface in one pass. *Trade-off:* coherence is a **maintained**
   obligation — surfaces can drift if the process is skipped.
2. **Embed / iframe an external CV (Canva or LinkedIn)** — *Why not:* forfeits control and versioning,
   can't be styled to the brutalist identity, and adds a third-party dependency (against the static,
   self-contained model).
3. **Let each surface be authored independently** — *Why not:* they drift into contradictions, which is
   exactly the credibility risk presence can't afford.

## Decision outcome
Chosen: **`profile.ts` is the site's canonical structured CV**, and a maintained process keeps it coherent
with the external surfaces. The site owns its CV as versioned data; the cross-surface sync is a deliberate
practice, not an accident of copy-paste.

## Consequences
**Good**
- The site's CV is versioned, typed, and rendered in the site's own identity — richer and more controlled
  than an imported document.
- One positioning, propagated deliberately — the surfaces reinforce rather than contradict each other.

**Bad / accepted costs**
- Coherence is **manual/maintained** — a positioning change must be propagated to every surface, or they
  drift. The sync process (its checklists and per-surface mechanics) is **private working material and is
  not part of this public repo**; only the coherence *obligation* is recorded here.

## Amendment (2026-07-23) — the CV is bilingual; English stays canonical
`profile.ts` is now authored **in both locales** (`ProfileSource`; flattened per locale by
`resolveProfile`), closing the pt-BR CV slice that [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)
deferred. This **does not** weaken "canonical": **English remains the canonical edition** — it is what
LinkedIn carries, what the prerender baseline serves, and what the resolved `profile` constant exports.
pt-BR is a **translation of** that edition, not an independent CV.

The coherence obligation above is now partly **mechanical rather than maintained**: dates, employers,
official job titles and certification names are authored **once** and shared by both editions, so a
translation cannot drift the facts — only the prose is per-locale, and the type makes a missing
translation a compile error. Translation policy: prose, category labels and spoken languages localize;
technical terms, product names and official job titles stay English in both.

## Amendment (2026-07-23) — derived facts are never restated in prose
The years-of-experience figure was written into the copy as "17" — in the CV headline, the CV summary,
and the ramp-up page — and had been wrong for over a year: the earliest role starts 2008-03, which is 18.
It was correct when written, nothing recomputed it, and because it appeared on four surfaces the drift
was invisible from any one of them.

The correction is a **convention, not a number**: a fact derivable from the CV data is **authored as a
token and resolved at render**, never typed. `{{years}}` resolves through a single exported helper
(`withYears`) from a single derivation (`lib/experience.ts`, reading the earliest `start_date`), used by
both `data/profile.ts` and `content/rampup.*.md`. Two surfaces stating the same fact now resolve it from
one computation, so they cannot disagree — the failure mode this ADR's coherence obligation exists to
prevent, appearing here as a *number* rather than as a claim.

**Accepted costs**
- **Build-time vs read-time skew.** The prerendered HTML — including the JSON-LD `jobTitle` a crawler
  reads — carries the value computed at build. A visitor between an anniversary and the next deploy sees
  the previous figure until the client re-renders; the JSON-LD stays stale until *some* merge happens.
  Bounded and self-correcting, where the hardcoded version was unbounded — but "self-healing" overstates
  it: with no merges, the machine-readable copy can sit a year behind.
- **The site now changes a positioning statement unattended.** The seniority claim advances on a March
  with no human in the loop. Deliberate, and the reason this is recorded rather than treated as a fix.
- **Tests assert the shape, not the value** (`/\d+y across SDLC/`), so they cannot catch a wrong
  *derivation* — only a missing one. The derivation is unit-tested separately against fixed dates.

**External surfaces are not covered.** LinkedIn and the Canva CV still carry the old figure; only the
site derives. That is a *deliberate temporary incoherence* against the obligation above, tracked in
issue #82 until the batch lands.

## Amendment (2026-07-28) — the Canva CV is retired; the site is the only CV surface
The hand-maintained designed CV (Canva) is **no longer a surface**. `profile.ts` is the single authored
source; **`/me`** is the full interactive edition and **`/cv.pdf`** — printed from `/me` at build time
(*The downloadable edition* below; it was record 0034 until #456 absorbed it here) — is the
downloadable one. **No CV *document* is maintained by re-typing any more** — deliberately not "no CV
artifact": LinkedIn is still hand-maintained (see the cross-surface set below), and overstating that here is how a record gets quoted into a claim it
does not support.

**Why now, and why not when the PDF was decided.** The downloadable-CV record (then 0034, absorbed into
this record's *The downloadable edition* by #456) deliberately declined to assert this (its "this does not
retire Canva" note, which named *this* ADR as where the teardown would be recorded when it came — this
amendment is that recording). At the time the site's PDF was a strictly *better copy of the same CV*, so
which one was canonical did not much matter. That record's **2026-07-28 amendment** changed that: `/cv.pdf`
became a **selective one-page edition**, a genuinely different artifact. Three editions of one person then
existed at once and "which is canonical" acquired an answer that matters (Issue #225).

**What it closes.** The private surface inventory recorded the Canva CV carrying a **different years figure
and a different summary** from what the site publishes — drift as a *document* rather than as a claim,
which is the failure mode this ADR exists to prevent and the one *The downloadable edition* below opens with.
Retiring the document removes **the class of drift**, rather than resyncing it once.

**Accepted costs (what is given up).**
- The Canva CV was a **designed artifact** with typographic polish a print stylesheet does not match. The
  replacement's design is the brutalist-mono print view (ADR-0008) — consistent, not equivalent.
- Canva was **editable without a deploy**. `/cv.pdf` is **build-frozen** (an accepted cost of *The
  downloadable edition* below): it regenerates only on merge to `main`.
- Both accepted, because a **second authoring surface** is precisely what produced the drift above.

**The cross-surface set after this.** The surface list in the Context above loses Canva. What remains: the
**site** (`/me` + `/cv.pdf`), **LinkedIn**, the **GitHub catalog**, **X**, the **newsletter**. Note the
obligation is reduced, not discharged: **LinkedIn is still hand-maintained**, so it remains the surface that
can drift.

**This is a LOGICAL retirement, not a deletion — and the distinction is the one thing here with a residual
risk.** The design is **kept** in the owner's Canva account. It stops being a surface: not maintained, not
synced, not linked, not a source of truth. It is not destroyed.

That is the right call — the artifact is a record of what has already circulated, and deleting it would
throw away the only copy of a document that may still be sitting in someone's inbox.

**Nothing points at it, so the retirement takes effect immediately and carries no follow-up.** The site
never linked to Canva (grep over `apps/fed/src` and `apps/fed/public`), and there is **no Featured item or
other link to it on LinkedIn** (owner, 2026-07-28). No reader can reach the old edition through a surface
anyone maintains.

**The residual risk is therefore only this:** the retained document carries a **different years figure and a
different summary** from what the site publishes, and the retirement is a **convention, enforced by nobody**.
It can be reopened and exported by mistake, and any copy already sent stays sent — which no deletion would
have fixed either. The rule is simply that any CV comes from `/cv.pdf`.

## The downloadable edition — `/cv.pdf`

**Absorbed 2026-11-01 (#456) from the record that held it, 0034, decided 2026-07-25 and amended five
times through 2026-08-28.** The decision is unchanged and still binds; it moved here because it is
behaviour of this capability — the CV's editions — rather than a capability of its own. What arrived:
the decision as it binds today, the rejected options a future reader must not relitigate, and the
consequences still being paid. What was left in git history on purpose: the superseded one- and
two-page budgets argued step by step, struck clauses, and per-round measurement narrative. The full
record is in git history: `git log --diff-filter=D -- 'docs/adr/0034-*'` names the commit that
removed it, and its parent holds the file.

### Context

Before this decision the downloadable CV — the file a recruiter saves or attaches — was a hand-maintained
designed document, so every positioning change was authored twice, once into `profile.ts` and once by
re-typing. That is the drift this record exists to prevent, appearing as a **document** rather than as a
claim. The site needed a way to produce a downloadable CV derived from the same single source, under the
static-site constraint ([ADR-0002](./0002-fully-static-spa-no-backend.md): no backend, no request-time
compute) and in the site's own identity ([ADR-0008](./0008-brutalist-mono-identity.md)).

### The decision, as it binds

**The downloadable CV is a build-time PDF, printed from the real English CV page to a static asset.**
The prerender pass (`apps/fed/scripts/prerender.mjs`) renders `/en/me` and calls Playwright
`page.pdf()`; a `@media print` stylesheet formats it; the result ships as the static object `/cv.pdf`,
linked from the CV page with `<a href="/cv.pdf" download>`. Playwright is already a build-time cost
([ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)), so this adds no dependency.

**The PDF is an EDITION of the CV page, not a faithful print of it.** The print stylesheet *selects* what
the edition carries, so it is content-bearing: an edit to it is an editorial change to what a recruiter
reads. As it stands:

- **The page's own palette** — near-black ground, off-white text, the one accent. The CSS paints
  `html`/`body` and sets `print-color-adjust: exact`, so the ground survives a reader re-printing the
  file. One token is lifted for print only: `--muted-foreground`, which goes muddy at print resolution.
- **The proficiency meters print, for every skill, including the headline terms.** The scale is an
  honesty device; an exemption for the two entries the author most wants believed would make it not one.
  Whether identity terms belong in a metered list *at all* is open and is a question about `profile.ts`,
  not about this edition.
- **The certification badges print, scaled down; the portrait does not.** A badge is the issuer's mark,
  so it reads as *attested*; the portrait is decorative (`aria-hidden`, named by the heading beside it).
  The issuer line prints only where the credential name does not already carry it.
- **A plain-text line with the site and profile URLs prints.** A detached document has to point back at
  the evidence; plain text because a printed link is a dead string.
- **Experience highlights do not print, with one exception set in the data.** Each role's first line is
  its practice line (#522), which carries the arc and the function. `ExperienceSource.print_highlight_index`
  selects one highlight to print, and it is set on the current role only, at `4`: the internal knowledge
  platform, *"MVP in progress"*. The index is in the data, not an `nth-child` in the stylesheet, because
  the intent is semantic and a stylesheet rule would point at different prose after a reorder; it is
  locale-independent because the two highlight arrays are parallel. **Do not restore index 3 without the
  owner's word** — the same warning sits beside the flag in `profile.ts`.
  - The selection rule for that bullet has two halves: print what the practice line does not already
    carry, and prefer a **completed** artefact. The second half is **overridden** on the current role, by
    the owner on 2026-08-28 (#566): *«voce foca numa experiencia do data integration que é pontual e mto
    distante do que faco diariamente»*. Understating by "in progress" beats mis-stating the domain. The
    preference survives as the default for any other role.

**The invariant that replaced "the PDF cannot disagree with the page": every role, every certification
and every skill keyword survives into the PDF.** What the edition drops is elaboration and decoration,
never a claim, an employer or a credential. Single-source holds in the sense this record cares about:
`profile.ts` is the one place any of it is authored. `e2e/cv-pdf.spec.ts` counts roles, certifications
and skill keywords on screen and under print media and requires the two to agree.

**The page budget is THREE pages, asserted.** `e2e/cv-pdf.spec.ts` requires exactly three, counted from
the PDF bytes. The budget's value is not the number: it is that every change to `profile.ts` is measured
against something. It moved deliberately twice (one page to two on 2026-08-02, for legibility; two to
three on 2026-08-27, when holding two had cost the one hands-on claim the edition exists to make — the
owner: *«pode aumentar sem problemas»*). **The next change that wants a fourth page pays the same price:
a measurement, the owner's decision and an amendment here.** The assertion moves in the same commit as
the decision that moves the artifact, never to turn a red test green.

**The budget prices every selection above.** A printed highlight and a practice line cost about the same
height, so whether a bullet prints is a trade against every other print decision. That constraint went
unrecorded for a month and is why an index was once set with no way to know it cost a page. Measure it
with a real build:

```
npm --prefix apps/fed run build:static
grep -ao "/Type /Page[s]*" apps/fed/dist/cv.pdf | sort | uniq -c
```

**Scope boundaries.** `/cv.pdf` is a static binary, not an HTML route: it stays out of
`apps/fed/scripts/routes.mjs` and the sitemap, and [ADR-0005](./0005-og-coverage-every-public-url.md)'s
every-public-URL coverage does not reach it. The `build-test` gate builds with `build:static`, so the
artifact is produced and exercised on the merge request, not only at deploy
([ADR-0003, *CI gates on the pull request*](./0003-trunk-based-single-environment.md#ci-gates-on-the-pull-request)). **English only, by choice of source route**: both
locales prerender ([ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)), and the PDF prints from
the canonical English edition; a pt-BR `cv.pt.pdf` from `/pt/me` is a deferred follow-on on the same
pipeline, not designed out.

### Rejected options that are still live

1. **`window.print()` of a print view.** Not a one-click download, and fidelity depends on the reader's
   browser and OS, so the artifact the owner reviews is not the one the reader gets.
2. **A client-side PDF library (react-pdf, pdf-lib).** A runtime dependency **and** a second CV layout in
   the library's primitives — the drift this decision closes, moved from a design tool into code.
3. **A second, paper-friendly artifact** (light ground, cheap to print). Two layouts is what this decision
   exists to avoid.
4. **Remove the page ceiling and only report the count.** A reported number nothing fails on is a
   number nobody reads; every drift this decision recorded was found by a failing count.
5. **Hold a smaller budget and cut elsewhere, or shorten the practice lines.** Every remaining print block
   was argued into the sheet with a recorded reason, and the practice lines are byte-pinned against what
   already shipped on other surfaces; at two pages it was also measured infeasible — the shortest
   available bullet still overflowed.
6. **Carry the hands-on evidence on screen only.** `/cv.pdf` is the file that travels; a claim only on
   `/me` is absent where it is read.
7. **Print more than one highlight per role.** The index is one number by construction; an array is a
   schema change to `profile.ts` and a page of budget.
8. **Reword the printed bullet so the artefact reads as completed.** Dishonest: it is an MVP in progress,
   on a document whose value is that every claim can be checked.

### Consequences still being paid

- **Build-frozen.** `/cv.pdf` regenerates only on deploy, like the prerendered HTML and the OG images.
- **English only** until the deferred pt-BR edition is built.
- **One more headless-browser pass** in the build.
- **A full-bleed dark A4 is expensive to print**, and some office printers drop or band large dark fills.
  Accepted by the owner: most readers meet the PDF on a screen, and the boldness is the point.
- **Three pages is longer than a recruiter's convention**, and the ceiling will be argued again the next
  time `profile.ts` grows.
- **An out-of-range `print_highlight_index` prints zero bullets for that role, silently.** Nothing asserts
  the index is in range, and the page-count assertion cannot catch it, because a missing bullet makes the
  document shorter.
- **`MVP in progress` is a claim that ages.** `e2e/cv-pdf.spec.ts` pins the verb `Developing`, so a move
  to past tense reddens and forces a decision; it does not pin the status clause, so the failure that
  survives is the tense never being updated at all.
- **A sweep for what this section asserts must key on the identifier, not the prose**:
  `grep -rn 'print_highlight_index' docs/ apps/fed/src` finds every claim about the lever; a sweep by the
  copy that moved does not, and missed this decision once.
- [ADR-0002](./0002-fully-static-spa-no-backend.md#data-keys-as-authored-no-mapping-layer)'s convention table names `print_highlight_index` as a
  `profile.ts` snake_case example; if the field is ever removed, that table moves in the same merge
  request.

### Where it came from

Implemented by Issue #140; amended by #161 (the one-page edition), #317 (the page's palette, two pages,
meters and badges back), #522 / PR #523 (no printed highlight; the budget recorded as what prices the
selection), #542 / PR #552 (three pages; the hands-on bullet back) and #566 / PR #567 (the bullet is the
internal knowledge platform; the completed-artefact preference overridden). Absorbed here by #456.

## Attribution from outside the CV — the natural-pair join

**Absorbed 2026-11-01 (#456) from the record that held it, 0050, decided 2026-08-25.** The decision is
unchanged and still binds; it moved here because it is behaviour of this capability — how another
module points into the canonical CV — rather than a capability of its own. What arrived: the decision
as it binds, the rejected options a future reader must not relitigate, and the consequences still being
paid. What was left in git history on purpose: slice 1's measurement narrative argued step by step. The
full record is in git history: `git log --diff-filter=D -- 'docs/adr/0050-*'` names the commit that
removed it, and its parent holds the file.

### Context

`apps/fed/src/data/journey.ts` holds photographs placed **inside** the work-experience entries
`profile.ts` authors. Placement is an **attribution**: a frame under a dated employer heading reads as
evidence *of that engagement*. The attribution is the owner's and is not derivable — on the first frame
both available heuristics (nearest date, what the frame shows) pointed at one employer and the owner
placed it at another. So the attribution is **authored data**, and the question is how that datum points
at an experience entry.

The first shape authored an employer **name**. Measured against the CV's five entries, three of the four
strings matched no entry and the fourth matched two: a label that reads like a pointer, not a pointer.

Drivers: the attribution must be **checkable by a machine at build time**, before a reader is told the
wrong employer on the page a recruiter reads; it must stay **checkable by a human** against the owner's
own sentences; `profile.ts` is what `/cv.pdf` is printed from (*The downloadable edition* above), and
`journey.ts` exists as a separate module to keep photograph concerns out of it; and drift must fail as a
red build, never as a frame quietly rendered against the wrong role.

Decided by `tech-lead` on the owner's explicit delegation of exactly this question, in its slice-2
design comment on [#516](https://github.com/tedeuxx/tadeumendonca-io/issues/516). **The owner decided
the content of every key** (six rulings, 2026-08-25) and none of its shape.

### The decision, as it binds

**A module outside the CV attributes its data to a CV experience entry by the natural pair
`{ company, start_date }`.** `journey.ts` authors `engagement: { company, start_date }`, both fields
spelled **exactly** as `profile.ts` spells them, and resolves it against `profileSource.experience` at
module load. This is the first foreign key into `profile.ts`, and the pattern the next one copies:
*join on the natural pair, resolve at load, refuse ambiguity*, not *add an id*.

- **The pair, not `start_date` alone.** A date unique across today's entries is an accident of this CV,
  not a rule, and a bare date carries nothing a reviewer can check against the owner's sentence.
- **Exact string equality**, never trimmed, normalised or case-folded. Every softening turns a red build
  into a plausible-looking wrong answer, and a wrong answer here is a false attribution.
- **`profileSource.experience`, not a locale-resolved edition.** The join is on facts the source authors
  once and shares across both editions.
- **`assertJourneyShape` takes the experience array as an argument** rather than reading the shipped
  data, so a test can feed it a drifted CV and watch each refusal fire. It refuses, at module load,
  before any render:

| refusal | the failure it replaces |
|---|---|
| a key matching **zero** entries | a frame silently orphaned by a `profile.ts` edit — a company renamed, a date corrected, the em dash retyped |
| a key matching **more than one** | what a bare employer name produced; two candidate entries is not a placement |
| **two frames on one entry** | silent stacking of a second figure inside one experience block, which no layout defines |

- **`profile.ts` is not edited by this decision**, which is what keeps `dist/cv.pdf` byte-identical to
  its merge-base as a free falsifier.
- **The dependency edge is one-way and must stay so:** `journey.ts` imports `profile.ts`; `profile.ts`
  never imports `journey.ts`. The reverse edge puts a photograph's placement into the module `/cv.pdf`
  prints from.
- **The owner's own sentences stay verbatim in `journey.ts`'s module comment.** The pair is a
  normalisation of what he said, and normalisation launders provenance.

The photograph budget is [ADR-0048](./0048-content-photograph-is-a-captioned-figure.md)'s, deliberately
not restated here.

### Rejected options that are still live

No test refuses options 1 and 2, so their reasoning stays here. Option 3 is refused by the
`EngagementKey` type in `journey.ts`, which requires both fields; its one line stays because it is the
shape a reader reaches for first.

1. **An opaque id on each experience entry (`experience_id`).** Not a content change — it renders,
   prints and translates nowhere — but it leaks placement into the module `/cv.pdf` prints from, it
   edits `profile.ts`, and it is unverifiable on sight: a reviewer holding the owner's sentence can
   check a company and a start date, and cannot check an id.
2. **The array index.** Reordering the CV — ordinary editorial work — silently re-attributes every
   photograph while every index still resolves. A key that survives the edit that invalidates it is the
   worst available shape.
3. **The employer name alone.** Measured failing: `company` is not unique in this CV and will be less
   unique over time.

### Consequences still being paid

- **Two files carry the same employer strings.** A correction in `profile.ts` — an employer renamed, a
  start date fixed — reddens the build until `journey.ts` follows. The intended failure direction, and
  still a cost: someone editing the CV is stopped by a module about photographs.
- **The AWS employer string carries a U+2014 em dash**, easy to retype as a hyphen. It is spelled once
  in `journey.ts` as a named constant; a hyphen produces a zero-match refusal, loud but only at build
  time.
- **Nothing enforces pair-uniqueness inside `profile.ts`.** Two entries sharing a company and a start
  date would be legal CV data and would make one frame unplaceable; the guard refuses rather than
  guesses, so the CV edit is blocked by the photograph module.
- **The test map spells every key a second time**, deliberately, so it asserts something about the
  source instead of agreeing with it by construction. Correcting an attribution is two edits, and
  adding a frame is two authorings (#548 paid exactly that when it added a fifth frame).

### Where it came from

[#516](https://github.com/tedeuxx/tadeumendonca-io/issues/516) — the Issue, the owner's six rulings and
`tech-lead`'s slice-2 design comment; [PR #517](https://github.com/tedeuxx/tadeumendonca-io/pull/517),
slice 1, which authored the employer-name shape and measured it failing; #548, the fifth frame. The
code: `apps/fed/src/data/journey.ts` (the ATTRIBUTION, JOIN and TWO HAZARDS paragraphs) and
`apps/fed/src/data/journey.test.ts` (the three refusals, each watched to fire). Absorbed here by #456.

## Links
- Driven by ADR-0053 (lean by design), ADR-0002 · the CV lives at **`/me`** — `/pt/me` · `/en/me` under ADR-0036's locale
  prefixes; the `/cv` this line used to name was renamed to `/me`, and its back-compat redirect separately dropped, in two 2026-07-24 amendments to ADR-0010 (#234) · the sync process itself is private
  (kept outside this repo) · bilingual authoring per the amendment above, within
  [ADR-0032](./0032-i18n-locale-layer-english-baseline.md) · derived-facts convention per the 2026-07-23
  amendment.
- Canva retired by the 2026-07-28 amendment (Issue #225), taking the decision the downloadable-CV record
  deferred; the downloadable CV is `/cv.pdf` per *The downloadable edition* above (formerly record 0034,
  absorbed by #456). **Logical retirement, not deletion** — the design
  is kept and simply stops being a surface, so the residual risk is a retained artifact that still
  contradicts the site. **No follow-up action** — nothing links to it from the site or from LinkedIn, so
  the retirement takes effect on merge.
- *The downloadable edition* absorbed from record 0034 on 2026-11-01 under
  [ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md)'s
  entry rule (Issue #456); the decision is unchanged, and the library's History table carries the row.
- *Attribution from outside the CV* absorbed from record 0050 on 2026-11-01 under the same entry rule
  (Issue #456); the decision is unchanged, and the library's History table carries the row.
