# 0019. Complete automated functional regression

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0003](./0003-trunk-based-single-environment.md), [ADR-0018](./0018-ci-gates-e2e-on-pr-coverage.md)

## Context & problem
With no staging tier (ADR-0003) and the whole gate on the PR (ADR-0018), the thing that proves *nothing
already working broke* is the regression suite. If that suite only samples, a regression in an
un-sampled path ships silently. How complete must it be?

## Decision drivers
- No staging net — the regression is the only proof against silent breakage.
- The site must be **evolvable incrementally without fear** — that only holds if the floor is complete.
- The suite must match the surfaces the repo actually has, not an imagined stack.

## Considered options
1. **Complete functional coverage — every feature ships with its regression** (chosen) — the E2E suite
   functionally covers **100% of implemented features**; every new feature adds its own journey. Which
   suites constitute the regression is read from the repo: **E2E** wherever there is UI; an **API/contract
   suite only where an API exists** (none today). *Trade-off:* every feature carries the discipline cost
   of its own regression.
2. **Representative sampling** — test a subset. *Why not:* the un-sampled tail regresses silently — exactly
   what a no-staging repo cannot afford.
3. **Demand an API regression regardless** — *Why not:* there is no API; requiring coverage of a surface
   that doesn't exist is an unsatisfiable gate that trains fabricated evidence (a lesson from the
   dev-loop reconciliation).

## Decision outcome
Chosen: **100% functional regression**, instantiated as E2E today (no API), added to as features ship.
This is the one gate that does not bend to blast-radius — it is the floor that makes incremental
evolution safe. When a backend returns, the API/contract suite becomes part of the same invariant.

## Consequences
**Good**
- The platform can be changed freely — the suite guards everything already working.
- The invariant reads the repo, so it stays honest as the architecture evolves.

**Bad / accepted costs**
- Every feature must add its regression — real, ongoing discipline (enforced by the MR Definition of Done).
- "100%" is **functional** coverage (journeys over features), not line coverage — a distinct, weaker-
  sounding but stronger-in-practice guarantee that must not be confused with the ≥85% unit line target.

## Links
- Driven by ADR-0003, ADR-0018 · unit coverage floor is ADR-0018 · the invariant is defined in the
  plugin's `/principles/verification-and-gates`.
