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
regression gates the PR** (see the CI-gate ADR). ~~The merge is production, so it is the go/no-go a
human confirms.~~ **Amended 2026-07-23:** the merge is still the go/no-go — what changed is **who holds
it**. The `critical-reviewer` subagent does, per methodology ADR-0004: it verifies the MR Definition of
Done and then **merges the safe class itself** (docs, dependency bumps, tests, in-pattern work against an
already-approved spec) or **escalates the boundary class to the owner** — `iac/`, contract/schema,
positioning or public-facing **content by path** (not by directory: the CV and article markdown live under
`apps/fed`), anything creating or changing an ADR decision, anything irreversible. *Significance beats
in-pattern.* A blanket human confirmation on every merge spent the owner's attention on in-pattern work,
which devalues it at the boundary where it is actually needed. See `CLAUDE.md` §Branching.

## Amendment (2026-07-29) — how a ratification is proven, and what no longer needs one
Two corrections to the 2026-07-23 amendment above, both from operating it: the boundary path had **no
reliable completion**, and the boundary class was **far wider than intended**.

### 1. The ratification is an ARTIFACT the reviewer reads, never a relay it is asked to trust (#217)

The gate deadlocked in practice, and — worse — resolved **differently per reviewer instance**. Some merged
on the main agent relaying "the owner said yes"; one declined, and its reasoning was correct:

> *"I have no way to distinguish 'the owner said yes' from 'an agent believes the owner said yes' … A guard
> that yields the first time it is inconvenient was never a guard."*

Both readings were defensible, which is what made it a defect: **a gate whose behaviour varies per instance
is not a gate.** The repo's history held both answers hours apart.

**Resolved:** the owner ratifies by **commenting on the PR**, and the reviewer **verifies that comment
itself** — `gh pr view <n> --json comments`, checking author, `authorAssociation: OWNER`, and timestamp.
The relay is a *notification* that a comment exists; it is never the authority. This removes the ambiguity
entirely rather than settling it by preference: the reviewer no longer has to decide whether to trust an
agent, because it is not being asked to.

Two conditions that follow, both learned the hard way:
- **The ratification must post-date the head it ratifies.** A push after the comment invalidates it — the
  owner approved a tree that no longer exists. The reviewer checks `headRefOid` has not moved.
- **A comment, not a GitHub approval**, because the PR author is the owner and GitHub blocks
  self-approval. That is a platform constraint, not a weaker mechanism: a comment is equally machine-readable.

*Why a comment rather than a label, a checkbox, or a branch-protection rule:* all three are also
machine-readable, and any would work. The comment wins on being the artifact the owner is already producing
while reviewing — nothing new to remember, and it carries his words, so the record shows *what* he approved,
not merely *that* he did.

**What this mechanism does NOT establish, stated so it is not mistaken for more.** The `gh` token
authenticates **as the owner**, so a verified comment proves it exists, is attributed to the OWNER account,
and post-dates the head — but **not** that he typed it rather than an agent holding his token. The check
raises the bar from *"an agent asserts he agreed"* to *"an artifact under his account says so, and the
reviewer read it"*; it is not cryptographic proof of a human. Closing that gap would need a signal outside
this token's reach (a branch-protection approval from a second account, a signed commit), which for a
single-maintainer repo costs more than the risk it removes. Recorded because a gate that overstates its own
guarantee is worse than one that names its limit — and because the day this repo gains a second
contributor, this is the paragraph to re-read.

### 2. Record correction is SAFE class — the owner should not ratify the same thing twice

The 2026-07-23 amendment made "anything creating or changing an ADR decision" boundary. Operated, that swept
in changes creating **no decision at all**: ADR-0032 still saying "Slice 2 is deferred" after the owner
accepted ADR-0036 is not a new decision — it is the record lagging one he already took. On 2026-07-29, six
of seven merged slices were boundary and three of those decided nothing. In a repo whose product is
substantially ADRs, guides and positioning, boundary had become the **norm**, which inverts the point of the
gate: the owner's attention was being spent on the median slice instead of the load-bearing one.

**Owner decision (2026-07-29):** a change that only makes the record match decisions **already ratified** is
safe class, and the reviewer merges it.

**The test is what the correction ASSERTS, not whether it decides.** "Makes no decision" was the first
formulation and it is insufficient — a discharge carries facts of its own, and those can be false. On the
sweep that prompted this (#234), three discharges asserted new facts and **two were wrong**, one wrong in
three consecutive review rounds. A correction is safe when its own content is trivially checkable, not when
its intent is modest.

| Safe — the reviewer merges | Boundary — still the owner's |
|---|---|
| A **purely referential** discharge: `→ discharged <date> by ADR-00NN`, where 00NN is already accepted and visibly supersedes the struck text. Asserts nothing beyond the pointer; two files confirm it | A discharge asserting a **new fact** — a date, a cause, a file's history, "this never existed", "the premise expired". Facts need checking, and facts are where the errors landed |
| A route/file/workflow literal corrected against a mechanically checkable source (`routes.mjs`, the workflow, the file tree) | A discharge that **reinterprets scope** — "what this ADR still owns", "EN-only by choice rather than by limit". Neither reverses a decision; both judge what the record *means* |
| A guide's description of what the code now does | An amendment that **chooses** something · reader-facing copy · `iac/` that mutates · anything irreversible |
| | A change to **these merge rules** — always, by construction |

**The failure mode, recorded so it is not discovered later:** a "correction" that quietly decides something,
or that asserts a fact nobody checked. Both hide in the same place — a diff that looks janitorial. When a
correction requires *choosing* wording that changes what the record commits to, it is a decision wearing a
correction's clothes; when it states *why* or *when* something changed, it is a claim to be verified like
any other.

**Attribution, precisely:** the owner decided that record correction is safe class. The *"what it asserts"*
test that narrows it is the `critical-reviewer`'s refinement, adopted here because the evidence for it is
this ADR's own driving issue — and it makes the class **narrower**, never wider.

## Consequences
**Good**
- Minimal branching/ops overhead; the pipeline mirrors the site's actual size.
- No staging environment to provision, fund, or drift.
- The go/no-go is unambiguous — it is the merge.

**Bad / accepted costs**
- No pre-production tier: a defect the PR gate misses reaches the live site directly, so the gate must
  be comprehensive and blocking (the CI-gate ADR puts E2E on the PR for exactly this reason).
- A fast forward-fix discipline (revert-on-`main` + re-deploy) replaces a promotion rollback.

## Links
- Driven by ADR-0001 · model defined in the dev-loop plugin (`/principles/dev-loop`, `trunk-single-env`)
  · relies on the CI-gate ADR (full gate on the PR) · supersedes the GitFlow two-environment model (History index).
