# 0012. snake_case in content/data, no mapping layer

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)

## Context & problem
Content and data — markdown frontmatter, the profile/catalog data modules — need a field-naming
convention. JavaScript/TypeScript idiom is camelCase; data/serialization idiom is often snake_case. A
choice at the boundary determines whether a mapping layer is needed.

## Decision drivers
- ADR-0001: avoid layers that don't earn their keep — a camel↔snake mapper is pure overhead if avoidable.
- Consistency between frontmatter authored by hand and the typed data the app reads.
- The convention predates the static pivot (it was the API contract style); keeping it avoids a churn.

## Considered options
1. **snake_case in content/data, no mapping layer** (chosen) — markdown frontmatter and the data modules
   use `snake_case` (e.g. `og_image`, `published_time`); the TypeScript types use the same keys, so the
   app reads the data as authored with **no transformation**. *Trade-off:* snake_case keys sit inside
   otherwise-camelCase TS, a mild idiom mismatch.
2. **camelCase everywhere + a mapping layer at the content boundary** — *Why not:* a mapper to convert
   frontmatter → camelCase is a layer with no payoff here; it's the over-engineering ADR-0001 forbids.
3. **camelCase in frontmatter too** — *Why not:* less natural for hand-authored YAML frontmatter, and it
   would churn the existing convention for no real gain.

## Decision outcome
Chosen: **snake_case in content/data, consumed directly.** The types mirror the authored keys; there is no
mapping layer. Simplicity over idiom purity.

## Consequences
**Good**
- No transformation layer — the data is read exactly as authored; less code, fewer bugs at the boundary.
- Consistent between hand-written frontmatter and the typed model.

**Bad / accepted costs**
- snake_case keys inside camelCase TypeScript is a mild stylistic inconsistency (lint is configured to
  tolerate it at the data boundary).

## Links
- Driven by ADR-0001 · applies to markdown frontmatter and the `src/data` modules.
