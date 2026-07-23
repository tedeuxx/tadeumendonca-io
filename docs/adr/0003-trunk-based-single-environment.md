# 0003. Trunk-based delivery, single environment

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Supersedes / superseded by:** supersedes the GitFlow two-environment model (recorded in the History index)
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)

## Context & problem
Applying ADR-0001 to delivery: how many branches and environments does a one-person static site need?
The earlier platform ran GitFlow — a `develop` integration branch, a `main` release branch, and a
staging + production environment pair with a promotion gate. For a static personal site with one
maintainer and no blast radius beyond a CDN, that ceremony is cost without payoff.

This is the `trunk-single-env` model the dev-loop plugin defines (`/principles/dev-loop`); this ADR
records the product's decision to adopt it.

## Decision drivers
- ADR-0001: the fewest moving parts that work.
- One maintainer, one destination — a promotion pipeline has no second reviewer and no separate
  environment to protect.
- The merge should be the single, visible go/no-go.

## Considered options
1. **Trunk-based, single environment** (chosen) — one long-lived branch (`main`); feature branch → PR →
   merge → deploy to the one environment. The PR carries the whole gate; the merge is the go/no-go.
   *Trade-off:* no staging tier to catch a bad change before it is live — mitigated by the full gate
   (E2E, coverage, Sonar) running **on the PR**, not post-deploy.
2. **GitFlow with staging + production** — *Why not:* invents a `develop` branch nothing needs, a
   promotion step with no independent approver, and a second environment to pay for and keep in sync.
   Pure ceremony for this repo.

## Decision outcome
Chosen: **trunk-based, single environment**. `main` is the only branch and the working branch; merging
to it deploys the live site. Because there is no downstream tier to defer a check to, the **full
regression gates the PR** (see ADR-0017). The merge is production, so it is the go/no-go a human confirms.

## Consequences
**Good**
- Minimal branching/ops overhead; the pipeline mirrors the site's actual size.
- No staging environment to provision, fund, or drift.
- The go/no-go is unambiguous — it is the merge.

**Bad / accepted costs**
- No pre-production tier: a defect the PR gate misses reaches the live site directly, so the gate must
  be comprehensive and blocking (ADR-0017 puts E2E on the PR for exactly this reason).
- A fast forward-fix discipline (revert-on-`main` + re-deploy) replaces a promotion rollback.

## Links
- Driven by ADR-0001 · model defined in the dev-loop plugin (`/principles/dev-loop`, `trunk-single-env`)
  · relies on ADR-0017 (full gate on the PR) · supersedes the GitFlow two-environment model (History index).
