# 0009. Self-hosted fonts — Space Grotesk + JetBrains Mono

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0008](./0008-brutalist-mono-identity.md)

## Context & problem
The brutalist mono identity (ADR-0008) needs a type pairing: a geometric display/body face and a true
monospace for labels/code. Web fonts can be loaded from a third-party CDN (Google Fonts) or self-hosted.

## Decision drivers
- ADR-0008: a display face with engineering character + a real monospace.
- No third-party request on page load (privacy, a blocked-CDN failure mode, and a self-contained bundle).
- ADR-0001: minimal external dependencies.

## Considered options
1. **Self-hosted Space Grotesk + JetBrains Mono via `@fontsource`** (chosen) — the font files are bundled
   and served from the site's own origin; Space Grotesk for display/body, JetBrains Mono for
   mono/labels. *Trade-off:* the font files add to the bundle/build.
2. **Google Fonts CDN** — *Why not:* a third-party request on every load — a privacy leak, an external
   point of failure, and a dependency the self-contained static model avoids.
3. **System fonts only** — *Why not:* forfeits the identity; the whole point of ADR-0008 is a specific,
   engineered type voice.

## Decision outcome
Chosen: **self-hosted Space Grotesk + JetBrains Mono** (`@fontsource`). No font request leaves the site's
origin; the type identity is part of the shipped bundle.

## Consequences
**Good**
- Zero third-party font request — privacy-clean, no external failure mode, fully self-contained.
- The identity's type voice is guaranteed present, not CDN-dependent.

**Bad / accepted costs**
- Font files add weight to the bundle/build (a performance-budget item — subset to the weights actually
  used).
- Font updates are a dependency bump, not automatic from a CDN.

## Links
- Driven by ADR-0001, serves ADR-0008 · self-hosting keeps the bundle self-contained (no external hosts,
  aligning with the static model).
