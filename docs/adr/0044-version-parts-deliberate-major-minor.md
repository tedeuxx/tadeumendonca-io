# 0044. What the three version digits mean, now that a route to all of them exists

- **Status:** accepted
- **Date:** 2026-08-08
- **Deciders:** the owner
- **Driven by:** [ADR-0022](./0022-numeric-semver-auto-release.md) (which decided the automatic patch and
  nothing else) · constrained by [ADR-0003](./0003-trunk-based-single-environment.md) (the merge is the
  deploy) · serves [ADR-0038](./0038-content-distribution-linkedin-and-x.md) (the announcement that may
  carry the tag) · cost-tested against [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)

## Context & problem

**The repo has never left `0.1`.** `git tag --list` returns 202 tags, `v0.1.4` through `v0.1.205`, and
**every one of them is `0.1.N`** — the major has never moved and neither has the minor. That is not a
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
`gh issue list --label product --search "created:>=2026-08-01"` and the same with `closed:>=`). The loop
is a machine for grinding work down, and grinding generates findings; the backlog does not drain and is
not meant to. **So any definition of MAJOR shaped as "when enough is done" or "when the backlog is at
N %" can never fire.** A percentage against a moving denominator is theatre.

## Decision drivers

- **A version a reader can read.** The minor is the only digit a non-technical reader gets a reading of;
  it has to mean something to them or it should not be shown to them.
- **A MAJOR must be able to fire at all.** Against an intake rate equal to the delivery rate, only a
  **fixed cohort** — named in advance and not added to — can ever be complete.
- **Content must not be able to move MAJOR.** The site publishes continuously; if publications
  accumulated toward a major, the major would be a function of volume rather than of a decision.
- **The tag is or will be reader-facing copy** (ADR-0038), and copy that is permanent must be derived
  rather than typed.
- **Cost per merge** (ADR-0001). A rule requiring a human judgement on every merge is priced differently
  from one requiring it a few times a year, and the difference has to be stated before it is discovered.

## Considered options

1. **The deliberate parts carry meaning; the automatic patch is left alone** (chosen).
   - **MAJOR** — a milestone with a **release plan** behind it: a cohort of work named in advance, closed
     when that cohort is done, and never extended while it is open. **Content does not count toward it.**
   - **MINOR** — a new publication. One publication, one minor.
   - **PATCH** — a correction to already-published content, or an application bugfix. **Remains automatic
     on every merge to `main`** — see *Consequences*, this is the honest part.
   - *Trade-off:* the patch digit keeps counting merges rather than corrections, so the model is true of
     two digits out of three. Stated rather than hidden.

2. **The publication-counter model with a required `semver:` label, and reader-invisible work bumping
   nothing** (the parked draft on `docs/adr-version-digits-publication-counter`). *Why not, and it is two
   independent reasons:* it costs **a judgement on every PR** to buy a correct digit on roughly one PR in
   twenty — the measured shape of this repo's traffic — and the class it most needs to separate,
   *application bugfix* from *refactor*, **is not derivable at all**: the same files, the same paths, only
   intent between them. A required label on every PR to catch a case a machine cannot check is ceremony
   with a false-mechanism claim attached. *What it buys and this loses, and it is real:* under that model
   `/releases` becomes a publication list; under this one it stays a merge log with a few meaningful tags
   in it.

3. **`1.0.0` triggered by the architecture article** (the draft's trigger, and the owner's own earlier
   position). *Why not:* superseded by his fourth clause — **content only moves MINOR**. An article is a
   publication; publishing it is exactly what MINOR is for. Making one article also a major would mean a
   piece of content deciding a milestone, which is the coupling the fourth clause exists to break.
   *What this costs:* `1.0.0` loses a concrete, already-agreed trigger and now needs a release plan
   written before it can fire. That is a real delay and it is accepted deliberately.

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

Chosen: **option 1.**

**MAJOR is a milestone with a release plan** — a cohort fixed in advance, complete when that cohort is
done. **It is cut by hand, deliberately, and content never contributes to it.** `1.0.0` therefore has no
trigger yet: it acquires one when a release plan is written, and this record does not name it.

**MINOR is a publication.** One published thing, one minor, cut deliberately at or after the merge that
publishes it.

**PATCH stays automatic on every merge**, exactly as ADR-0022 decided. This record does **not** discharge
that clause and does not narrow it.

The mechanism is a **`part` input on the existing `deploy` workflow's `workflow_dispatch`**, defaulting to
`none`, with the automatic push path unchanged. One workflow, because in this repo releasing and
deploying are the same act (option 4).

## Consequences

**Good**

- `1.0.0` becomes reachable, which it demonstrably was not: 202 tags, all `0.1.N`.
- MAJOR and MINOR gain a meaning before the first one is cut, rather than after — the ordering that was
  wrong in this repo's other version decisions.
- The cost is where the rarity is: a judgement a few times a year, on a dispatch, and none on the ~19 of
  20 merges that are reader-invisible.

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
  whether a release plan exists, and none could — a release plan is not in the tree. **The rule above is
  a convention held by one person**, and its only defence is that the act is rare and deliberate.
- **A wrong cut is unfixable forward.** Tags are permanent and a Release is public. There is no dry-run.
- **`1.0.0` is now blocked on an artifact that does not exist** — a release plan. That is a deliberate
  delay bought in exchange for the major meaning something.

## What is not decided here

- **How a release plan is expressed.** Milestones are the obvious candidate and are **deliberately not
  adopted**: `-skills` used them for `v0.2.0 Phase 1` and abandoned them by 0.4.56, and this repo has
  never milestoned an issue. Recording a mechanism nobody has adopted would put a second unenforced claim
  in the library. If the owner wants scope-marking, it is its own decision.
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
