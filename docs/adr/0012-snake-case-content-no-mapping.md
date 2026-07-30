# 0012. snake_case in content/data, no mapping layer

- **Status:** accepted · **amended 2026-07-30** (the casing split: camelCase in frontmatter and the catalog modules, snake_case in `profile.ts`; the no-mapping-layer decision is unchanged)
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

## Amendment (2026-07-30) — the convention split, and nobody recorded it

**What is true now.** The decision above says markdown frontmatter *and* the data modules use
`snake_case`. Only half of that still holds:

| where | convention | evidence |
|---|---|---|
| blog frontmatter | **camelCase** | `src/lib/content.ts` — `FACT_KEYS` reads `linkedinUrl`, `hasVideo`, `ogImage` |
| `src/data/catalog.ts`, `repoCards.ts` | **camelCase** | `repoUrl`, `liveUrl` |
| `src/data/profile.ts` | **snake_case**, unchanged | `profile_id`, `start_date`, `print_highlight_index` |

The decision's own example is the sharpest evidence: it names **`og_image`**, and the field in the code
is **`ogImage`**. The ADR has been describing a contract the code stopped honouring, while sitting at
`accepted` and unsuperseded — so a reader consulting the library got the wrong answer with no signal.

**How it happened, since that is the useful part.** Nothing decided this. The static pivot rewrote the
content pipeline, the new modules were authored in the idiom their surrounding TypeScript uses, and
`profile.ts` — the one module that predates the pivot — was never touched. A convention drifted one
module at a time, and each step was locally reasonable.

**What this amendment does and does not do.** It records the split; it does **not** re-decide it. Both
halves keep the property the original decision was actually about — **no mapping layer**: each module's
types mirror its authored keys and the app reads the data as written. That is the load-bearing half of
ADR-0012 and it is intact. What is superseded is the claim that one *casing* covers both.

Option 3 above — *"camelCase in frontmatter too"* — was rejected on the grounds that it would "churn the
existing convention for no real gain". The churn happened anyway, without the decision, which is the
honest reading: the rejection did not survive contact with a pipeline rewrite.

**Not normalising, deliberately.** Converting `profile.ts` to camelCase would touch the CV — the most
reviewed data in the repo, and the source of `/cv.pdf` — for a stylistic gain and no functional one.
Converting the frontmatter back would churn published articles. The split costs one sentence of
explanation; either migration costs a slice and risks the CV. **Follow the file you are in.**

Found by the `critical-reviewer` on #261, which had just replaced a stale README claim about this with a
different claim that was true of the code and contradicted this ADR — a correction that would have
overturned a fixed decision without recording it.

## Links
- Driven by ADR-0001 · applies to markdown frontmatter and the `src/data` modules, with the casing split
  recorded in the 2026-07-30 amendment above.
