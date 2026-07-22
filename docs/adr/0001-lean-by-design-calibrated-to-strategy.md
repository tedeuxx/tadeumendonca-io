# 0001. Lean by design — architecture calibrated to the strategic priority

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Supersedes / superseded by:** — (this is the driver the retired-platform ADRs are superseded *toward*)
- **Driven by:** the site's strategic role (proof-of-engineering presence)

## Context & problem
`tadeumendonca.io` is a **proof-of-engineering personal presence**, not a product with users or scale.
Its current strategic priority is **presence through content and portfolio** — an interactive CV, a
curated catalog of public work, and long-form writing. It is not a playground (it must work), but it
also has no audience whose needs justify standing infrastructure.

The platform once carried far more: a Hono/Lambda BFF, DynamoDB, Cognito auth, SES, a Lambda@Edge OG
renderer, an offline-first PWA, a regional WAF. Each of those is recurring **cost**, **operational
surface**, and **attack surface** — paid continuously to serve capabilities the current strategy does
not need. The question this ADR settles: how much architecture should this site carry?

## Decision drivers
- **Cost** — a personal site should trend to near-zero / scale-to-zero, not carry always-on compute.
- **Simplicity** — the fewest moving parts that deliver the content/portfolio presence; every component
  must earn its place.
- **Gradual evolution** — add capability only when the strategy actually calls for it, not speculatively.
- **The argument is the code** — the leanness itself must be a *defensible* engineering judgment, since
  the repo is public and is the pitch.

## Considered options
1. **Lean by design, calibrated to the current strategy** (chosen) — carry only what content + portfolio
   presence requires; cut everything else; grow deliberately when a real need appears. *Trade-off:* any
   capability needing a server (auth, dynamic data, an API) must be re-introduced later — the path is
   known and catalogued, but not free.
2. **Keep the full backend-ful platform "just in case"** — retain the BFF/DB/auth/PWA/WAF. *Why not:*
   pays cost, complexity and attack surface every day for capabilities the strategy does not need; idle
   infrastructure on a personal site is exactly the over-engineering the principles forbid.
3. **Go even leaner — a flat HTML site or an off-the-shelf template** — *Why not:* surrenders the
   SPA/agent-built engineering argument that *is* the proof. Too lean undercuts the site's purpose.

## Decision outcome
Chosen: **lean by design**. The architecture is deliberately minimal and calibrated to the content +
portfolio presence the strategy prioritizes today. This is the reason the **backend and much else were
cut** (see the superseded ADRs), and it is the lens every other architectural decision in this library
is read through: prefer the simplest thing that serves the presence, defer capability until a real need
warrants the cost. Evolution is gradual — the fuller architecture is known and re-introducible (the dev
plugin even pre-catalogues the backend personas), just not warranted now.

## Consequences
**Good**
- Near-zero / scale-to-zero cost; minimal operational and attack surface.
- Fast, low-risk to change — little to break, nothing to keep running.
- The leanness is itself a documented engineering judgment — a proof-point, not an omission.

**Bad / accepted costs**
- Anything server-side (auth, dynamic data, an API, server telemetry) is **not** available today and
  requires re-introducing infrastructure when the strategy calls for it.
- "Calibrated to current strategy" means the architecture must be **revisited** when the strategy shifts;
  the lean choice is not permanent, it is *current*.

## Links
- Applied by: ADR-0002 (fully static, no backend), ADR-0003 (trunk-based single environment), and the
  infra/SDLC ADRs — each an instance of this principle.
- Superseded-toward: the retired backend-era ADRs point here as the reason they were reversed.
