# 0022. Numeric SemVer, auto-bump + release on merge

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0003](./0003-trunk-based-single-environment.md)

## Context & problem
Trunk-based delivery (ADR-0003) ships on every merge. Those ships need to be **versioned and traceable** —
a way to point at "what was live at vX.Y.Z" — without adding manual release ceremony that a solo,
merge-is-deploy model doesn't want.

## Decision drivers
- ADR-0003: the merge is the ship — versioning should ride it, not gate it.
- Traceability: a tag + release per shipped change.
- No ceremony, no pre-release noise.

## Considered options
1. **Numeric SemVer, auto-bump on push to `main`** (chosen) — `version-main` bumps the patch on every
   push, tags `vX.Y.Z`, and publishes a GitHub Release with categorized notes; the `bump:` commit is
   loop-guarded. *Trade-off:* a release per merge (fine — merges are deploys).
2. **SemVer with `-dev` pre-releases** — *Why not:* rejected by the owner; pre-release suffixes add noise
   for a single-environment site where every merge is the real thing.
3. **Manual tagging** — *Why not:* ceremony the merge-is-deploy model doesn't want; easy to forget.

## Decision outcome
Chosen: **purely numeric SemVer, auto-bumped and released on merge to `main`.** Every ship is a tag and a
Release, automatically.

## Consequences
**Good**
- Every deploy is versioned and traceable with zero manual steps.
- Categorized release notes give a per-ship changelog for free.

**Bad / accepted costs**
- The release automation is load-bearing: a fragility in the notes step (an empty category aborting under
  `bash -e`) once tagged versions without publishing their Release — found and fixed this session, a
  reminder that the pipeline needs its own care.
- **Second instance, 2026-07-23, worse than the first.** Two merges 16 seconds apart caused a
  non-fast-forward push; because `git push` is **not atomic by default**, the branch was rejected while
  the tag went through, orphaning `v0.1.39`. Every later run then died on "tag already exists" — **four
  consecutive merges shipped no version and no Release**, and the break was self-perpetuating rather than
  self-healing. Fixed with `--atomic` plus a fetch/reset/retry loop.
  The pattern across both incidents is the real cost being accepted here: **this pipeline is the one
  piece of automation with no gate of its own.** `build-test` is path-filtered to `apps/fed`, so a change
  to `.github/workflows/**` is verified by nothing and first executes on the live release path. That gap
  is tracked separately; until it closes, "the pipeline needs its own care" means a human reading the
  diff, which is exactly the kind of assurance this repo otherwise refuses to rely on.

## Links
- Driven by ADR-0003 · rules in the plugin's `/workflow/versioning` · `version-main` runs on merge.
