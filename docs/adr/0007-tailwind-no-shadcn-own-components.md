# 0007. Tailwind with own components — no shadcn/ui

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0008](./0008-brutalist-mono-identity.md)

## Context & problem
The SPA needs a styling approach and a component layer. The default modern path is Tailwind + a component
library like shadcn/ui. But the site has a strong, singular visual identity (ADR-0008, brutalist mono) —
and a component library's opinionated defaults (rounded corners, shadows, its own tokens) fight a
radius-0, no-shadow aesthetic more than they help.

## Decision drivers
- ADR-0008: a committed, unusual identity that a generic component kit works against.
- ADR-0001: own the design layer — it's part of the engineering argument.
- Keep the surface small: a personal site has few components.

## Considered options
1. **Tailwind v3 + own components, HSL design tokens, a `cn()` helper** (chosen) — Tailwind for utilities;
   components hand-written in `src/components/`; design tokens as HSL CSS variables consumed via
   `hsl(var(--x))`; a `cn()` class-merge helper (clsx + tailwind-merge — the shadcn-popularized *pattern*,
   without shadcn's component library). *Trade-off:* every primitive (states, forms) is hand-built.
2. **Tailwind + shadcn/ui** — *Why not:* its defaults (radius, shadow, its token system) contradict the
   brutalist identity; overriding them all is more work than owning a small set of components, and it
   dilutes the "this is my design" argument.
3. **A CSS-in-JS / component framework (MUI, Chakra)** — *Why not:* heavier, more opinionated, further
   from the exposed-grid brutalist look; runtime styling cost.

## Decision outcome
Chosen: **Tailwind + own components, no shadcn.** The `cn()` helper adopts the useful shadcn *convention*
(clsx + tailwind-merge) but nothing of its component library. This is a **fixed decision** — the identity
depends on owning the primitives.

## Consequences
**Good**
- Total control of the look — the brutalist identity is expressed directly, not fought.
- Small, owned component set; no library to override or track.

**Bad / accepted costs**
- Every UI primitive (loading/empty/error states, forms) is hand-built (`Column.tsx`, `Form.tsx`).
- No off-the-shelf accessibility/behavior from a component kit — a11y is the `ux` concern's job, done by hand.

## Links
- Driven by ADR-0001, serves ADR-0008 (the identity) · `cn()` = clsx + tailwind-merge (shadcn convention,
  not its components) · a fixed decision (see repo `CLAUDE.md`).
