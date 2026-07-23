# 0028. GitFlow, staging + production two-environment

- **Status:** superseded by [ADR-0003](./0003-trunk-based-single-environment.md) (2026-07)
- **Date:** decided ~2026-06 · superseded 2026-07-22
- **Deciders:** the owner

## Context & problem (as it stood then)
Delivery ran **GitFlow**: a `develop` integration branch auto-deploying to a **staging** environment, and a
`main` release branch deploying to **production** behind a manual approval, with per-environment gates.

## Why it was decided (then)
A backend-ful product with real users would want a staging tier to validate auth/email/edge before
production, and a promotion gate to control production releases.

## Why it was superseded
For a static personal site with one maintainer and no blast radius beyond a CDN (ADR-0001/0002), a second
environment and a promotion pipeline are ceremony without payoff — a `develop` branch nothing needs and a
promotion with no independent approver. Adopted **trunk-based, single environment** (ADR-0003): the PR
carries the full gate, the merge is the deploy and the go/no-go.

## Consequences of the reversal
- No staging tier to fund or keep in sync; the full regression moved onto the PR (ADR-0018).
- Lost: a pre-production environment. Accepted — the comprehensive PR gate + forward-fix discipline replace it.

## Links
- Superseded by ADR-0003 · the gate that compensates is ADR-0018 (full gate on the PR).
