# 0001. Lean by design — architecture calibrated to the strategic priority

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Supersedes / superseded by:** — (this is the driver the retired-platform ADRs are superseded *toward*)
- **Driven by:** ~~the site's strategic role (proof-of-engineering presence)~~ the site's mission, as
  recentered on 2026-10-16 (#688) — see *Amendment (2026-10-16)* below
- **Amended:** 2026-10-16 (#688 — the reason changed, the decision did not)

## Context & problem
`tadeumendonca.io` is a ~~**proof-of-engineering personal presence**~~ **personal presence** (struck
2026-10-16, #688 — see the amendment), not a product with users or scale.
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
- Amended by: [#688](https://github.com/tedeuxx/tadeumendonca-io/issues/688) (the mission recentering,
  2026-10-16).

## Amendment (2026-10-16) — the reason changed; the decision stands

**The stated reason no longer holds.** This record was driven by the site's role as a
*proof-of-engineering presence*, a pitch whose argument was the code. As of #688 that is not the site's
mission. **The mission is the owner's personal, independent commitment to learn in public with the
people and machines of this era, turn lived experience into language, and give back what he finds** —
written as an ongoing book of situated chapters, for as long as he can sustain the tools and
infrastructure behind it. **The harness is the workshop, not the mission**: the code, the decisions and
their trade-offs stay public as evidence of the work, not as the pitch. This is the wording PR #743
lands in the root brief and the README; this record points at it rather than restating a second
version.

**The decision holds — lean by design — and the new mission argues for it more directly than the old
one did.** Re-run against the record's own drivers:

- **Cost.** The mission is bounded by what the owner can personally sustain. A commitment whose
  duration is set by its running cost is the strongest case this library has for near-zero,
  scale-to-zero infrastructure; standing compute would shorten the commitment it serves.
- **Simplicity and gradual evolution.** Unchanged. The surfaces are still content-shaped (CV,
  portfolio, reading shelf, long-form writing), and none of them needs a server.
- **"The argument is the code."** Reworded, not dropped: the code is no longer *the argument* for a
  repositioning, it is the public workshop the writing comes out of. A defensible, documented lean
  architecture still matters because the repository stays public.

**The considered options re-read under the new mission.** Option 2 (keep the backend-ful platform)
fails harder, on the cost driver above. Option 3 (a flat site or template) is still rejected, but on a
narrower ground: ~~it *"surrenders the SPA/agent-built engineering argument that is the proof"*~~ —
there is no longer a proof to surrender. It is rejected because the workshop is part of what the writing
is about and stays public as evidence of the work, and because the existing surfaces (bilingual
prerender, typed data, per-locale cards) already run at near-zero cost, so going leaner would buy no
saving the mission needs.

**This amendment is the revisit the record asked for.** Its own *Bad* consequence says the architecture
*"must be revisited when the strategy shifts"*. The strategy shifted; the revisit finds the architecture
unchanged. No ADR is written for the mission itself: a mission is positioning, not an architecture
decision, and it crosses no significance boundary in this library.

**Left as history, deliberately.** ADR-0010, ADR-0020 and ADR-0033 describe the site as a
proof-of-engineering site in their context. Those sentences record why each decision was taken when it
was taken, and each decision still stands on its own merits, so they are not rewritten. Read
*proof-of-engineering* in any record dated before 2026-10-16 as the mission of that time.

**Accepted cost.** The library's keystone now carries a reason that differs from the context paragraph
above it, and the reader has to reach this amendment to reconcile the two. Struck-in-place markers on
the header and on the first context sentence are the only signal before that point.
