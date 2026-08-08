# 0044. Version digits carry content meaning — major and minor are a deliberate dispatch, patch stays automatic

- **Status:** accepted
- **Date:** 2026-08-08
- **Deciders:** the owner
- **Driven by:** [ADR-0022](./0022-numeric-semver-auto-release.md) (which decided the automatic patch and
  nothing else) · constrained by [ADR-0003](./0003-trunk-based-single-environment.md) (the merge is the
  deploy) · serves [ADR-0038](./0038-content-distribution-linkedin-and-x.md) (the announcement that may
  carry the tag) · cost-tested against [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)

> **Every strike below is from this record's own MR, before the record had ever been in force.** Two
> things moved during the review of the branch that ships it: the owner settled `1.0.0`, and a clause an
> earlier draft treated as decided turned out never to have been. The struck text is kept rather than
> deleted so a reader can see which way each went, and — for the second one — that the rule was retired
> because nobody had made it, not because it was overruled.

## Context & problem

**The repo has never left `0.1`.** `git tag --list | grep -cv '^v0\.1\.'` returns **0** — **every tag in
the repository is `0.1.N`**, and the major has never moved and neither has the minor. *The universal
rather than the count, deliberately:* the number of tags rises on every merge and is false minutes after
it is written, while the universal holds until the first deliberate non-patch — which is the event this
record exists to enable. This claim is falsified by its own decision taking effect. That is not a
choice anyone made; it is the only outcome the pipeline could produce, because `deploy.yml` bumped the
literal string `patch` in one place with no input anywhere.

ADR-0022 records that automatic patch and is otherwise silent: it says nothing about what a MAJOR or a
MINOR would mean, because until now neither was reachable and the question could not arise.

The change that forces it is the one this record ships with: **a `part` input on `deploy`'s
`workflow_dispatch`, making a non-patch tag producible for the first time.** The mechanism and the meaning
have to land together — a control that can cut `v1.0.0` with no record of what `1` claims is precisely the
defect this repo has paid for repeatedly, and it would be a worse instance than the earlier ones because
**a tag is permanent and a published tag is unfixable**.

There is a second forcing condition, and it is what makes the *meaning* hard rather than merely
undecided. **Intake and delivery run at the same rate here, by design.** Measured on 2026-08-08 over
`label:product` in the seven days from 2026-08-01: **22 issues created** in the window and **21 closed**
in the window (two different populations, both counted directly —
`gh issue list --label product --search "created:>=2026-08-01"` and the same with `closed:>=`). **Both had
moved to 23 and 22 by the end of the same day, which is not an erratum but the measurement restating
itself:** re-run the two commands and the pair will differ again, and the gap between them will not.
The loop
is a machine for grinding work down, and grinding generates findings; the backlog does not drain and is
not meant to. **So any definition of MAJOR shaped as "when enough is done" or "when the backlog is at
N %" can never fire.** A percentage against a moving denominator is theatre.

## Decision drivers

- **A version a reader can read.** The minor is the only digit a non-technical reader gets a reading of;
  it has to mean something to them or it should not be shown to them.
- **A MAJOR must be able to fire at all.** Against an intake rate equal to the delivery rate, only a
  **fixed cohort** can ever be complete — one whose contents are settled when it opens.

  *That a cohort which keeps growing never completes is **this record's argument**, not a rule anyone
  stated.* It is marked because the phrasing it replaces — "named in advance **and not added to**" — read
  like a decision and was never one. It is kept as reasoning, because it is the reason the model is
  cohort-shaped at all, and it is the only defence the model has against the measurement two paragraphs
  above.
- ~~**Content must not be able to move MAJOR.**~~ **A publication does not provoke a MAJOR on its own.**
  The site publishes continuously; if publishing accumulated toward a major, the major would be a
  function of volume rather than of a decision. **A publication may perfectly well be *part* of a
  milestone** — it sits inside a declared cohort like any other item. What earns the digit is the
  decision to declare the milestone; publishing is never by itself what closes one.

  **The struck absolute was never decided, and this is the more useful half of the correction.** It
  generalised a *scoping rule about what a progress metric counts* into a *prohibition on what a MAJOR
  may contain* — two different statements that happen to share the words "content" and "major". An
  earlier draft of this record then built a whole named exception out of it, complete with a boundary
  clause, to license something that was never forbidden. **A carve-out cut from a rule nobody made is
  worse than a missing rule**: it publishes the phantom prohibition in its own first clause, and every
  later reader inherits it as settled.
- **The tag is or will be reader-facing copy** (ADR-0038), and copy that is permanent must be derived
  rather than typed.
- **Cost per merge** (ADR-0001). A rule requiring a human judgement on every merge is priced differently
  from one requiring it a few times a year, and the difference has to be stated before it is discovered.

## Considered options

1. **The deliberate parts carry meaning; the automatic patch is left alone** (chosen, with option 3).
   - **MAJOR** — a milestone with a **configured release plan** behind it, **from `1.0.0` onward**. **A
     publication can be in that cohort; publishing one is never by itself what closes it.**
   - **MINOR** — a new publication. One publication, one minor.
   - **PATCH** — a correction to already-published content, or an application bugfix. **Remains automatic
     on every merge to `main`** — see *Consequences*, this is the honest part.
   - *Trade-off:* the patch digit keeps counting merges rather than corrections, so the model is true of
     two digits out of three. Stated rather than hidden.

2. **The publication-counter model with a required `semver:` label, and reader-invisible work bumping
   nothing** (the parked draft on `docs/adr-version-digits-publication-counter`). *Why not, and it is two
   independent reasons:* it costs **a judgement on every PR** to buy a correct digit on **fewer than one PR
   in thirty** — north of 200 merged PRs (`gh pr list --state merged`) against four publications to date, so
   the true figure is nearer one in sixty; thirty is the floor, taken from the most generous count available
   (`git log --diff-filter=A -- "apps/fed/src/content/**/*.md"` returns 8 files, 6 of them in the repo's
   initial import) — and the class it most needs to separate,
   *application bugfix* from *refactor*, **is not derivable at all**: the same files, the same paths, only
   intent between them. A required label on every PR to catch a case a machine cannot check is ceremony
   with a false-mechanism claim attached. *What it buys and this loses, and it is real:* under that model
   `/releases` becomes a publication list; under this one it stays a merge log with a few meaningful tags
   in it.

3. **`1.0.0` is the boundary cut, marked by the publication of the architecture section** — the parked
   draft's trigger, the owner's own position, and, since 2026-08-08, **chosen alongside option 1**.
   - ~~*Why not:* superseded by his fourth clause — **content only moves MINOR**. An article is a
     publication; publishing it is exactly what MINOR is for. Making one article also a major would mean a
     piece of content deciding a milestone, which is the coupling the fourth clause exists to break.
     *What this costs:* `1.0.0` loses a concrete, already-agreed trigger and now needs a release plan
     written before it can fire. That is a real delay and it is accepted deliberately.~~
   - **Struck, because the clause it appealed to does not exist** — see the fourth driver. There was
     never a prohibition on a publication being part of a major, so nothing here needed superseding and
     no exception is owed.
   - *What it buys:* `1.0.0` becomes reachable now, against an alternative the *Context* section already
     proves cannot fire — a cohort measured against an intake rate equal to the delivery rate. It also
     gives the release-plan discipline a **start line**, which is the thing a discipline most needs and
     most often lacks.
   - *What it costs:* the first major is the one cut with no plan behind it, so the model's central
     mechanism is unexercised at the moment the digit that advertises it moves.

4. **A separate `release.yml` carrying the `part`, copying the plugin's pattern.** *Why not:* the pattern
   does not transfer, for a reason specific to this repo. In `-skills` a tag *is* the product of a
   release; here **the bump commit is the tree that gets deployed**, and a bump arriving from a second
   workflow lands on `main` as a `bump:` commit, which `deploy.yml` skips at both of its guards. The minor
   would be **tagged and never shipped**, and the live footer would keep naming the previous version until
   some unrelated merge happened to carry it. *What it buys:* a clean separation of releasing from
   deploying — which is worth having in a repo where those are different acts, and this is not one.

5. **Derive the part from changed paths, with no human input at all.** *Why not:* only one of the four
   classes is derivable. A file **added** under the blog content path is visibly a publication; a bugfix
   and a refactor in the same `.tsx` are the same paths; and a milestone is not in the tree at all.
   *What it buys:* zero judgement per merge, which is genuinely the cheapest option — and it buys it by
   being wrong about two classes out of four.

## Decision outcome

Chosen: **option 1, with option 3 settling the first major.**

The owner, verbatim:

> *"esse post do arquitetura será o marco da versão tag major 1.0.0. **depois disso**, todo trabalho de
> features de produto devem estar associados a um **plano de release configurado**."*

**`1.0.0` is the boundary.** The architecture section's publication marks it. **The release-plan
discipline begins after it** — `depois disso` — and applies to product-feature work from that point on.

**MAJOR, from `1.0.0` onward, is a milestone with a configured release plan.** Publishing does not
accumulate toward it and a publication does not trigger one on its own; a publication may be **inside**
it like any other item.

**MINOR is a publication.** One published thing, one minor, cut deliberately at or after the merge that
publishes it.

**PATCH stays automatic on every merge**, exactly as ADR-0022 decided. This record does **not** discharge
that clause and does not narrow it.

~~`1.0.0` therefore has no trigger yet: it acquires one when a release plan is written, and this record
does not name it.~~ **Struck — it has one, and it is not a release plan.**

The mechanism is a **`part` input on the existing `deploy` workflow's `workflow_dispatch`**, defaulting to
`none`, with the automatic push path unchanged. One workflow, because in this repo releasing and
deploying are the same act (option 4).

### Why `1.0.0` owes no cohort, and why that is a boundary rather than a hole

`1.0.0` has no enumerated contents. **Nothing is in it besides the publication that marks it, and nothing
needs to be** — the rule requiring a plan starts *after* this cut, by the sentence that created the rule.

**A discipline with a start line is not an exception to itself.** That is the whole distinction from the
carve-out this record retired two sections ago, and it is worth stating because the two look alike from a
distance: the retired one licensed an act the rule forbade; this one records the date the rule begins. The
first is a hole, the second is a boundary, and the difference is that a boundary does not have to be
justified case by case.

**The one place this could have been a contradiction, checked.** If the model defined MAJOR as
*"a milestone with a release plan"* **unscoped**, then `1.0.0` would fail the definition of the thing it
is — the record would be publishing a rule its own first instance breaks. It does not, because the
definition above is scoped `from 1.0.0 onward`, which is what the owner's sentence says. The scoping is
load-bearing, not decorative; unscoped, the model and the decision genuinely disagree.

**The consequence for the second major is strengthened, not weakened.** `2.0.0` is not the second-best
test of "a cohort settled when it opens" — it is the **first cut the rule reaches at all**.

### A milestone is declared before the work, not recognised after it

This now has the owner's own mechanism behind it rather than only the record's reasoning: work is
*"associado a um plano de release configurado"* — the work attaches to the plan, so **the plan exists
first**. Declaration precedes the work, not merely the cut.

*The reasoning that argued for this before the quote existed is kept, marked as the record's own:* a
cohort identified only after the work happened is indistinguishable from a label applied to whatever
landed, and against this repo's measured intake it would never be falsifiable.

**What the plan is configured in is not decided** (see *What is not decided here*), and nothing in the
pipeline checks that one exists. The property is auditable after the fact and is not a gate.

### What would make the NEXT publication not a MAJOR

**Nothing declares a milestone around it.** That is the whole test, and it is why publishing more can
never produce a major: the default for a publication is MINOR, and only a declaration moves it. Two live
cases, so the test is not abstract:

- **#380** is open and adds a section to the same architecture page. No milestone is declared around it.
  It is a MINOR at most, and under the automatic path it lands as a patch.
- **A later rewrite or expansion of the architecture section** is a MINOR, for the same reason. The page
  is not a major-bearing surface; a milestone was declared around one of its publications, once.

### What `1.0.0` actually rests on

Three facts about the state this first major is cut in. They are checked, and the record is more useful
with them than without:

- **The section is already published.** `apps/fed/src/content/architecture.{en,pt}.md` is live on `main`:
  `git merge-base --is-ancestor 115e505 origin/main` exits 0, so the commit that last edited the page at
  the time of writing is contained in `main`. So the cut is gated on the owner declaring the page done,
  not on a merge. **Containment rather than a count, deliberately** — an earlier draft asserted a number
  of commits against the file, which proves churn rather than publication and is false again on the next
  merge. Containment is monotone: once true, it stays true.
- **No cohort is declared, and none is owed** — the section above.
- **What gates the cut is prose.** The outstanding work is #380, an addition to the architecture section
  itself.

### What `1` claims

**`1.0.0` does not claim a completed cohort** — there is no cohort behind it, and there was never meant to
be. It claims this: **the system is describable as a whole, and the description is public.**

That is a weaker claim than most `1.0.0`s make, and it is stated weakly on purpose. It is also why the
occasion does not recur on its own: the first public account of a system happens once, and every later
one is a revision of it.

## Consequences

**Good**

- `1.0.0` becomes reachable, which it demonstrably was not: every tag in the repository is `0.1.N`
  (`git tag --list | grep -cv '^v0\.1\.'` → 0).
- MAJOR and MINOR gain a meaning before the first one is cut, rather than after — the ordering that was
  wrong in this repo's other version decisions.
- The cost is where the rarity is: a judgement a few times a year, on a dispatch, and none on the **29 in
  30 or more** merges that are reader-invisible — see option 2 for the derivation.
- **The release-plan discipline gets a start line rather than an intention.** `1.0.0` is the date it
  begins, which is checkable — every major after it either has a plan or visibly does not.
- The record and `deploy.yml` now say the same thing about `1.0.0`. They did not: the workflow comment at
  `deploy.yml:46` already read *"`1.0.0` is the architecture publication"* while the first draft of this
  record listed that as rejected — two artifacts in one MR disagreeing about the same fact.

**Bad / accepted costs**

- **"Reader-invisible work bumps nothing" is NOT in force, and this record refuses to claim it.** The
  owner has settled that clause as the model he wants; the mechanism shipping here does not implement it,
  because every push to `main` still bumps the patch. Until a later decision changes the automatic path,
  a refactor still moves the number. **Recording the intended rule as though the pipeline enforced it
  would be a false-mechanism claim**, which is the class of defect this library exists to catch.
- **The patch digit still counts merges.** So the version string is legible on two digits and noise on the
  third, and a reader who is told "the minor counts publications" may reasonably read the patch as
  counting corrections. It does not.
- **Nothing enforces the meaning.** The `part` input accepts `major` on any dispatch; no check asks
  whether a release plan exists, and none could — a plan is not in the tree. **The rule above is a
  convention held by one person**, and its only defence is that the act is rare and deliberate.
- **The central mechanism is unexercised when the digit advertising it moves.** `1.0.0` ships the model
  and skips its main clause by design. Nothing carries that forward to `2.0.0` except this record.
- **A wrong cut is unfixable forward.** Tags are permanent and a Release is public. There is no dry-run.
- ~~**`1.0.0` is now blocked on an artifact that does not exist** — a release plan. That is a deliberate
  delay bought in exchange for the major meaning something.~~ **Retired 2026-08-08: it was the accepted
  cost of the option the owner did not take, and it is now the exact opposite of what the decision says.**
  `1.0.0` is blocked on nothing but the owner declaring the section published; the release plan is what
  comes *after* it.
- **The major absorbs the minor on that cut.** The publication carrying `1.0.0` does not also get a minor;
  bumping the major resets the lower components. That is `bump-my-version`'s default behaviour for the
  `parse`/`serialize` pair in `.bumpversion.toml` and **it has never been exercised in this repo** — every
  tag is a patch bump, without exception — so the first major dispatch is also the first execution of that
  path.

## What is not decided here

- **What a "configured release plan" is configured *in*.** Still open, and now the governing question for
  **`2.0.0` and every later major**. Milestones-the-GitHub-object are the obvious candidate and are
  **deliberately not adopted**: `-skills` used them for `v0.2.0 Phase 1` and abandoned them by 0.4.56, and
  this repo has never milestoned an issue. Recording a mechanism nobody has adopted would put a second
  unenforced claim in the library. **This is the next decision the model needs**, and it needs it before
  the first product-feature work after `1.0.0`, not before `2.0.0`.
- **Whether anything other than product features attaches to a plan.** The owner's sentence scopes the
  discipline to *"todo trabalho de **features de produto**"*. Whether content work and harness work also
  attach is not stated, and **this record does not widen his scope to find out**.
- **When the architecture section counts as published.** The page is already live, so the cut is gated on
  the owner declaring it done rather than on a merge. That judgement is his and is not reduced to a
  criterion here.
- **Whether the announcement carries the tag**, and how it is derived rather than typed. That is
  ADR-0038's surface.
- **Whether the automatic patch should stop.** The parked draft argues it should; this record leaves
  ADR-0022 intact and takes no position.

## Links

- ADR-0022 (the automatic patch, left standing) · ADR-0003 (the merge is the deploy, which option 4 turns
  on) · ADR-0038 (the announcement) · ADR-0001 (the per-merge cost test that rejected option 2)
- The plugin's `/workflow/versioning` describes a `semver:` label read by a `version-main.yml` — a
  workflow this repo absorbed into `deploy.yml` and a label set this repo does not have. **The skill's
  description of this consumer is stale on both counts**, and this record does not fix it.
