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

## Links
- Driven by ADR-0001, ADR-0006 · the CV lives at `/cv` (ADR-0010) · the sync process itself is private
  (kept outside this repo) · bilingual authoring per the amendment above, within
  [ADR-0032](./0032-i18n-locale-layer-english-baseline.md).
