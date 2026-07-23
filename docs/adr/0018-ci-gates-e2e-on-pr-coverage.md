# 0018. CI gates on the PR — E2E included, unit coverage ≥85%

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0003](./0003-trunk-based-single-environment.md)

## Context & problem
Trunk-based, single-environment delivery (ADR-0003) has **no staging tier** to catch a bad change before
it is live — the merge is production. So the PR gate is the *only* place verification happens; anything
not checked there is not checked at all.

## Decision drivers
- ADR-0003: no downstream tier — the PR carries the whole gate.
- A route break must fail *before* it deploys, not after.
- The gate must be mechanical and blocking (agent-provable, not self-reported).

## Considered options
1. **Full gate on the PR** (chosen) — `build-test` runs lint + typecheck + unit tests (coverage **≥85%**)
   + build + **E2E against a preview of the build** + the SonarCloud gate; `infra-plan` runs checkov +
   `plan` for `iac/`. All blocking, on every PR to `main`. *Trade-off:* the PR is slower (a full E2E +
   Sonar run per PR).
2. **Defer E2E to post-deploy** (the old two-environment habit) — *Why not:* on a single-env repo the
   change is already live when E2E runs; a break reaches production first. This session moved E2E onto
   the PR for exactly this reason.
3. **Minimal gate (lint + unit only)** — *Why not:* insufficient when there is no staging net; route/
   integration breaks would ship.

## Decision outcome
Chosen: **the full gate runs on the PR**, E2E included, coverage ≥85%. Post-deploy E2E remains only as a
smoke against the real CDN (ADR-0023). ~~The merge stays the human go/no-go (ADR-0003).~~ **Amended
2026-07-23:** the merge's go/no-go is held by the `critical-reviewer`, which escalates the boundary class
to the owner — see the amendment on [ADR-0003](./0003-trunk-based-single-environment.md). Note the
division of labour that makes this work: **CI proves nothing broke; the reviewer judges whether the change
is right.** A green pipeline is not the review, and treating it as one is how the review gets skipped.

## Consequences
**Good**
- A break fails the PR, not the live site — the missing staging tier is compensated at the gate.
- Everything is mechanical and blocking; "done" is provable without a human re-checking.

**Bad / accepted costs**
- The PR is slower — a full E2E + Sonar run on every PR.
- The gate must stay comprehensive; a check dropped here has no downstream backstop (ADR-0019).

## Links
- Driven by ADR-0003 · the regression it runs is ADR-0019 · the quality gate is ADR-0020 · post-deploy
  smoke is ADR-0023 · the loop model is the plugin's `trunk-single-env`.
