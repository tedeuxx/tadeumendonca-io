# 0003. Trunk-based delivery, single environment

- **Status:** accepted · **amended 2026-11-01** (adds the section *The release job writes to `main` as
  a GitHub App, under a ruleset that only that App bypasses*, #783; that section is `proposed` until the
  owner ratifies PR #799, and nothing above it changes)
- **Capability:** `delivery-and-gates`
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
`tech-lead` in [PR #799](https://github.com/tedeuxx/tadeumendonca-io/pull/799). This section is
`proposed`: it becomes `accepted` only when the owner ratifies that boundary-class MR.** The decision
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
repository ruleset with that App as its only bypass actor. It serves
[ADR-0022](./0022-numeric-semver-auto-release.md) (the automatic release) and
[ADR-0044](./0044-version-parts-deliberate-major-minor.md) (the same job, dispatched by hand).

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
- **Least privilege for the job's own token** ([ADR-0021](./0021-application-security-posture.md)'s
  supply-chain lever; [ADR-0015](./0015-oidc-immutable-subject-least-privilege.md)'s posture for
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
list holds **the App and no other actor**, and classic branch protection is removed.

**The order is part of the decision.** The ruleset is active and the classic protection removed
before this merge, and nothing else merges in between: once the ruleset is active, the old token can
no longer push the `bump:` commit, so any other merge in that window breaks `release`. If the classic
protection were removed before the ruleset existed, `main` would be ungated in between.

**The `bump:` loop guard stays.** A push made with an App token does start workflows, as the personal
access token's did, so the `bump:` commit re-enters `deploy` and the job's `if:` is still what stops
it.

**What the passages that say "branch protection" mean now, and why none is superseded or amended.**
Four places describe branch protection as the mechanism of their time:
- this record's 2026-07-30 amendment, *Alternatives rejected, and why each lost*: folding the bump into
  `deploy` is rejected because a compromised dependency would hold *"the bump PAT"* with
  `workflows: write`. That argument still holds, because the App token is a repository write credential
  too;
- [ADR-0014](./0014-terraform-cloud-pipeline-only.md) and
  [ADR-0021](./0021-application-security-posture.md): *"a skipped required check satisfies branch
  protection"*, and why that forces `if: always()` on a required aggregator;
- [ADR-0018](./0018-ci-gates-e2e-on-pr-coverage.md): a workflow with a top-level `paths:` filter
  *"cannot be a required status check"*.

What those passages decide is about **required status checks**, and a ruleset carries required status
checks with the same semantics as classic protection. GitHub's documentation treats a skipped required
check as passing and a never-reported one as pending in both. **That is read from GitHub's
documentation, not measured on this repository's ruleset.** On that reading every decision in them
still binds; only the noun naming where the requirement lives has changed. Their wording is left as a
record of its time, and a reader maps "branch protection" to *the ruleset on `main`*. One of them also
carries a discharged gap: ADR-0021's *"Not verified by me: the contents of branch protection on
`main`"* is answered by the owner's 2026-10-31 read above, and that record is not edited for it.

### Consequences

**Good**
- **The release path no longer expires on a calendar.** The credential that runs it is a token minted
  per run, valid one hour at most.
- **The push bypass is narrowed from "every administrator" to one App** whose only repository
  permission is Contents. Before, the bypass followed a person's role; now it follows one named actor.
- **A direct push to `main` from the owner's credential is refused by the forge.** The brief's floor
  rule against pushing to the trunk was held by instruction alone, because agents act through an
  administrator credential and administrators skipped the rules. Under the ruleset that credential is
  no longer exempt, so the rule gains a layer that holds it. This follows from the configuration in
  *Decision outcome*; it is verified only when the ruleset is read live after the merge, as the Issue's
  acceptance criteria require.
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
- **Administrators no longer skip the rules.** Any merge or push made with the owner's credential,
  the gate's `gh pr merge` included, now needs the three checks green. This is stricter than before and
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
  be comprehensive and blocking (the CI-gate ADR puts E2E on the PR for exactly this reason).
- A fast forward-fix discipline (revert-on-`main` + re-deploy) replaces a promotion rollback.

## Links
- Driven by ADR-0001 · model defined in the dev-loop plugin (`/principles/dev-loop`, `trunk-single-env`)
  · relies on the CI-gate ADR (full gate on the PR) · supersedes the GitFlow two-environment model (History index).
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
