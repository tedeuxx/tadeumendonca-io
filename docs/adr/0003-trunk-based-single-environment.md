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
~~positioning or public-facing **content by path** (not by directory: the CV and article markdown live
under `apps/fed`)~~ (retired by the 2026-07-30 amendment: reader-facing content is safe class; only
publishing an *article* still escalates), anything creating or changing an ADR decision, anything
irreversible. *Significance beats
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
| A guide's description of what the code now does | ~~An amendment that **chooses** something~~ (struck by the 2026-07-31 amendment below — safe class, unless the ADR amended is itself one that decides how work is decided, which is already clause 2) · ~~reader-facing copy~~ (safe class since the 2026-07-30 amendment below) · `iac/` that mutates · anything irreversible |
| | A change to **these merge rules** — always, by construction |

**The failure mode, recorded so it is not discovered later:** a "correction" that quietly decides something,
or that asserts a fact nobody checked. Both hide in the same place — a diff that looks janitorial. When a
correction requires *choosing* wording that changes what the record commits to, it is a decision wearing a
correction's clothes; when it states *why* or *when* something changed, it is a claim to be verified like
any other.

**Attribution, precisely:** the owner decided that record correction is safe class. The *"what it asserts"*
test that narrows it is the `critical-reviewer`'s refinement, adopted here because the evidence for it is
this ADR's own driving issue — and it makes the class **narrower**, never wider.

## Amendment, 2026-07-30 — the owner's boundary narrows to three things

**Owner decision.** Reader-facing content is **no longer** boundary class. The whole `product` backlog,
including copy a reader sees, is the reviewer's to merge. What still reaches the owner is exactly:

1. **`iac/`**, and anything that threatens the site's continuity.
2. **A change to the dev-loop's own rules** — this ADR, `CLAUDE.md`'s merge sections, an ADR that
   decides how work is decided. (This amendment is itself in that class, and is ratified as such.)
3. **Publishing an article** — the `content` backlog.

**The owner's reasoning, in their words:** the goal is set at the start; anything they would adjust
afterwards, during their own validation of the finished product, costs them nothing. A page whose
wording they would tune is not a decision they need to gate — it is a revision they will make.

**What this supersedes.** `CLAUDE.md`'s rule since #233 — *"if a diff changes words or images a reader
or a crawler will see, it is boundary"* — is retired.

**Its reasoning is not, and is restated here in full rather than pointed at**, because it governs every
enumeration in that guide and is independent of where the boundary sits. The first draft of this
amendment claimed the argument survived in `CLAUDE.md` while the same diff deleted it from there — the
reviewer caught a pair of mutually-deferring pointers, which is the failure the argument describes,
committed against itself:

> **Why a rule and not just a list:** an enumeration **fails open** — anything unlisted reads as safe
> class and merges without review. Two proofs, both found while writing the original section (#233):
> `catalog.ts` was missing from the list, so an edit to the portfolio's published copy classified as
> safe. And `index.html` was listed while `src/lib/site.ts` was not — `index.html`'s own comment says
> *"keep in sync with `DEFAULT_DESCRIPTION` in `src/lib/site.ts`"*, so **the list named the derived copy
> and missed the authoritative one**. A list will always lag.
>
> **And no check can close that gap.** A test can assert every *listed* path still exists, catching a
> rename. It cannot catch the failure that actually happens, which is **omission**: no check knows about
> a file nobody thought to list. The enforcement has to live in how a rule is *phrased*, which is why a
> rule of this kind is phrased to fail closed.

That reasoning now governs the three classes this amendment defines, and every other list in the guide.
Supersede, never rewrite — including the reasoning.

**The residue, accepted knowingly rather than overlooked.** The agent raised, and the owner accepted,
that one part of the reader-facing surface is not freely revisable: OG scrapers (LinkedIn, X, WhatsApp)
pin the card they first fetch, so a wrong unfurl on an already-shared post stays wrong *on that post*
and is right everywhere after. That is a bounded per-post cost, not a continuity threat, so it falls
inside class (1)'s exclusion rather than outside it.

**What does NOT change — and the guarantee is weaker than "does not change" suggests, so it is stated
precisely.** `brand-guardian` and `editor` are still dispatched on every reader-facing diff, but that
obligation lives in the `critical-reviewer` persona's own instructions, in the plugin repo. **No check,
no job and no hook enforces it** — it is prose, in a different repository, and this amendment does not
change that. It is a real practice with a real failure mode: a lens that is not dispatched now fails
silently.

**And the redundancy is gone.** Under the retired rule the owner was a *second* backstop behind
`brand-guardian`. They are now the *only* one on reader-facing copy. That is the actual cost of this
narrowing, and it is accepted rather than hidden — the lenses are better at this class than a human
reading a finished page, but there is no longer anything behind them.

Narrowing what reaches the *owner* does not narrow what
gets *reviewed* — and those two lenses catch precisely the class the owner is least able to catch by
reading a finished page: calques, positioning drift, cross-surface contradiction with copy on other
surfaces. In one session they caught a pt-BR calque in the visible heading of a shipped component, an
`earns` that undid a four-draft decision recorded in a sibling file, and a cost figure understated by
ten times. None of those would have been visible to a reader validating the product.

The `reader-facing` label on the `product` queue therefore becomes an **ordering and lens** signal —
which reviewers to dispatch — and stops being a gate.

## Amendment, 2026-07-30 — the deploy fires on the BUMP commit, not on the merge commit

**The merge is still the deploy and still the go/no-go.** Nothing above changes. What changes is the
*mechanism* — which commit on `main` the deploy workflow triggers from — because the original mechanism
shipped a tree that could not describe itself.

### The defect

`version-main` runs on push to `main` and bumps **then** tags, so tag `vN` points at the `bump:` commit,
which sits **on top of** the merge it describes. `deploy` triggered on push to `main` filtered to
`apps/fed/**`, `packages/shared/**` and `.github/workflows/deploy.yml` — root `VERSION` was **not** among
them — and additionally skipped the bump commit. So every deploy built a tree whose `VERSION` had not yet
been incremented.

**This has not shipped, and the framing matters.** Nothing on the site reads `VERSION` today, so the
stale value has never been visible to a reader. #298 — open, and blocked behind this change — would make
it visible: the served page would name the release *preceding* the code it was serving, and the link
would **resolve**, so nothing would signal it. A wrong answer that renders is the failure mode this ADR's
"no pre-production tier" cost is most exposed to, which is why the fix goes first and the feature second.

An earlier draft asserted an incident that did not occur, and the rule that survives it is worth more
than the anecdote: **a record that looks authoritative while being wrong is the defect this change exists
to prevent** — an auditor would go looking for an incident and find none.

### The change

`deploy` now triggers on `paths: VERSION` — i.e. on the **bump commit**, the only commit on `main` whose
tree carries the version it is tagged with.

The surface filter did not disappear; it **moved** out of the trigger and into a credential-free `gate`
job that resolves `prev="$(git describe --tags --abbrev=0 HEAD^)"` and runs
`git diff --name-only "$prev..HEAD" -- apps/fed packages/shared .github/workflows/deploy.yml`. In the
common case that is `vN-1..vN`; the paragraph below is why the general form is the one to hold in mind.
Verified against real history in **both** directions before writing, because a filter is only proven by
its negative case: `v0.1.143..v0.1.144` (a fed release) returns the fed files; `v0.1.139..v0.1.140` (the
dependabot merge touching only `.github/workflows/claude.yml`) returns **empty**, so it correctly would
not deploy.

**What the design rests on is weaker than "tags are dense", and stating the weaker property is the
point.** Tags *are* dense today — one bump + tag per merge — but correctness does not depend on it. The
range is `<last reachable tag>..HEAD`, so if `version-main` wedges and merges accumulate (as they did for
four merges on 2026-07-23), the next bump's range covers **all** of them. The filter is a union, so it
deploys if *any* accumulated merge touched the surface: a **superset**, never a gap. A range that skipped
content is the failure this could have had, and the `<last tag>..HEAD` construction cannot produce one.
The tighter claim was in an earlier draft; it is true, it is not load-bearing, and recording it as
load-bearing would have made a future reader defend tag density for no reason.

**A security improvement, not a footnote — permissions tightened rather than loosened.** `id-token: write`
moved from the workflow level to the single job that assumes a role; the workflow default is now
`contents: read`; the **deciding** job holds no credential at all. A release that touched nothing we serve
now never issues a token.

### The accepted cost — stated as the owner was shown it before approving

**`version-main` becomes load-bearing for deployment.** Before, a wedged `version-main` (it wedged once,
2026-07-23, for four merges) left deploys working and merely stopped tagging. Now it stops the site from
shipping. This is **inherent to "bump before deploy" and cannot be designed away** — only mitigated:

- `workflow_dispatch` remains an unconditional manual deploy, and is the rollback path.
- `version-main` fails loudly with a diagnosis rather than silently.
- The change **self-verifies on its own merge**: its bump's range contains `.github/workflows/deploy.yml`,
  so the filter must match or the deploy visibly does not happen.

**And there are now TWO ways it stops the site, not one — the second was almost left unrecorded.** The
absent bump above is the obvious one. The other is a *malformed* one: the gate's "assert this tree
carries its own tag" step exits non-zero when `v$(cat VERSION)` does not point at HEAD, which turns a
half-completed release into a red deploy rather than a build whose footer links a Release that does not
describe it. That guard is correct and deliberate, and `--atomic --follow-tags` in `version-main` is what
makes the case rare; the assert is what makes it loud instead of wrong. The owner accepted "version-main
becomes load-bearing"; this is the whole of what that sentence buys.

*(An earlier revision of this paragraph attached the 2026-07-23 wedge to this second path. It does not
belong to it: that push was non-atomic, so **the branch was rejected while the tag went through**
([ADR-0022](./0022-numeric-semver-auto-release.md)) — the bump commit never reached `main`, `VERSION`
never changed, and `deploy` would never have fired at all. That incident is the absent-bump path above.
Removed rather than left, because a record that attaches a real mechanism to the wrong incident is the
same defect this amendment opens by naming.)*

### Named residual gap — recorded rather than fixed

GitHub keeps only **one** pending run per concurrency group. Three bump-deploys queuing inside one deploy's
runtime drops the middle one. Site *content* stays correct (the surviving run publishes the whole tree),
but the dropped run's **filter decision** is lost — so if the fed merge was the middle one and the last was
docs-only, the fed code sits undeployed until the next fed merge.

WIP=1 makes a 3-merge burst rare and `workflow_dispatch` recovers it in one click, so the airtight variant
— computing the range from the last run that actually **published**, costing `actions: read` — was
**rejected as not worth paying for now**. Recorded so the next person meets a known limit, not a surprise.

### Alternatives rejected, and why each lost

1. **`deploy` computes the next version itself** — it **predicts**, and the prediction breaks under
   interleaving: two merges seconds apart both compute the same next version while `version-main` hands out
   different ones. Same defect class, rarer and harder to spot — **strictly worse** than a bug that fails
   consistently.
2. **`workflow_run` on `version-main`** — two decisive reasons: no `paths` support at all, and it runs the
   workflow file from the **default branch** rather than the triggering ref, which makes a change to the
   workflow itself untestable in the usual way. (A third objection — that it fires on `completed`
   regardless of conclusion — is listed in the MR and is **mitigable** with a one-line
   `if: …workflow_run.conclusion == 'success'`. It is named here as not-load-bearing rather than dropped,
   because a padded rejection list is where a reader goes looking for straw.)
3. **Bump on the PR instead of after the merge** — theoretically the cleanest (the tag would point at the
   merge, and the loop guard could disappear), but two open PRs both compute the same next version and the
   second merge collides with the first's tag — reproducing the exact wedge class `version-main` now
   carries 15 lines of diagnosis for. It would also make the version machinery depend on **WIP=1 as a
   correctness invariant** rather than a working agreement.
4. **Fold the bump into `deploy`** — rejected on **supply-chain** grounds: `deploy` runs
   `npm run build:static` with the OIDC deploy role in the job env; adding `contents: write` plus the bump
   PAT there means one compromised build-time dependency holds both S3/CloudFront write **and** a repo-write
   token with `workflows: write`. (ADR-0021's third lever exists for this class of reasoning.)
5. **Show the commit SHA instead of a version** — genuinely the **cheapest correct answer**: always exact,
   zero workflow change, zero coupling. It lost to the owner's ruling that the footer should carry the
   *version*, and that ruling has a reason rather than only a preference: a version resolves to a Release
   page with categorised notes ([ADR-0022](./0022-numeric-semver-auto-release.md)), while a SHA resolves to a
   diff — so the version is the form a reader can act on, which is the whole argument for putting an
   identifier in the chrome at all. The coupling in "the accepted cost" above is the price of that, and is
   recorded as bought rather than overlooked.

Root `CLAUDE.md`'s CI section is updated in the same MR to match.

## Amendment, 2026-07-31 — "an amendment that chooses something" is retired from the boundary column

**Owner decision.** The 2026-07-30 amendment governs, and its list is **exact**: what reaches the owner is
`iac/` + continuity, a change to the dev-loop's own rules, and publishing an article. **Nothing else.**

So the boundary-column entry *"An amendment that **chooses** something"* in the 2026-07-29 table above is
**struck**. An ADR amendment that decides something is **safe class** — the reviewer merges it — *unless*
the ADR being amended is one that decides **how work is decided**, in which case it was already boundary by
clause 2 and needs no separate rule.

**Why this needed deciding at all, which is the part worth keeping.** The 2026-07-30 amendment edited that
very table row — it struck `reader-facing copy` from it — and left the `chooses` clause standing. Read
alone, each is defensible: the amendment says *exactly three*, the table says *and also this*. So the
record answered "is this boundary?" two ways at once.

It stopped being theoretical on **2026-07-31**. PR #301 passed all nine DoD criteria with every gate green,
and the `critical-reviewer` **did not merge it** — it escalated, on the grounds that resolving the
ambiguity in its own favour would widen its own merge authority, which is precisely the thing this ADR
says it must never do. That was the correct call and it is why the reviewer is trusted. But the cost is
real: **an unresolved conflict in this record turns every ADR-touching slice into an owner interrupt**,
and the boundary exists to spend the owner's attention on judgement, not on adjudicating our own
bookkeeping.

**The general lesson, and it outlives this clause:** editing one cell of a table that encodes a rule is not
a local edit. The 2026-07-30 amendment struck the item it came to strike and left a sibling in the same
cell that contradicted its own opening sentence. When an amendment says *"the list is now exactly N"*, every
other place that adds to the list is part of that amendment's diff, whether or not it was the point of it.
Retiring an item is cheap; **the expensive half is finding what still says otherwise.**

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
