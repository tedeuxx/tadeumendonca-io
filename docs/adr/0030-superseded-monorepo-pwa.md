# 0030. Monorepo `tadeumendonca-pwa` consolidation

- **Status:** superseded by the `-io` rename + static pivot (2026-07)
- **Date:** decided ~2026-06 · superseded 2026-07-22
- **Deciders:** the owner

## Context & problem (as it stood then)
The platform was consolidated into a single monorepo, **`tadeumendonca-pwa`**, holding `apps/fed` (SPA),
`apps/bff` (the BFF), and `iac/` (app infra) together, replacing the earlier separate `-fed` / `-api`
repos.

## Why it was decided (then)
With a coupled frontend + BFF + shared infra, a monorepo simplified cross-cutting changes and shared
contracts across the app + backend.

## Why it was superseded
Retiring the backend (ADR-0025) left only the SPA + its frontend infra — there is no second app to share a
monorepo with. The repo was renamed **`tadeumendonca-io`** and reduced to the static site + its `iac/`. The
`apps/` nesting remains vestigial (`apps/fed`) but there is no `apps/bff`.

## Consequences of the reversal
- A single-purpose repo for a single app; simpler than a monorepo with one occupant.
- The rename to immutable-ID OIDC caught a real trap (every assume-role broke on the plain-name subject —
  see ADR-0015); and the Terraform Cloud workspace name still carries `-pwa-` history deliberately.

## Links
- Superseded by the `-io` rename + static pivot · the OIDC-subject trap it exposed is recorded in ADR-0015.
