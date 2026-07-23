# 0011. UI in pt-BR; bilingual i18n deferred

- **Status:** superseded by [ADR-0032](./0032-i18n-locale-layer-english-baseline.md) (2026-07)
- **Date:** decided 2026-07-22 · superseded 2026-07-23
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)

## Context & problem
The site's UI copy and content need a language. There is a real tension: everything *published on GitHub*
(READMEs, commits, this repo's docs) is English by convention, but the site is content for a pt-BR
audience. And the owner's profile data (the CV) is currently in English while the UI is pt-BR — an
inconsistency worth naming.

## Decision drivers
- The site's audience/content is pt-BR; the site's UI is *content*, not a GitHub publication.
- ADR-0001: don't build an i18n framework before it earns its cost.
- A bilingual EN/PT site is a genuine future goal (reach), but a separate, larger effort.

## Considered options
1. **Single-language pt-BR UI, no i18n framework, i18n deferred** (chosen) — inline pt-BR strings, `pt-BR`
   date locale; the site UI is pt-BR because it is content. A bilingual EN/PT phase is planned but **not
   built**. *Trade-off:* adding EN later is a real migration (extract strings, a locale layer), and the
   current UI-pt-BR / profile-data-EN inconsistency persists until then.
2. **Build i18n now (EN + PT from the start)** — *Why not:* an i18n framework, duplicated content, and a
   locale layer are significant cost for a reach goal that isn't the current priority (ADR-0001); it also
   reverses the repo's prior "100% pt-BR, no i18n" fixed decision, which is a deliberate, planned change,
   not an incidental one.
3. **English UI** — *Why not:* the content and audience are pt-BR; an English UI serves neither.

## Decision outcome
Chosen: **pt-BR UI now, i18n deferred to its own phase.** The site UI is pt-BR (content, not publication);
GitHub-published text stays English. The bilingual EN/PT goal — and the reconciliation of the
UI-pt-BR / profile-data-EN inconsistency — is a planned future phase, recorded so it isn't forgotten.

## Consequences
**Good**
- No i18n machinery to build or maintain before it's warranted; the simplest thing that serves today's
  audience.
- The English-on-GitHub / pt-BR-on-site split is explicit, not accidental.

**Bad / accepted costs**
- Adding EN later is a migration, not a config flip (string extraction + a locale layer).
- The current inconsistency — pt-BR UI with English profile data — stands until the i18n phase resolves it.

## Links
- Driven by ADR-0001 · reverses the prior "100% pt-BR, no i18n" fixed decision as a *planned* future phase
  (see `docs/redesign/redesign-plan.md`, Fase i18n).
- **Superseded by [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)** — the deferred i18n phase this
  ADR named is now built: a light in-repo locale layer with native auto-detect + a manual toggle, and an
  English-pinned crawlable baseline.
