# 0003. Trunk-based delivery, single environment

- **Status:** accepted · **amended 2026-11-01** (adds the section *The release job writes to `main` as
  a GitHub App, under a ruleset that only that App bypasses*, #783; the owner ratified it on PR #799 on
  2026-11-02, so that section is `accepted`, and nothing above it changes) · **amended 2026-11-02**
  (absorbs the rest of the `delivery-and-gates` capability, formerly records 0018, 0019, 0020, 0021,
  0022, 0023 and 0044, as the sections *CI gates on the pull request*, *Complete functional regression*,
  *The SonarCloud quality gate*, *The application security posture*, *Numeric SemVer, released on every
  merge*, *Version parts: major and minor are deliberate* and *Observability scoped to a static site*;
  every decision is unchanged, #456)
- **Capability:** `delivery-and-gates`
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Supersedes / superseded by:** supersedes the GitFlow two-environment model (recorded in the History index)
- **Driven by:** [ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md#lean-by-design--the-keystone-every-record-is-read-through) (lean by design)

**This document is the whole `delivery-and-gates` capability.** The first half is the delivery model
itself, trunk-based with one environment, and the amendments that decided who holds the merge and how
the deploy fires. The seven sections after its *Consequences* are the decisions that make a model with
no staging tier safe to ship on: the gates on the pull request, the regression they run, the quality
gate, the security posture, how a ship is versioned, what the deliberate version parts mean, and what a
static site observes. Each section was a record of its own until #456 folded it here; each says where it
came from.

## Context & problem
Applying ADR-0053 (lean by design) to delivery: how many branches and environments does a one-person static site need?
The earlier platform ran GitFlow — a `develop` integration branch, a `main` release branch, and a
staging + production environment pair with a promotion gate. For a static personal site with one
maintainer and no blast radius beyond a CDN, that ceremony is cost without payoff.

This is the `trunk-single-env` model the dev-loop plugin defines (`/principles/dev-loop`); this ADR
records the product's decision to adopt it.

## Decision drivers
- ADR-0053 (lean by design): the fewest moving parts that work.
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
regression gates the PR** (see *CI gates on the pull request* below). ~~The merge is production, so it is the go/no-go a
human confirms.~~ **Amended 2026-07-23:** the merge is still the go/no-go — what changed is **who holds
it**. The `critical-reviewer` subagent does, per methodology ADR-0004: it verifies the MR Definition of
Done and then **merges the safe class itself** (docs, dependency bumps, tests, in-pattern work against an
already-approved spec) or **escalates the boundary class to the owner** — `iac/`, contract/schema,
~~positioning or public-facing **content by path** (not by directory: the CV and article markdown live
under `apps/fed`)~~ (retired by the 2026-07-30 amendment: reader-facing content is safe class; only
publishing an *article* still escalates), anything creating or changing an ADR decision, anything
irreversible. *Significance beats
in-pattern.* A blanket human confirmation on every merge spent the owner's attention on in-pattern work,
which devalues it at the boundary where it is actually needed. See ~~`CLAUDE.md` §Branching~~ `AGENTS.md`, *Merge classes* (#721 deleted `CLAUDE.md`).

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
2. **A change to the dev-loop's own rules** — this ADR, ~~`CLAUDE.md`'s~~ `AGENTS.md`'s merge sections (#721), an ADR that
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

- ~~`workflow_dispatch` remains an unconditional manual deploy, and is the rollback path.~~
  **Struck 2026-08-09 — see the amendment below.** It is still the manual deploy and the rollback path
  **for the site**. It is neither for **infrastructure**: `terraform-apply` now refuses to run on
  anything but a push to `main`. Struck rather than edited because this sentence is what an on-call
  reader reaches for during an incident, and the mitigation it promises is half gone.
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
(*Numeric SemVer, released on every merge* below) — the bump commit never reached `main`, `VERSION`
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
   token with `workflows: write`. (The third lever of *The application security posture* below exists for this class of reasoning.)
5. **Show the commit SHA instead of a version** — genuinely the **cheapest correct answer**: always exact,
   zero workflow change, zero coupling. It lost to the owner's ruling that the footer should carry the
   *version*, and that ruling has a reason rather than only a preference: a version resolves to a Release
   page with categorised notes (*Numeric SemVer, released on every merge* below), while a SHA resolves to a
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

## Amendment, 2026-07-31 — a predicate over `var.environment` is untestable fiction here

**The consequence of "one environment" that this record never drew.** There is one environment, it is
named `staging` in `env/stg.tfvars`, and it **is production** — it serves the apex. So any Terraform
expression that branches on `var.environment` has exactly one reachable branch, forever, and reads as a
policy while being a constant.

**The worked example, and it was live.** `iac/storage.tf` carried
`s3_force_destroy = var.environment != "production"  # stg can be torn down; prod protected`. Permanently
`true`, including on the bucket serving the site. And it was **not inert — it was inverted**: an absent
`force_destroy` defaults to `false` in the provider, so had the local never been written, both buckets
would have been safe. It moved them from safe to unsafe **while reading as protection**.

What it stood ready to erase is the part that makes this a decision rather than a tidy-up: eight rows
below it in the same block sits `versioning = { enabled = true } # rollback safety for the site`.
`force_destroy` deletes every object **and every noncurrent version**, so one setting bought the rollback
history the other was configured to erase without even the bucket-not-empty error interrupting. Measured
at the time of the fix: **80 current objects, ~9,000 versions** — the site's entire deploy history.

**The rejected alternative, measured rather than argued.** Renaming the environment to `production` would
make the predicate honest. `var.environment` is interpolated into every name in the root and all of them
are ForceNew, so an inspection plan of that rename returns **19 to add, 4 to change, 19 to destroy** —
both origin buckets, the CloudFront Function, the IAM deploy policy, and the SSM parameters
`deploy.yml` resolves on its first step. The trap is what *survives*: the distribution is updated
in place and the Route 53 record is untouched, so **DNS keeps resolving and the site keeps answering** —
from brand-new empty buckets, while every name CI would use to repair it has moved. It would not look
like an outage.

**So the rule is the opposite of "fix the predicate":** while one environment exists, do not write
predicates over `var.environment` at all. State the value you mean, with a comment saying why. A branch
that cannot be exercised is not a safeguard — it is an assertion nobody can test, and this one was false.

## Amendment, 2026-08-09 — the manual infrastructure rollback is removed, and this record was the place that promised it

**A capability that existed before PR #402 does not exist after it.** Stated first, in those words,
because this record is where someone will look during an incident and the mitigation it listed is the
thing that changed.

### What is no longer true

The 2026-07-30 amendment's accepted-cost list carries *"`workflow_dispatch` remains an unconditional
manual deploy, and is the rollback path."* That sentence is struck in place above. After #402:

- `workflow_dispatch` is the manual deploy and the rollback path **for the site**. Unchanged.
- It is **not** either for **infrastructure**. The `apply_infra` input is removed, `gate` hardcodes
  `iac=false` on the dispatch branch, and `terraform-apply` additionally requires
  `github.event_name == 'push'`.
- **Rolling infrastructure back is now: revert the commit, merge.** There is no button.

### Why the capability was removed rather than narrowed

`workflow_dispatch` runs against a ref the **caller** names. `gate` checks out
`needs.release.outputs.sha || github.sha`, and on a `part: none` dispatch the release job is skipped, so
the fallback — the dispatched ref's sha — wins. `terraform-apply` then checked out that sha and applied
`iac/` **from the caller's tree**, under the role this workflow itself describes as *"strictly more
powerful than the deploy role"*. So *"can push a branch"* was equivalent to *"can apply infrastructure
to the live environment"*.

The `apply_infra` default of `false` was not a control. It is a suggestion to whoever fills in the form,
and the caller fills in the form. **The main-only refusal already in this repo did not cover it either**
— it lives inside the `release` job, whose `if:` requires `inputs.part != 'none'`, so a `part: none`
dispatch skips the job and never evaluates the guard. It was correct, and unreachable on exactly the
dispatch that mattered.

**One link in the derivation is a hypothesis and is labelled one.** Whether `workflow_dispatch` reads the
workflow **definition** from the dispatched ref (documented GitHub behaviour) could not be settled here —
`gh api` is denied at the permission floor. What *was* settled empirically from this repo's own run
history is weaker and sufficient: a `workflow_dispatch` from the non-default branch `develop` ran
repeatedly in June, so **`--ref` is honoured for the run**. The finding does not rest on the definition
link — the tree that gets *applied* is chosen by `github.sha` → `gate`'s checkout → `terraform-apply`'s
checkout, which is settled inside this repo and pinned by an existing assertion. The definition-source
link would only enable a strictly larger attack.

### The scope of the fix: it closes the class, not the one instance

Worth stating precisely, because *"we fixed the `apply_infra` hole"* and *"a dispatch cannot apply
infrastructure"* are different claims and only the second is what was bought. Four properties of the repo
at this branch, each checked in the file rather than assumed:

- **`deploy.yml`'s `on:` is `push: branches: [main]` plus `workflow_dispatch`, and nothing else.** That is
  what makes the second refusal a genuine *main-only* control rather than merely a *not-a-dispatch* one:
  with no other push branch and no other trigger, `github.event_name == 'push'` **implies** `main`. The
  guard is written as an event test and reads as a weaker claim than it is — which is exactly why the
  implication is recorded here, since adding a second `push` branch later would silently break it.
- **`gate`'s `iac` output has exactly two writers**: the hardcoded `iac=false` on the dispatch branch, and
  the surface-diff computation on the push branch. There is no third path that could set it true.
- **`terraform apply` is executed in exactly one workflow** — `deploy.yml`, in `terraform-apply`. No other
  workflow in `.github/workflows/` runs one.
- **`iac.yml` has no dispatch path at all**: it triggers on `pull_request` only, and it plans rather than
  applies.

So there is no second route from a `workflow_dispatch` to a `terraform apply` anywhere in this repo, and
`deploy.yml` is the only workflow carrying a `workflow_dispatch` in the first place. **The removed
capability is the class, not an instance of it.** The counting is the load-bearing part: had `iac` had a
third writer, or `terraform apply` a second site, both refusals could hold and the property still fail.

### The cost, priced rather than smoothed

**The loss is real.** An infrastructure change that breaks the live environment can no longer be undone
by one person clicking one button; it is undone by a revert commit going through the PR gates and the
merge. That is slower, and it is slower at the worst moment.

**It is aligned with this record's own stated discipline, which is why it was accepted rather than
mitigated.** This ADR's *Bad / accepted costs* already reads *"a fast forward-fix discipline
(revert-on-`main` + re-deploy) replaces a promotion rollback"*, and `/principles/dev-loop` prescribes
*failure = revert + forward fix* for `trunk-single-env`. The removed capability was the **exception** to
the discipline this record chose, not an instance of it. **Alignment is not the same as costlessness**,
and this section exists so nobody reads the first sentence as cancelling the second.

**No break-glass workflow is added, deliberately.** If one is ever wanted it is a separate
`workflow_dispatch`-only workflow that stays denied to the agent — pointedly not the one an agent may
dispatch. Recorded as *not built* rather than as *not needed*, so the next person meets a decision
instead of a gap.

### What this does not change

The `part` input and its `none` default, the automatic patch bump on every merge, the `app=true`
override on a version-cutting dispatch, and `deploy_app`'s default of `true` are all untouched.
`deploy_app` is safe for the reason `apply_infra` was not: publishing runs under the **deploy** role,
scoped to the bucket and the distribution, and bad content is one revert-and-republish away.

The under-scoped main-only refusal inside `release` is **left alone on purpose**. It is still narrower
than a reader would guess; this change makes its gap harmless, and widening it would mean touching the
release path, which #402 was scoped not to do.

## The release job writes to `main` as a GitHub App, under a ruleset that only that App bypasses (2026-11-01)

**Added 2026-11-01 by [#783](https://github.com/tedeuxx/tadeumendonca-io/issues/783), written by
`tech-lead` in [PR #799](https://github.com/tedeuxx/tadeumendonca-io/pull/799). ~~This section is
`proposed`: it becomes `accepted` only when the owner ratifies that boundary-class MR.~~** **Accepted
2026-11-02:** the owner ratified it on PR #799, *«Ruleset ativo, proteção clássica removida; ratifico o
#799 e a seção…»*
([comment](https://github.com/tedeuxx/tadeumendonca-io/pull/799#issuecomment-6567021121)), and the PR
merged as `92c6945`. Corrected as a record correction in #456's seventh slice. The decision
itself is his, *«Ruleset + App»*, recorded on #783 on 2026-10-31; the narrowing of the token, the job's
own permissions and the wording here are `tech-lead`'s. It is a section here rather than a record of
its own because it is behaviour of this capability, delivery and its gates, and
[0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md)'s
capability limb puts such a decision in the capability's document. The re-decision limb was applied
per rejected option: `apps/fed/scripts/deploy-workflow.test.mjs` refuses the old secret's **name** and
asserts the job token is `contents: read`, which refuses a `GITHUB_TOKEN` write. Nothing refuses a
renewed personal access token stored under another name, and nothing in the repository can refuse
anything about the ruleset, which lives in repository settings. So the record is owed.

**One decision:** the `release` job authenticates as a GitHub App, and `main` is governed by a
repository ruleset with that App as its only bypass actor. It serves *Numeric SemVer, released on
every merge* (the automatic release) and *Version parts: major and minor are deliberate* (the same job,
dispatched by hand), both below.

### Context

The `release` job in `deploy.yml` bumps `VERSION`, pushes the `bump:` commit and its tag straight to
`main`, and creates the GitHub Release the site's footer links to. Under this record's 2026-07-30
amendment the deploy fires on the `bump:` commit, so a `release` that cannot push stops the site from
shipping, not only from tagging.

It pushed with a fine-grained personal access token, `VERSION_BUMP_TOKEN`. That token expired, and the
job failed at checkout (`could not read Username`) from 2026-10-24 to 2026-10-30: deploy runs
40107669946, 40111086740, 40130367868 and 40131223563, as listed on the Issue. The token was renewed
for 90 days. **GitHub has no way for a personal access token to rotate itself**, so the same outage is
scheduled for around 2027-01-28 and every 90 days after.

**Why the token could push at all is the fact that shaped the decision.** The owner read the protection
on 2026-10-31 (`gh api repos/tedeuxx/tadeumendonca-io/branches/main/protection`, recorded on the Issue):
classic branch protection; a pull request required (zero approvals); required checks `build-test`,
`actionlint`, `terraform-plan`, not strict; **`enforce_admins: false`**. The token pushed because it
acted as an administrator, and administrators skipped the rules. So the question was never only *which
credential*; it was *which actor may push to `main` without a pull request, and how is that stated*.

### Decision drivers

- **No credential in the release path may expire on a calendar.** That is the outage being fixed.
- **The actor that may push to `main` without a pull request must be named and narrow.** Today it is
  "any administrator", which is broader than the one job that needs it.
- **Least privilege for the job's own token** (the supply-chain lever of *The application security
  posture* below; [ADR-0013](./0013-s3-cloudfront-hosting.md#pipeline-credentials-by-oidc)'s posture for
  pipeline identity).
- **The three required checks and the pull-request requirement stay exactly as they are.** The
  migration must not open a window where `main` is ungated.

### Considered options

1. **Renew the personal access token (the status quo).** Nothing to build, and the loop guard, the
   protection and every workflow stay as they are. *Trade-off:* the job breaks again every 90 days,
   or whenever the token's lifetime is set, and is fixed only by the owner noticing a red deploy and
   renewing by hand. A non-expiring token is not an escape: it is a long-lived credential that keeps
   the administrator bypass, which is the option-3 cost without the narrowing. **Rejected:** it is the
   outage on a timer.
2. **`GITHUB_TOKEN`.** No stored secret at all; the token is minted per run and dies with the job; and
   because GitHub does not start workflows from a `GITHUB_TOKEN` push, the `bump:` loop guard would
   have nothing to do. *Trade-off, and it is fatal:* under the measured protection a pull request is
   required, and `GITHUB_TOKEN` is not an administrator and cannot be put on a bypass list, so its push
   of the `bump:` commit is refused. **Ruled out by the owner's measurement**, not by preference.
3. **A GitHub App for the release job, and a repository ruleset on `main` with that App as its only
   bypass actor (chosen).** The ruleset keeps the pull-request requirement (zero approvals), the three
   required checks with *require branches to be up to date* off, and blocks force-push and deletion.
   The App has Contents read and write and Metadata read only, is installed on this repository only,
   and has its webhook off. The job mints a token from the App's ID and key with
   `actions/create-github-app-token`, narrowed to `permission-contents: write`; the token lives one
   hour at most and the action revokes it at the end of the job. *Trade-off:* a private key that never
   expires, a new third-party action, and administrators losing their skip (see *Consequences* below).
   Classic protection cannot express this: an App cannot be an administrator, and classic protection
   has no per-actor bypass for a push, which is why the protection object changes along with the
   credential.

### Decision outcome

**Option 3.** `release` writes to `main` as the GitHub App and as nothing else: the checkout that
pushes the commit and tag, `gh release list` and `gh release create` all use the minted token, and the
job's own `GITHUB_TOKEN` is `contents: read`. `main` is governed by a repository ruleset whose bypass
list holds **the App and no other actor from section C of #783 on**, and classic branch protection is
removed.

**Until section C, the bypass list also holds the Repository admin role.** The owner decided this on
2026-11-01, *«Admin temporário»*
([#783](https://github.com/tedeuxx/tadeumendonca-io/issues/783#issuecomment-6565399247)). His reason:
if the App key fails on the first release, a revert does not help, because an App-only ruleset also
bars the old token. The admin entry is removed in section C of #783, after the first green `release`
job authenticated as the App, alongside deleting `VERSION_BUMP_TOKEN` and revoking it. **What holds
until then:** an administrator still skips the rules. The old token is an administrator credential, so a
merge in that window does not break `release`; its push still succeeds as it does today. And the
brief's floor rule against pushing to the trunk is still held only by instruction, because the forge
does not refuse a push from the owner's credential while the admin role is on the list.

**The order is part of the decision, and this is the order adopted** (recorded on #783 from the
`agents-lead` lens on PR #799):
1. The ruleset is created with enforcement **Disabled**, so it changes nothing yet.
2. The gate approves the Definition of Done at a fixed head.
3. As the last act before the merge, someone confirms that no `deploy` run is in progress. Then the
   ruleset is switched to **Active** and the classic protection is removed.
4. The merge.
5. Section C: the first green App `release`; then the admin entry, the secret and the token go.

Removing the classic protection only after the ruleset is Active means `main` is never ungated in
between.

**The `bump:` loop guard stays.** A push made with an App token does start workflows, as the personal
access token's did, so the `bump:` commit re-enters `deploy` and the job's `if:` is still what stops
it.

**What the passages that say "branch protection" mean now, and why none is superseded or amended.**
Four places describe branch protection as the mechanism of their time:
- this record's 2026-07-30 amendment, *Alternatives rejected, and why each lost*: folding the bump into
  `deploy` is rejected because a compromised dependency would hold *"the bump PAT"* with
  `workflows: write`. That argument still holds, because the App token is a repository write credential
  too;
- [ADR-0013](./0013-s3-cloudfront-hosting.md#pipeline-only-apply) and *The application security
  posture* below: *"a skipped required check satisfies branch protection"*, and why that forces
  `if: always()` on a required aggregator;
- *CI gates on the pull request* below: a workflow with a top-level `paths:` filter *"cannot be a
  required status check"*.

What those passages decide is about **required status checks**, and a ruleset carries required status
checks with the same semantics as classic protection. GitHub's documentation treats a skipped required
check as passing and a never-reported one as pending in both. **That is read from GitHub's
documentation, not measured on this repository's ruleset.** On that reading every decision in them
still binds; only the noun naming where the requirement lives has changed. Their wording is left as a
record of its time, and a reader maps "branch protection" to *the ruleset on `main`*. One of them also
carries a discharged gap: the security-posture record's *"Not verified by me: the contents of branch
protection on `main`"* is answered by the owner's 2026-10-31 read above. ~~and that record is not
edited for it.~~ Since #456 folded that record into *The application security posture* below, the
sentence did not travel; the section states the required context as read.

### Consequences

**Good**
- **The release path no longer expires on a calendar.** The credential that runs it is a token minted
  per run, valid one hour at most.
- **From section C of #783 on, the push bypass is narrowed from "every administrator" to one App**,
  whose only repository permission is Contents. Before, the bypass followed a person's role; then it
  follows one named actor. Until section C, both are on the list (*Decision outcome*).
- **From section C on, a direct push to `main` from the owner's credential is refused by the forge.**
  The brief's floor rule against pushing to the trunk was held by instruction alone, because agents act
  through an administrator credential and administrators skipped the rules. Once the admin role leaves
  the bypass list, that credential is no longer exempt, so the rule gains a layer that holds it. **Until
  then it is still held only by instruction.** This follows from the configuration in *Decision
  outcome*. It is verified only by reading the ruleset live, and the Issue's acceptance criterion
  *"the ruleset's bypass list holds the App and no other actor"* is read **after section C**. Read
  straight after the merge, it would fail on a correct configuration.
- **Less is exposed in the `release` job.** Before, the token persisted by `actions/checkout` in that
  job was a 90-day credential that skipped every rule. Now it is a one-hour, Contents-only token. The
  job still runs `pip install bump-my-version` unpinned after that checkout. That residual is named
  here and not fixed; it was there before this change.

**Bad / accepted costs**
- **The App's private key is a standing credential with no expiry.** Whoever holds it can mint a token
  that pushes to `main` with no pull request and no checks, and the next merge deploys that tree. Its
  blast radius equals the old token's, without the expiry that at least bounded a leak. The key lives
  only as the `RELEASE_APP_PRIVATE_KEY` repository secret, and only the `release` job reads it.
  Rotation is by hand: generate a new key in the App's settings, store it, delete the old key. Nothing
  reminds anyone to do it, and nothing detects a leaked key.
- **A new third-party action enters the pipeline.** It is `actions/create-github-app-token`, pinned to
  `64ab729a6294000f5aa4a4bc0b73d1f32bc45510` (v3.3.0; `git ls-remote` on the action's repository
  resolves the tag to that commit). It handles the private key directly, so a compromise of the action
  at a future pin is a compromise of the bypass. The pin is the control, and moving it is a reviewed
  change like any other dependency bump.
- **The action's `app-id` input is deprecated.** v3.3.0's `action.yml` marks it with
  *"Use 'client-id' instead."* The stored secret is the numeric App ID, so the workflow uses `app-id`.
  Moving to `client-id` needs a new secret holding the App's client ID, which is the owner's act. Until
  then every run logs a deprecation warning, and a future major version may drop the input.
- **From section C of #783 on, administrators no longer skip the rules.** Any merge or push made with
  the owner's credential, the gate's `gh pr merge` included, then needs the three checks green. Until
  section C an administrator still skips them. This is stricter than before and
  intended: the loop already requires green checks before a merge. The cost lands in an emergency,
  where a fix that cannot pass its checks can no longer be forced through by an administrator. The way
  out then is a ruleset change, which is the owner's act and is visible in the repository's settings.
- **The protection of `main` is not in the repository.** It was not before either. Nothing in this
  tree can check that the ruleset exists, holds these rules or lists only the App. That is a live read
  (`gh api repos/tedeuxx/tadeumendonca-io/rules/branches/main`), outside every gate. A required job
  renamed in a workflow still un-gates `main` silently, exactly as under classic protection.
- **The `bump:` loop guard stays load-bearing.** Option 2 would have made it vestigial. Option 3 keeps
  an App-token push starting workflows, so the guard and the message format it matches must stay
  aligned.

### Links

- Issue [#783](https://github.com/tedeuxx/tadeumendonca-io/issues/783): the outage, the owner's
  protection read, his decisions and the ordered settings acts.
- `.github/workflows/README.md`, *Rules the design has to obey*: the operative description of the
  ruleset.
- The twin for the method's own repository: tedeuxx/mhw#251.

## Consequences
**Good**
- Minimal branching/ops overhead; the pipeline mirrors the site's actual size.
- No staging environment to provision, fund, or drift.
- The go/no-go is unambiguous — it is the merge.

**Bad / accepted costs**
- No pre-production tier: a defect the PR gate misses reaches the live site directly, so the gate must
  be comprehensive and blocking (*CI gates on the pull request* below puts E2E on the PR for exactly
  this reason).
- A fast forward-fix discipline (revert-on-`main` + re-deploy) replaces a promotion rollback.

## CI gates on the pull request

**Absorbed 2026-11-02 (#456) from the record that held it, 0018, decided 2026-07-22.** The decision is
unchanged and still binds, and so are its three amendments (2026-07-23, 2026-07-28 and 2026-07-29),
which are written below as the decision as it binds. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0018-*'`.

### Context

With no staging tier (the delivery model above), the merge is production. The pull request is therefore
the only place verification happens: anything not checked there is not checked at all, and a route break
has to fail before it deploys.

### The decision, as it binds

- **The full gate runs on every pull request, E2E included.** Lint, typecheck, unit tests with coverage
  **≥85%**, build, **E2E against a preview of the build**, and the SonarCloud gate (*The SonarCloud
  quality gate* below) for the application; a policy scan and a `plan` for `iac/`; `actionlint` and
  `shellcheck` over `.github/workflows/**`. All blocking. Post-deploy E2E stays only as a smoke against
  the real CDN (*Observability scoped to a static site* below).
- **CI proves nothing broke; the reviewer judges whether the change is right.** A green pipeline is not
  the review. Who holds the merge is decided in this record's 2026-07-23 amendment above.
- **A required check must always report.** A workflow with a top-level `paths:` filter on
  `pull_request` **cannot be a required status check**: on a pull request that does not match, it never
  reports and stays pending, so branch protection can never require it. So every gate runs on every
  pull request and applies its path filter **inside** the job.
- **Each gate job ends with a `::notice::` naming which of three cases occurred:** nothing matched the
  filter, so nothing was verified; a step failed, so the checks after it never ran; or the gate ran, with
  the list of what it ran. A skipped run must not read as a verified one, and the notice on the failure
  branch must not print the full list.
- **`actionlint` silently disables `shellcheck` when the binary is absent** and still exits 0, and
  `-shellcheck <path>` does not change that. The job asserts the executable itself before trusting the
  result.
- **A gate follows what a file is, not the directory it sits in.** Terraform is gated by the
  infrastructure job. A **behaviour-bearing file under `iac/`**, today
  `iac/cloudfront-functions/spa-rewrite.js`, is additionally unit-gated by the application job, whose
  filter includes `iac/cloudfront-functions/**`. The two gates assert different properties of the same
  file, and neither one's green covers the other's.
- **The 85% is a global average** across everything in `vitest.config.ts`'s `include`, never a per-file
  or per-directory floor. The owner's decision (2026-07-29) was to raise the tooling's coverage rather
  than state a lower bar for it.

### Rejected options that are still live

- **Defer E2E to post-deploy**, the two-environment habit. On a single environment the change is already
  live when E2E runs, so a break reaches production first.
- **A minimal gate, lint and unit tests only.** Not enough with no staging net; route and integration
  breaks would ship.
- **A path-filtered workflow as a gate.** It can never be required, so it is permanently advisory: a gate
  in name only.
- **Per-directory coverage thresholds.** A lower stated bar for tooling is a second number to maintain.
  **Accepting the gap with a note** was rejected with it, because it leaves the misreading in place.

### Consequences still being paid

- **Every pull request is slower**: a full E2E and Sonar run each time.
- **The gate must stay comprehensive**, because a check dropped here has no downstream backstop
  (*Complete functional regression* below).
- **Two workflows fire on `iac/cloudfront-functions/**`**, and a reader has to know both gates exist to
  know what covered a change.
- **The unit test of the CloudFront Function proves behaviour under Node, not acceptance by the
  CloudFront Functions JS 2.0 runtime.** A rewrite using `?.`, `??` or `const` passes green and is
  rejected when the function is created, in the apply after the merge. The gate narrows that window; it
  does not close it.
- **A green coverage check means the average clears the bar, never that every file does.** A small,
  hard-to-cover directory dilutes while the global barely moves, and nothing enforces a subtotal. The
  only defence is reading the per-file table when tooling is added.

## Complete functional regression

**Absorbed 2026-11-02 (#456) from the record that held it, 0019, decided 2026-07-22.** The decision is
unchanged and still binds. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0019-*'`.

### Context

With no staging tier and the whole gate on the pull request (*CI gates on the pull request* above), the
regression suite is what proves that nothing already working broke. If it only samples, a regression in
an un-sampled path ships silently.

### The decision, as it binds

**The regression suite functionally covers 100% of implemented features, and every feature ships with
its own regression.** Which suites make up the regression is read from the repository: **E2E** wherever
there is a UI, an API or contract suite **only where an API exists** (none today). This is the one gate
that does not bend to blast radius. When a backend returns, its API suite joins the same invariant.

"100%" is **functional** coverage, journeys over features. It is a different guarantee from the ≥85%
unit line coverage above and must not be confused with it.

### Rejected options that are still live

- **Representative sampling.** The un-sampled tail regresses silently, which a repository with no
  staging tier cannot afford.
- **Demand an API regression regardless.** There is no API; requiring coverage of a surface that does
  not exist is an unsatisfiable gate, and an unsatisfiable gate trains fabricated evidence.

### Consequences still being paid

- **Every feature must add its regression**: a real, ongoing discipline, held by the merge request's
  Definition of Done.

## The SonarCloud quality gate

**Absorbed 2026-11-02 (#456) from the record that held it, 0020, decided 2026-07-22.** The decision is
unchanged and still binds, and so are its two amendments (2026-07-28, #201, and 2026-08-27, #542). The
full record is in git history: `git log --diff-filter=D -- 'docs/adr/0020-*'`.

### Context

Beyond tests, the code needs an objective, enforced bar for bugs, code smells, security hotspots (SAST)
and coverage, one a human cannot wave through. On a public proof-of-engineering repo, "quality" must be
provable by the harness, not asserted. (Wording of 2026-07-22, kept as history: read
*proof-of-engineering* as the mission of that time, per ADR-0053.)

### The decision, as it binds

- **SonarCloud is a blocking gate on new code.** The scan runs inside the application job with
  `sonar.qualitygate.wait=true`, so a failed gate fails the check and blocks the merge. It is the
  authoritative quality and SAST check on the pull request.
- **Scope: `apps/fed/src` and `apps/fed/scripts`.** The tooling joined on 2026-07-28 (#201), because
  the most consequential build code (`routes.mjs`, `prerender.mjs`, `gen-sitemap.mjs`) was otherwise
  analysed by nothing. `iac/` and `.github/workflows` are **not** scanned, and that gap is stated, never
  claimed as covered.
- **Three files are outside copy-paste detection (CPD):** `src/data/catalog.ts`, `src/data/repoCards.ts`
  and, since 2026-08-27 (#542), `src/data/profile.ts`. The list stays file-enumerated, never a glob.
  **A fourth candidate has to clear the rule written beside the config:** the file is authored content
  under a type the compiler still enforces, **and** CPD is structurally unable to find the defect worth
  catching there. CPD normalises string literals, so on a module of authored prose it cannot see two
  entries carrying the same words and fires reliably on two entries carrying the same schema. A file
  whose entries are data but whose duplication would be real does not qualify.

### Rejected options that are still live

- **No quality gate**, and **local-only linting**, which is bypassable and is not SAST.
- **Loosening the duplication condition on the gate** instead of excluding a named file. It buys the
  same green by lowering the bar for every file.
- **Rewording authored entries until CPD stops matching.** The measurement on #542 showed the result
  depends on where the formatter wraps sentences (the same file measured 0.0 on `main`), so the fix has
  a negative half-life and is paid for in published copy.
- **Moving the entries to JSON outside `sonar.sources`.** It removes the file from all analysis, not
  from CPD alone, and loses the compile-time schema check.

### Consequences still being paid

- **`iac/` and `.github/workflows` are not scanned** by this gate.
- **An external service sits in the gate**: SonarCloud's availability.
- **Real copy-paste in the three excluded files is not caught.** The exclusion is permanent and silent,
  and the list reads as a habit if it is only ever added to, which is why the entry rule above exists.
- **`main`'s overall coverage figure dropped when untested scripts entered the index.** Every gate
  condition is `new_*`, so nothing breaks; the lower number is the accurate one.

## The application security posture

**Absorbed 2026-11-02 (#456) from the record that held it, 0021, decided 2026-07-22.** The decision is
unchanged and still binds, and so are its two amendments (2026-07-27 and 2026-08-07). The full record is
in git history: `git log --diff-filter=D -- 'docs/adr/0021-*'`.

### Context

The infrastructure posture is minimal because the surface is minimal
([ADR-0013](./0013-s3-cloudfront-hosting.md#the-minimal-infrastructure-security-posture)). At the
application level the same question applies. A static SPA with no server, no auth and no user data
([ADR-0002](./0002-fully-static-spa-no-backend.md)) removes whole classes of concern: injection into a
database, auth bypass, server code execution, secrets at runtime. What remains is the client bundle and
its **dependencies**, and the runner that builds them.

### The decision, as it binds

Three levers, on top of the infrastructure floor (OIDC least privilege, no secrets in the repository):

1. **SAST**, by the SonarCloud gate above.
2. **Package-vulnerability scanning** (Issue #52):
   - **Enforcement:** `npm run audit` runs `audit-ci` with `apps/fed/audit-ci.jsonc` in its own job,
     `npm-audit`, and **blocks on HIGH and CRITICAL advisories in production dependencies only**
     (`skip-dev`). A build-tool advisory never reaches a reader, so it is reported, not blocking.
   - **Hygiene:** Dependabot (`.github/dependabot.yml`), with GitHub's vulnerability alerts.
   - **Triage:** an unreachable or false-positive advisory goes into the checked-in allowlist **with a
     written justification and a review or expiry date**. Never a silent skip or `|| true`.
   - **The block is derived, not direct.** As a separate job, the audit blocks only because the
     required aggregator, `build-test`, lists it in `needs` **and** runs with `if: always()` and a
     failure check over `needs.*.result`. A bare `needs:` aggregator is *skipped* when a dependency
     fails, and a skipped required check satisfies branch protection, so a red audit would merge. An
     edit to the aggregator is an edit to this control.
3. **Supply-chain execution control:** **every dependency install in the pipeline runs
   `npm ci --ignore-scripts`.** This is a different threat from the audit: a brand-new malicious release
   has no advisory, and a development dependency never reaches a reader yet still runs code on the
   runner. In `deploy.yml` the threat is persist-then-execute: a `postinstall` writes into
   `node_modules`, and the later build runs that tree with the deploy role in the job's environment. In
   the application workflow it is the dependency tree of a branch anyone can open, installed before any
   gate has read the diff. The invariant is a property with a derivation, never a count:
   `grep -rn "run: npm ci" .github/workflows/ | grep -cv -- "--ignore-scripts"` must be **0**.

### Rejected options that are still live

- **Heavier AppSec: DAST, a penetration test, runtime WAF rules.** There is no dynamic or authenticated
  surface to test or protect; they would be controls without a target.
- **SAST only.** It leaves the most realistic static-site risk uncovered: a known-vulnerable dependency
  shipped in the bundle.
- **`apps/fed/.npmrc` with `ignore-scripts=true`.** It would make the invariant true by construction and
  cover Dependabot and local installs too. Not adopted, because it also silences install scripts in
  local development, where a dependency that needs one fails far from its cause. **Its revisit condition
  fired on 2026-08-07** (nine install sites, not two), and the choice is left open: adopting it would be
  a new decision with its own trade-off, and it is the owner's.

### Consequences still being paid

- **The audit queries a live advisory database**, so a green required check can start blocking an
  unrelated pull request the day a new advisory lands against an existing production dependency. The
  allowlist with expiry is the relief valve; a real advisory is fixed by a dependency bump, never by
  widening the gate.
- **A future dependency that genuinely needs an install script** must get an explicit, reviewed step.
- **`--ignore-scripts` is asserted, not enforced.** Nothing fails if a new install site omits the flag;
  the derivation above is a command someone has to choose to run.
- **Calibrated to a static surface.** A dynamic or authenticated surface reopens the concerns the
  static decision closed.
- **The required context is `build-test`**, as the owner's read of the protection on 2026-10-31 shows
  (*The release job writes to `main` as a GitHub App* above); the protection now lives in a ruleset,
  which nothing in this tree can read.

## Numeric SemVer, released on every merge

**Absorbed 2026-11-02 (#456) from the record that held it, 0022, decided 2026-07-22.** The decision is
unchanged and still binds. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0022-*'`.

### Context

Trunk-based delivery ships on every merge. Each ship needs to be versioned and traceable, so that "what
was live at vX.Y.Z" has an answer, without release ceremony a solo, merge-is-deploy model does not want.

### The decision, as it binds

**Purely numeric SemVer, released automatically on every merge to `main`.** The `release` job in
`deploy.yml` bumps the patch, tags `vX.Y.Z`, and publishes a GitHub Release with categorised notes. The
`bump:` commit is loop-guarded. Since this record's second 2026-07-30 amendment the deploy fires on that
`bump:` commit, so the release path is load-bearing for deployment, not only for tagging. Since the
2026-11-01 section above it pushes as a GitHub App. The deliberate parts are the next section.

### Rejected options that are still live

- **SemVer with `-dev` pre-releases.** Rejected by the owner: on a single environment every merge is the
  real thing, and a pre-release suffix is noise.
- **Manual tagging.** Ceremony the merge-is-deploy model does not want, and easy to forget.

### Consequences still being paid

- **The release automation is load-bearing and needs its own care.** Two incidents show the shape: an
  empty notes category aborting under `bash -e` once tagged versions without a Release; and on
  2026-07-23 a non-atomic `git push` let the tag through while the branch was rejected, orphaning
  `v0.1.39` and wedging the next four merges. The push is `--atomic` with a fetch, reset and retry loop.
  The workflow gate in *CI gates on the pull request* above (`actionlint` and `shellcheck`, #79) is
  what now checks a change to this path before it runs.
- **One Release per merge.** Accepted, because merges are deploys.

## Version parts: major and minor are deliberate

**Absorbed 2026-11-02 (#456) from the record that held it, 0044, decided 2026-08-08.** The decision is
unchanged and still binds. The full record, including the strikes made in its own merge request before
it was ever in force, is in git history: `git log --diff-filter=D -- 'docs/adr/0044-*'`.

### Context

Until 2026-08-08 every tag was `0.1.N`, because `deploy.yml` bumped the literal `patch` with no input
anywhere, and the automatic release above said nothing about what a MAJOR or a MINOR would mean. The
change that made a non-patch reachable, a `part` input on `deploy`'s `workflow_dispatch`, shipped with
this meaning on purpose: **a tag is permanent and a published tag is unfixable**, so the mechanism and
its meaning had to land together.

One measurement shapes the model. Intake and delivery run at the same rate here by design (on
2026-08-08: 22 `product` issues created and 21 closed in seven days), so **any MAJOR defined as "when
enough is done" can never fire**. Only a cohort fixed when it opens can ever be complete. That a growing
cohort never completes is this record's own argument, not a rule anyone stated.

### The decision, as it binds

- **PATCH stays automatic on every merge**, as the previous section decides. Nothing here narrows it.
- **MINOR is a publication.** One published thing, one minor, cut deliberately at or after the merge
  that publishes it.
- **MAJOR, from `1.0.0` onward, is a milestone with a configured release plan behind it**, declared
  before the work. The owner: *«depois disso, todo trabalho de features de produto devem estar
  associados a um plano de release configurado.»* A publication may sit inside a milestone like any
  other item; publishing never by itself closes one, and publishing more never accumulates toward a
  major. The scoping *from `1.0.0` onward* is load-bearing: unscoped, the first major would fail the
  definition of the thing it is.
- **`1.0.0` was the publication of the architecture section** (the owner, verbatim: *«esse post do
  arquitetura será o marco da versão tag major 1.0.0»*). It owed no cohort: the release-plan discipline
  starts after it, which is a start line, not an exception. **`1.0.0` claims that the system is
  describable as a whole and the description is public**, nothing more. It was cut on 2026-08-08
  (`git log -1 --format='%h %ad %s' --date=short v1.0.0`); **`2.0.0` is the first cut the release-plan
  rule reaches at all.**
- **The mechanism is the `part` input on the existing `deploy` workflow's `workflow_dispatch`**,
  defaulting to `none`, with the automatic push path unchanged. One workflow, because here releasing and
  deploying are the same act.

### Rejected options that are still live

- **A publication counter with a required `semver:` label on every pull request, and reader-invisible
  work bumping nothing.** It costs a judgement on every pull request to get a correct digit on fewer
  than one in thirty, and the class it most needs to separate, a bugfix from a refactor, is not
  derivable at all: same files, only intent between them. *What it would buy:* `/releases` as a
  publication list rather than a merge log with a few meaningful tags in it.
- **A separate `release.yml` carrying the `part`.** Here the bump commit is the tree that gets deployed.
  A bump from a second workflow lands as a `bump:` commit that `deploy.yml` skips at both its guards, so
  the minor would be tagged and never shipped.
- **Deriving the part from changed paths.** Only a publication (a file added under the content path) is
  derivable; a bugfix and a refactor touch the same paths, and a milestone is not in the tree at all.

### Consequences still being paid

- **"Reader-invisible work bumps nothing" is not in force**, and nothing here claims it. Every push to
  `main` still bumps the patch, so the patch digit counts merges, not corrections. The version string
  is legible on two digits and noise on the third.
- **Nothing enforces the meaning.** The `part` input accepts `major` on any dispatch, and no check asks
  whether a release plan exists; none could, since a plan is not in the tree. The rule is a convention
  held by one person, defended only by the act being rare.
- **A wrong cut is unfixable forward.** Tags are permanent and a Release is public; there is no dry run.
- **A major resets the lower parts**, so the publication carrying a major does not also get a minor.

### What is not decided here

- **What a "configured release plan" is configured in.** Open, and it governs `2.0.0` and every later
  major.
- **Whether anything other than product features attaches to a plan.** The owner scoped the discipline
  to *«features de produto»*; this does not widen it.
- **Whether a distribution announcement carries the tag**, and how it is derived rather than typed
  ([ADR-0038](./0038-content-distribution-linkedin-and-x.md)'s surface).
- **Whether the automatic patch should stop.** No position is taken.

## Observability scoped to a static site

**Absorbed 2026-11-02 (#456) from the record that held it, 0023, decided 2026-07-22.** The decision is
unchanged and still binds, and so are its two amendments (2026-07-29, #237, and 2026-11-01, #640). The
full record is in git history: `git log --diff-filter=D -- 'docs/adr/0023-*'`.

### Context

"Observability is part of done": a change is not finished until it can be seen working where it runs. A
static site ([ADR-0002](./0002-fully-static-spa-no-backend.md)) has no server to emit logs, metrics or
traces, so observability has to be defined for what a static site can produce rather than borrowed from
a backend playbook.

### The decision, as it binds

- **Client and build observability:** Google Analytics for usage (refined by
  [ADR-0033](./0033-ga4-consent-gated-analytics.md), consent-gated GA4, and by
  [ADR-0051](./0051-ga4-event-schema-is-immutable-once-shipped.md), an immutable event schema); a
  client-side error surface for runtime errors; a build and prerender smoke (routes render, OG tags in
  the served HTML, [ADR-0005](./0005-og-coverage-every-public-url.md)'s per-route coverage); and the
  post-deploy E2E smoke against the real CDN.
- **A post-deploy assertion belongs to the workflow that performs the change it observes**, not to
  whichever workflow already has a browser (#237). The edge-rewrite assertion
  (`e2e/edge-rewrite.spec.ts`) runs from the infrastructure apply, because that is the workflow that
  changes the CloudFront Function; asserting from `deploy` would race the apply.
- **The analytics half has a public reader since 2026-11-01.** `/analytics` describes the GA4 events
  and their parameters to readers in both editions, decided in
  [ADR-0054](./0054-analytics-schema-page-derived-from-the-emitting-code-off-the-menu.md). The same
  things are observed with the same tools; a change to the event schema is now also a change to a
  published page.

### Rejected options that are still live

- **Backend telemetry (structured logs, metrics, tracing).** There is no backend to emit it; that is the
  retired platform's playbook.
- **Nothing.** A broken deploy or a blank prerendered route would ship unseen.

### Consequences still being paid

- **No server-side insight**, because there is no server. A property of the static decision, not a gap.
- **Usage numbers are a floor, not exact, and that is now a published claim.** Ad-blockers and privacy
  tools are one cause; the hard consent gate of ADR-0033 is the other, and it is the one `/analytics`
  names: a reader who declines is never counted.
- **The fidelity test between the event schema and `/analytics` covers event and parameter names only**;
  the page's prose is held by review.

## Links
- Driven by ADR-0053 (lean by design) · model defined in the dev-loop plugin (`/principles/dev-loop`, `trunk-single-env`)
  · relies on *CI gates on the pull request* above (full gate on the PR) · supersedes the GitFlow two-environment model (History index).
- **Absorbed 2026-11-02 (#456, the seventh slice):** records 0018, 0019, 0020, 0021, 0022, 0023 and 0044,
  as the seven sections above this list. Each names the `git log --diff-filter=D` command that finds its
  full record. The decision index lists each number under *Records that left the library*.
- **2026-08-09 amendment evidence:** PR #402 (`fix/dispatch-cannot-apply-infra`, at `130b98a8`) for the
  change and its four mutation-checked assertions in `apps/fed/scripts/deploy-workflow.test.mjs`;
  `.github/workflows/deploy.yml` at that branch for the two refusals (`gate`'s hardcoded `iac=false` and
  `terraform-apply`'s `github.event_name == 'push'`). The **class-scope** claims above were each checked
  against the branch rather than relayed: `deploy.yml`'s `on:` block (push `main` + `workflow_dispatch`
  only), the two writers of `gate`'s `iac` output, the single executed `terraform apply`, and `iac.yml`'s
  `pull_request`-only trigger. Settled empirically from this repo's run history: a `workflow_dispatch`
  from the non-default branch `develop` ran repeatedly in June, so **`--ref` is honoured for the run**.
  The definition-source link is **unsettled and labelled a hypothesis** — `gh api` is denied at the floor.
  The methodology half of this decision (*which layer can carry a control*) is the 2026-08-08 amendment
  to **ADR-0008** in `tadeumendonca-skills`, which cannot ride in this repo's MR.
