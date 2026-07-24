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

## Links
- Driven by ADR-0001, ADR-0006 · the CV lives at `/cv` (ADR-0010) · the sync process itself is private
  (kept outside this repo) · bilingual authoring per the amendment above, within
  [ADR-0032](./0032-i18n-locale-layer-english-baseline.md) · derived-facts convention per the 2026-07-23
  amendment.
