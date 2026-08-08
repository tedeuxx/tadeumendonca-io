# 0044. The version number is a publication counter — MINOR counts publications, and reader-invisible work bumps nothing

- **Status:** accepted · mechanism not yet built (this record lands ahead of the workflow change it governs — see *Not yet true* below)
- **Date:** 2026-08-08
- **Deciders:** the owner
- **Supersedes / superseded by:** —
- **Driven by:** discharges the auto-patch clause of [ADR-0022](./0022-numeric-semver-auto-release.md) ·
  constrained by [ADR-0003](./0003-trunk-based-single-environment.md) (the merge is the deploy) ·
  serves [ADR-0038](./0038-content-distribution-linkedin-and-x.md) (the announcement that will carry the tag) ·
  reads on [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md) (a rule that costs a judgement per merge has to earn it)

## Context & problem

The site is at **`0.1.202`** and it can never be anything else. `deploy.yml`'s `release` job bumps the
**patch, hardcoded** (`bump-my-version bump patch`, `.github/workflows/deploy.yml:128`), on every push to
`main` that is not a `bump:` commit. There is **no path to a minor or a major at all** — no `part` input,
no label read, nothing. `-skills` has a `release.yml` with a `part` choice; `-io` never needed one and
never got one.

So the number counts merges. It is a **build counter wearing SemVer's clothes**, and three consumers
present it as if it meant something:

- the footer renders `v{SITE_VERSION}` as a link to that tag's Release (`AppShell.tsx:254-260`);
- `/portfolio`'s card for this repo renders the same string via `releases: 'this-build'`
  (`catalog.ts:118`, `PortfolioSection.tsx:56-60`);
- the GitHub Releases list is what both of those link into.

The forcing change is that **the owner intends to put the tag in the text of the announcement post**. A
number a reader is asked to read has to say something to a reader. `v0.1.202` says only that 202 things
happened, most of which were a test rename.

The reading the owner wants is available and costs no explanation of SemVer: **the minor digit counts
publications.** `v1.4.0` reads as *the fourth thing published since the milestone* — an issue number on a
magazine. That reading is destroyed by exactly one thing, and it is the thing the repo does today: a
refactor moving the number.

## Decision drivers

- **The number becomes reader-facing copy.** This is the driver, not a second decision — and the copy
  itself is `product-lead`'s, not this record's. What is decided here is only what the digits *mean*.
- **A version a reader can read without being taught SemVer.** The minor is the only digit that gets a
  human reading; major is a milestone, patch is maintenance.
- **The footer links release notes.** A release with nothing in it for a reader is noise on a list that
  was opened expecting news.
- **Derivability is the cost driver** (ADR-0001). A rule that reads a path filter and a rule that requires
  a judgement call on every merge are different prices, and the difference has to be stated, not
  discovered later.
- **A published claim must be checkable** — the standing property of this surface. Once a tag is in a
  LinkedIn post it is permanent and unfixable, so the number in that post must be **derived, never typed**.

## Considered options

1. **The digits mean publication, and reader-invisible work bumps nothing** (chosen).
   - **MAJOR** — a milestone with a release plan behind it. `1.0.0` is triggered by one specific event:
     the article about this architecture. After `1.0.0`, features are associated with a configured
     release plan and land under a major.
   - **MINOR** — a new post/publication. The trigger is the article's **merge**.
   - **PATCH** — a change to already-published content, or an application bugfix.
   - **Nothing** — refactors, tests, ADRs, workflow edits, dependency bumps.
   - *Trade-off:* the version stops being a liveness signal, and one of the four classes is not derivable
     (see *Consequences*).

2. **Keep the status quo — patch on every merge.** *Why not:* it is the option that makes the number
   meaningless, and it is a **dead end by construction**: with no `part` anywhere in the pipeline the repo
   can only ever reach `0.1.x`, so `1.0.0` is unreachable no matter what anyone decides. *What it buys and
   this loses:* the version is a perfect liveness signal — every merge visibly moves it, and a wedged
   release job is obvious within one merge. That signal is real and it is being given up.

3. **`linkedinUrl` in the article's frontmatter as the MINOR trigger** — the in-repo evidence that
   distribution actually happened (`content.ts:58`, a `FACT_KEYS` member; rendered at
   `ArticlesSection.tsx:77` and `ArticlePage.tsx:93`). *Why not:* **circular once the post announces the
   version.** `linkedinUrl` only lands after posting, and the post cannot announce a tag that does not
   exist yet. *What this costs, and it is a real loss:* the minor stops being a reader of the distribution
   rule. It measures publication **on the site**, not on the networks — so ADR-0038's cadence amendment
   still has **no reader**, and this record does not claim otherwise.

4. **Derive the part entirely from changed paths, no human input.** *Why not:* only one of the four
   classes is derivable. A new file under `apps/fed/src/content/blog/` is a publication and a machine can
   see it; a **bugfix and a refactor touching the same `.tsx` file are the same paths**. And `1.0.0`'s
   trigger is not in the tree at all — see *the two things a machine cannot see*, below.

5. **A separate `release.yml` with a `part` input, copying the plugin's pattern.** *Why not:* the pattern
   does not transfer, and the reason is specific to this repo. In `-skills` a tag is the whole product of a
   release; here **the bump commit is the tree that gets deployed** (`deploy.yml:25-32`). A bump pushed
   from a second workflow arrives on `main` as a `bump:` commit, which `deploy.yml` skips at **both**
   guards (`:78` and `:204`) — so the minor would be tagged and **never shipped**, and the live footer
   would keep naming the previous version until some unrelated merge happened to carry it.

6. **Bump on everything, but hide the reader-invisible ones** (draft Releases, or filtered notes).
   *Why not:* the footer and the `/portfolio` card render the *number*, not the list. Hiding the release
   moves the noise from the list to a version string that jumps 1.4.0 → 1.4.9 between two publications,
   which is worse — it looks like eight things a reader missed.

## Decision outcome

Chosen: **option 1.** The version number is a publication counter. MAJOR is a milestone, MINOR is a
publication, PATCH is a correction to something already published or an application bugfix, and
**reader-invisible work bumps nothing.**

`1.0.0` is not a date and not a threshold of accumulated work. It is triggered by **one named event**: the
article about this architecture, which does not exist yet.

## Consequences

**Good**

- The minor digit becomes legible to a non-technical reader with no explanation attached to it.
- `/releases` becomes a publication list rather than a merge log, and the footer link starts landing
  somewhere worth landing.
- `1.0.0` becomes reachable, which it is not today.

**Bad / accepted costs**

- **The version stops being a liveness signal.** Today a wedged release job is visible within one merge
  because the number always moves; after this, a long stretch of reader-invisible work is
  indistinguishable from a broken pipeline by looking at the site. This is the cost the owner accepted
  explicitly, and it is *not* fully paid back by anything in this record — the deploy's own `::notice::`
  output and the Actions history are the remaining evidence, and neither is visible from the site.

- **The `this-build` claim weakens, and its own documentation says so today.** `catalog.ts:52-54` states
  the card is *"exact rather than approximate: the deploy's `release` job bumps `VERSION` in the same
  commit the build consumes, so the tag shipped IS the tag that exists."* After this change that premise
  holds only on bumping merges. On a version-silent merge the deployed tree carries a `VERSION` whose tag
  points at an **earlier** commit — the tag exists, the Release resolves, and the notes no longer describe
  the running build. The honest reading becomes *"the last published version this build is at or after"*,
  and the comment at `catalog.ts:74-76` (*"`-io` re-tags on **every merge**"*) stops being true as written.
  Both are record corrections owed by the build MR, not by this file.

- **One human judgement per merge, on the class this record cannot derive.** Priced below.

- **ADR-0003 is not contradicted, and one of its clauses stops being true.** The merge is still the
  deploy: every merge still runs `deploy`, still builds, still publishes. What changes is that the deploy
  no longer always rides a **tagged** commit, so ADR-0003's 2026-07-30 amendment — *"the deploy now fires
  on the `bump:` commit … the only tree carrying the version it is tagged with"* — needs a narrowing
  amendment. (Separately, and found while checking it: that clause also describes a `paths: VERSION`
  trigger that `deploy.yml:41-44` no longer has. Not caused by this decision; noted so the amendment
  corrects both rather than one.)

## The classification problem, priced honestly

Four classes, and they do **not** have the same cost.

| class | derivable? | from what |
|---|---|---|
| MINOR | **yes** | a file **added** under `apps/fed/src/content/blog/` |
| PATCH — content correction | **yes, weakly** | a file **modified** under `apps/fed/src/content/blog/` |
| PATCH — application bugfix **vs.** nothing (refactor, test, ADR, workflow) | **no** | same paths, same file types; only intent separates them |
| MAJOR | **no** | not in the tree at all |

**The two things a machine cannot see.**

*The bugfix/refactor split.* A `fix:` and a `refactor:` in `AppShell.tsx` are indistinguishable by path.
Conventional-commit type is a *statement of intent*, not a derivation — it is typed by the same human who
would type the label, and it is per-commit where the decision is per-merge. It is a proxy, and calling it
a derivation would be exactly the false-mechanism claim this repo keeps paying for.

*`1.0.0`.* The owner's trigger is *"an article about the architecture, `track: engenharia`"*. **`track:
engenharia` cannot carry that**, measured: it is the parser's fallback and every published article already
has it — `green-checks-that-verify-nothing.pt.md:29` documents precisely this ("both branches of that
ternary returned the same value"). `my-commitment` and `green-checks-that-verify-nothing` both carry it
today. So the major trigger is an **owner declaration about one named article**, and no frontmatter key
can stand in for it.

**Therefore: the part is stated by a human, on the PR, and the derivable half is turned into a check
rather than into a derivation.** A required `semver:` label (`major | minor | patch | none`), enforced on
the **PR** gate so an unlabelled PR is red and cannot merge, and read on the **merge** so the deploy never
has to fail for a missing label. The one derivable case becomes a contradiction check: a PR that **adds**
a file under `apps/fed/src/content/blog/` and is labelled anything but `semver:minor` is refused.

That is the price, stated plainly: **one judgement per PR**, with a machine catching only the case where
the human said "nothing" about something a reader will obviously see.

## What makes the announced number derived rather than typed

The failure this defends against has no repair: a post shipped with the wrong tag makes the network copy
contradict `/releases` permanently. Three properties, end to end:

1. **The tag exists before the post does.** The trigger is the article's *merge*, so the sequence is
   merge → minor bumped and tagged → post announces a tag that already resolves → `linkedinUrl` returns
   later as the distribution record, bumping nothing.
2. **Nobody types the number into the draft.** `gen-distribution.mjs` already exists as the ADR-0038
   derivation tool, already reads the article's own frontmatter, and already writes to gitignored
   `.brand/distribution/`. It emits the tag line.
3. **The generator refuses when it cannot prove the tag describes the article.** Same discipline that file
   already applies to share URLs, where it refuses a slug with no prerendered route
   (`gen-distribution.mjs:53-61`): the tag `v$(cat VERSION)` must exist **and the article file must be
   present in that tag's tree**. If the article is not in the tagged tree, the tag does not describe a
   site that has it, and no draft is emitted.

The residual, unclosable by anything in this repo: a human can still edit the number in the draft before
posting, and nothing here can see the network. The defence is that they have no reason to.

## Not yet true

This record lands **ahead of the mechanism it governs**, deliberately (the owner settled the model in
session; the build is sequenced separately). Until the build MR merges, `deploy.yml:128` still bumps the
patch on every merge, the `semver:` labels do not exist on this repo, and every claim above about *how*
the part is chosen is a design, not a description.

The build MR owes three record edits, and they are part of this decision rather than new ones: the
**strike + discharge** on ADR-0022's auto-patch clause, the **narrowing amendment** on ADR-0003's
2026-07-30 clause, and the corrections to `catalog.ts:52-54` / `:74-76` and `version.ts:21,29`.

## Links

- ADR-0022 (what this discharges) · ADR-0003 (what it narrows) · ADR-0038 (the announcement) ·
  ADR-0001 (the cost test applied to the per-PR judgement)
- The plugin's `/workflow/versioning` documents a `semver:` label read by a `version-main.yml` — a
  workflow this repo **absorbed into `deploy.yml`** and a label set this repo **does not have**
  (`gh label list` returns neither). The design above adopts the skill's shape; the skill's description
  of this consumer is stale on both counts.
