# 0008. Brutalist mono visual identity, single theme

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Supersedes / superseded by:** supersedes the earlier Borussia-Dortmund identity (History index)
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)

## Context & problem
The site needs a visual identity that reads as *an engineer's* — "engineering on display" — and that
backs the AI-Engineer positioning without looking like a template. An earlier identity (Borussia-Dortmund
palette: black/graphite + gold, Archivo/Inter) didn't express the positioning and was replaced.

## Decision drivers
- The look should signal engineering rigor and be memorable, not generic.
- One committed identity, not a themeable system — a personal site has one voice.
- ADR-0001: the design is owned and is part of the argument.

## Considered options
1. **Modern brutalist mono, single theme** (chosen) — near-black `#0A0A0A` on warm off-white `#F5F4EF`,
   **one** accent (safety orange `#FF5A00`), **radius 0, no shadow, no gradient**, a visible 12-column
   grid. Space Grotesk + JetBrains Mono (ADR-0009). No dark/light toggle. *Trade-off:* a strong, polarizing
   aesthetic — deliberately not for everyone.
2. **A conventional clean/rounded product look (soft shadows, rounded cards, a component kit)** — *Why
   not:* generic; reads as a template, not an engineer's own; and it's what a component library gives by
   default (the reason for ADR-0007).
3. **Dark/light themeable system** — *Why not:* two themes to design and maintain for one personal voice;
   the single committed identity is stronger and simpler (ADR-0001).

## Decision outcome
Chosen: **brutalist mono, one accent, radius-0, single theme.** This is a **fixed decision**; it drives
ADR-0007 (own components, since a kit fights it) and ADR-0009 (the type pairing). The exposed grid and the
absence of shadow/gradient are the point — the structure is visible.

## Consequences
**Good**
- Memorable, singular, and legibly "an engineer's" — backs the positioning.
- Simple token system (one theme, one accent, zero radius) — little to maintain.

**Bad / accepted costs**
- Polarizing by design; a conventional audience may find it stark.
- Radius-0/no-shadow must be enforced (tokens collapse the radius scale) or a stray `rounded-*` breaks the
  look; a component kit couldn't be used off-the-shelf (ADR-0007).

## Amendment (2026-07-23) — the portrait is round; radius 0 still holds everywhere else
The **portrait** (the `/cv` header image and the small greyscale one in the landing's aside) is now a
circle. Nothing else changes: cards, buttons, inputs, badges and rules stay **radius 0**.

The reasoning is that "radius 0" is a rule about **surfaces** — the visible structure this ADR exists to
expose. A face is not a surface; a circular crop is the convention for a portrait, the way a rule is the
convention for a boundary. Applying the surface rule to a photograph was over-reach, not identity.

**How it is carved matters more than the change itself.** The Tailwind `borderRadius` scale stays
collapsed to `0` — `full` included — so the guard recorded under *accepted costs* above still works: a
stray `rounded-*` anywhere renders square. The exception is a hand-written utility,
`.avatar-round` in `src/styles/index.css`, deliberately **not reachable through Tailwind**. Opening the
scale to obtain one circle would have traded a named exception for an open door, which is precisely how
this identity would erode.

Same shape of decision as the `LocaleProvider` carve-out in
[ADR-0032](./0032-i18n-locale-layer-english-baseline.md): a deliberate, documented exception, recorded
so a later reader does not mistake it for drift — or, worse, cite it as precedent for rounding a card.

*Accepted cost:* `object-cover` crops harder inside a circle than a square, so the portrait loses more of
its edges; the framing is chosen for the round crop now.

## Links
- Driven by ADR-0001 · drives ADR-0007 (own components) and ADR-0009 (fonts) · supersedes the
  Borussia-Dortmund identity (History index) · a fixed decision (see repo `CLAUDE.md`) · amended above
  for the portrait, within the same guard.
