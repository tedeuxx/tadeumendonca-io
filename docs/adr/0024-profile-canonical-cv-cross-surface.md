# 0024. `profile.ts` is the canonical structured CV; cross-surface coherence

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0006](./0006-react-vite-typescript.md)

## Context & problem
The owner's professional presence spans several surfaces — this site, LinkedIn, and a designed CV (Canva).
They must tell **one coherent story**: the same positioning, the same facts. A contradiction between the
site's CV and LinkedIn undermines the credibility the presence exists to build. So the site needs a
decision about *where its CV lives* and *how it stays coherent* with the other surfaces.

## Decision drivers
- Presence is only as strong as its consistency across surfaces (ADR-0001 — the site is the storefront).
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
([ADR-0034](./0034-build-time-cv-pdf-static-artifact.md)) — is the downloadable one. **No CV *document* is
maintained by re-typing any more** — deliberately not "no CV artifact": LinkedIn is still hand-maintained
(see the cross-surface set below), and overstating that here is how a record gets quoted into a claim it
does not support.

**Why now, and why not at ADR-0034.** ADR-0034 deliberately declined to assert this (its "this does not
retire Canva" note, which named *this* ADR as where the teardown would be recorded when it came — this
amendment is that recording). At the time the site's PDF was a strictly *better copy of the same CV*, so
which one was canonical did not much matter. ADR-0034's **2026-07-28 amendment** changed that: `/cv.pdf`
became a **selective one-page edition**, a genuinely different artifact. Three editions of one person then
existed at once and "which is canonical" acquired an answer that matters (Issue #225).

**What it closes.** The private surface inventory recorded the Canva CV carrying a **different years figure
and a different summary** from what the site publishes — drift as a *document* rather than as a claim,
which is the failure mode this ADR exists to prevent and the one ADR-0034's Context paragraph describes.
Retiring the document removes **the class of drift**, rather than resyncing it once.

**Accepted costs (what is given up).**
- The Canva CV was a **designed artifact** with typographic polish a print stylesheet does not match. The
  replacement's design is the brutalist-mono print view (ADR-0008) — consistent, not equivalent.
- Canva was **editable without a deploy**. `/cv.pdf` is **build-frozen** (ADR-0034's accepted cost): it
  regenerates only on merge to `main`.
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

## Links
- Driven by ADR-0001, ADR-0006 · the CV lives at **`/me`** — `/pt/me` · `/en/me` under ADR-0036's locale
  prefixes; the `/cv` this line used to name was renamed to `/me`, and its back-compat redirect separately dropped, in two 2026-07-24 amendments to ADR-0010 (#234) · the sync process itself is private
  (kept outside this repo) · bilingual authoring per the amendment above, within
  [ADR-0032](./0032-i18n-locale-layer-english-baseline.md) · derived-facts convention per the 2026-07-23
  amendment.
- Canva retired by the 2026-07-28 amendment (Issue #225), taking the decision
  [ADR-0034](./0034-build-time-cv-pdf-static-artifact.md) deferred; the downloadable CV is `/cv.pdf` per
  that ADR and its 2026-07-28 one-page-edition amendment. **Logical retirement, not deletion** — the design
  is kept and simply stops being a surface, so the residual risk is a retained artifact that still
  contradicts the site. **No follow-up action** — nothing links to it from the site or from LinkedIn, so
  the retirement takes effect on merge.
