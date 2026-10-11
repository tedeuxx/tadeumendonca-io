# tadeumendonca-io — the brief

**This file is the single brief for every agent harness that works in this repository.** It is
authored, not generated. There is no second root brief: the owner decided on 2026-10-11 (#721) to stop
using a brief that only one harness reads and to keep this open-standard file as the only one. Rules
that hold on any harness are stated as obligations in the body. Instructions that only make sense on
one harness sit in the last section, labelled with that harness's name, and nowhere else.

sphere: personal

This is a declaration only, recorded as decision record 0035 in the [workstation configuration repository's decision library](https://github.com/tedeuxx/mhw/tree/main/docs/adr); there is no stop-on-undeclared rule.

## The budget, and whose it is

**Keep this file under 50,000 characters; the gate fails at 45,000 so growth reddens before it
truncates.** That number is **one consumer's measured floor, not a standard**: Kiro `1.0.437` loads
this file as always-on steering and truncates it at 50,000 characters, announcing the loss only on a
debug channel. **Every other harness's budget is unmeasured.** The measurement is a read of the shipped
bundle's control flow on a machine where that tool has never authenticated. So this file carries rules
and the minimum reason for each; measurement history and struck wording live in git history and in the
decision records, not here.

## What this repository is

**The owner's proof-of-engineering site — a fully static single-page application served from object
storage behind a CDN. There is no backend**: no API, no database, no authentication, no Lambda. It
was a backend-bearing monorepo once; that half was retired.

It is the public presence for the apex domain, backing the owner's repositioning toward AI engineering
(agentic development and AI-native automation), anchored in delivery-lifecycle and distributed-systems
experience: an interactive CV, a portfolio linking to a curated catalog of public repositories, a
reading shelf, and long-form writing. **Content ships in the repository** — markdown for long-form,
typed source for structured data — and every route is prerendered at build time, in both locales, so
social and search metadata land in the served HTML.

**The argument is the code it links to.** Decisions are defensible with documented trade-offs, because
the repository is public and it *is* the pitch. No over-engineering; also not a playground — it has to
work.

## The floor — obligations, not descriptions of enforcement

**Every rule below is stated as something you must do, and each is true on a harness with no hooks at
all.** Where a harness also enforces one mechanically, that is said in the harness-specific section.

1. **No solo architectural decisions.** Plan and align before coding. Architecture, contracts,
   positioning and anything irreversible or public-facing go to the owner. In-pattern implementation is
   yours to decide and report — asking on in-pattern work is the loop failing to flow, not caution.
2. **Never merge your own work, and never push to the trunk.** `main` is the only branch; work on a
   short-lived branch off it and open a merge request.
3. **Never rewrite published history.** No force-push to a shared branch, no destructive reset over
   work you did not create, no recursive force delete.
4. **Never write a secret into this repository or into a forge secret store.**
5. **Infrastructure mutation is pipeline-only.** Never run `terraform apply` or `terraform destroy`
   from a workstation, and never mutate the cloud account directly. Local is read-only: format,
   validate, inspection plan. Destroying live infrastructure means removing it from configuration and
   merging. Changing DNS, the CDN distribution or the bucket needs explicit confirmation first.
6. **Never use a runtime flag that disables your harness's permission checks.**
7. **Never publish anything private.** See *The private layer* below — it is the sharpest rule here,
   because this repository is public and the mistake is not reversible.
8. **Never name a client in public writing.** A client or other third-party organisation is described
   by its sector or industry, never by its name; the owner's own employer may be named. Public means
   everything published — prose, commit and merge-request text, issues, decision records, examples.
   Abstract every war story to a generic principle.
9. **Scratch files go in your harness's own session scratchpad, never in a repository path.** Bodies
   for merge-request and issue text are written to a file and passed by file, never inlined into a
   shell argument.
10. **Bound work in progress by the `wip:` value in `docs/loop-mode.md`, and finish each slice
    through merge.** Development may run in parallel up to that bound, one `git worktree` per slice;
    the review gate never does (standing rule 29).
11. **A review finding is named, never filed.** Only the owner opens work.
12. **Everything published on the forge is written in English** — this file, the README, commit and
    merge-request text, issues, decision records. **The site's own copy is bilingual** (pt-BR and en,
    ADR-0032); that is content, not forge publication.
13. **Publish a measured number with the command that produced it, or do not publish the number.**
14. **Never hardcode a string the interface displays.** Every new interface string is added to the
    in-repository locale catalog **in both locales**; structured data such as the portfolio catalog
    carries the same leaf-bilingual type, so a missing translation is a compile error. Long-form content
    is one file per locale. A missing translation must fail the build, never render.

## Quality — what "done" requires

- Lint and type-check clean; unit coverage at or above 85%; a green build; the SonarCloud quality gate.
- **The end-to-end suite (Playwright) is the proof that nothing already working broke**, and it must
  functionally cover every implemented feature. A change that adds behaviour without its regression is
  not done.
- **Observability is part of done, in the shape this repository actually has**: analytics, the client
  error surface, and a build and prerender smoke — routes render, metadata is present in the served
  HTML. There is no server telemetry here because there is no server.
- **Security by design**: least-privilege pipeline roles per job, no secrets in the repository, and a
  minimal static attack surface. Rigor scales with blast radius: heavy where irreversible or public,
  product speed where cheap to revert.
- **A green pipeline is not the review.** The pipeline proves nothing broke; the gate judges whether
  the change is right.

## The routes, and why the path is authoritative

Public URLs carry a locale prefix (ADR-0036). **The path decides the language** — a prefixed URL
renders that edition regardless of the visitor's browser, which is what makes a shared link keep its
language. Unprefixed sub-paths exist only as a client-side redirect, are not prerendered, and are
**never** advertised in the sitemap or in alternate-language metadata. **There are two deliberate
exceptions** (ADR-0052): the bare root, which is prerendered in English, is in the sitemap and is the
advertised default for a crawler with no scripting; and the bare article path under the blog prefix
with the English slug, which is the neutral share address every social post carries — prerendered in
English, self-canonical, in the sitemap, and its article's advertised default.

**`apps/fed/scripts/routes.mjs` is the build-time source of truth for the route set. Read it before
assuming a route exists.** Do not maintain a route list anywhere else — a second list is a list that
rots. What the surfaces are, without the list:

- **The landing page** is the storefront and hosts the articles list; there is no separate blog index,
  and the old one redirects to that anchor. An article slug is **per locale** (ADR-0037), so the two
  editions of one article have different URLs.
- **The interactive CV** is the only CV surface. A two-page recruiter edition is printed from it at
  build time (ADR-0034), and both derive from `apps/fed/src/data/profile.ts`; nothing is maintained by
  re-typing.
- **The portfolio** is typed data in `apps/fed/src/data/catalog.ts`; the bar a project must clear to be
  listed is `docs/catalog-ready.md`.
- **The ramp-up plan and the architecture page** are markdown in the repository, both locales.
- **The library** is typed data in `apps/fed/src/data/library.ts`. Its empty state is live copy, kept
  covered for the day the list is empty again. Its slug is not localized. Where the ramp-up plan and
  the library name the same book, they must agree on facts — title, URL, finished status — never on
  prose.

**The prerender is not a visitor.** It snapshots in a single en-US browser and that HTML is served to
everyone, so anything rendering off the *visitor* — language preference, stored state, viewport —
rather than off the *route* must opt out of the snapshot through `window.__PRERENDER__`. A post-mount
check does not do it: the snapshot is taken from an already-hydrated page. The exemption is *identical
for every visitor*, not *does not render*.

## Architecture and structure

- **`apps/fed/`** — the single-page application (React, Vite, TypeScript, its own Tailwind styling, no
  progressive-web-app shell): the components, the typed data under `apps/fed/src/data/`, the route
  generator in `apps/fed/scripts/`, and the end-to-end suite in `apps/fed/e2e/`. The build prerenders
  every route in both locales by snapshotting the local preview server. **Never add a nested brief
  under this file's name**: one brief is one thing to keep honest, and a duplicated pair here was
  measured drifting 118 lines in three weeks.
- **`iac/`** — object storage, the CDN and its viewer-request URL-rewrite function, custom email
  records, the pipeline's identity roles, and an account-level cost budget scoped deliberately wider
  than this project so it catches spend this repository did not create. State lives in Terraform
  Cloud with local execution, one workspace, one environment, served at the apex. Cost is near zero;
  the shared web firewall was retired because there is nothing to protect on a static bucket.
  **`iac/cloudfront-functions/` is application logic in JavaScript**, so it is gated by both the `app`
  workflow (its behaviour) and the `iac` workflow (the edge running it) — gate ownership follows what a
  file is, not its directory (ADR-0018).
- **`docs/adr/`** — the decision library, and **the architecture documentation**. Its README is the
  index, the reading order and the count; never write a count of records anywhere else. **Read the
  relevant record before changing anything it decides.** Also `docs/catalog-ready.md` and
  `docs/iac-deploy-policy.md` with its `docs/iac-deploy-policy.json`.
- **`.github/workflows/README.md`** — the full pipeline map. **Read it before changing a workflow.**
- **`VERSION`** — numeric SemVer, no pre-release suffix. The deploy's first job bumps the patch on
  every merge to `main`, tags it and publishes a release, because the version is a build input the
  footer renders. A deliberate minor or major is the same job dispatched by hand with its part input
  (ADR-0044). The `bump:` commit is loop-guarded.

## The private layer

This repository is **the one place the owner's professional presence is maintained from**, and the site
is one surface among several (professional network, the code catalog, a microblog, the newsletter). The
positioning, the copy canonically published on each surface, and the playbook that keeps them in sync
live in a **private, version-control-ignored directory at the repository root**, named in the ignore
file. It is never published.

Rules that follow, and they are absolute:

- **Read the positioning file and the surfaces file in that directory before writing any public-facing
  copy** — site content, READMEs, profile text, CV text. Never write positioning copy from memory.
- **Never commit, quote, paraphrase or otherwise move anything out of that directory into a public
  surface** — not into this repository, not into an issue, not into a merge request, not into a
  comment.
- **A positioning change propagates to every surface in one batch**, and the surfaces file is updated
  to match what actually shipped.
- **Writes to external public surfaces are ask-first.** Show the proposal and wait.
- **Tool servers for this workflow are registered in your harness's per-user local scope**, never in a
  configuration file committed to the repository.

## Fixed decisions — do not reverse without discussion

- **Static site, no backend.** Content is in the repository and prerendered.
- **The application owns its styling system directly** (ADR-0007); no component-library dependency; a
  single theme; no progressive-web-app shell.
- **The visual identity is a set of deliberate constraints, not defaults — confirm before changing any
  of them** (ADR-0008). One fixed theme and **no light/dark toggle**; near-black `#0A0A0A`, warm
  off-white `#F5F4EF` and exactly **one** accent, safety orange `#FF5A00`; a display face and a
  monospace face, self-hosted; and **zero border-radius, no shadow, no gradient**, enforced in the
  styling scale itself. The one carved exception, a round portrait, is reachable only through its own
  named utility.
- **Pipeline identity is pinned to the repository's immutable subject**, never to its name — a rename
  silently breaks every trust relationship otherwise. Role identifiers are environment secrets; tooling
  tokens are repository secrets.
- **The vocabulary for the practice is fixed and lives in the private positioning file.** Read it
  before writing copy that names the practice. *agent-driven* is retired from reader-facing copy;
  historical records keep it.
- **A client is described by its sector in public writing; the owner's employer may be named** (floor
  item 8).

## Merge classes, and what requires explicit confirmation

**Loop model: `trunk-single-env`.** One branch, one environment, one hop from merge request to `main`
to deploy. The integration-branch, staging-promotion and staging-backed-development half of the
platform's loop skills does not apply here; where a platform skill and this file disagree, this file
wins.

The merge **is** the deploy, so it is the go/no-go, and the quality-assurance gate holds it — not a
human prompt on every merge request. It runs on every merge request, unprompted, verifies the
Definition of Done with real evidence, then either merges the **safe class** itself or escalates the
**boundary class** to the owner (ADR-0003 and its amendments are the operative text; read them before
classifying).

- **Safe class:** docs, dependency bumps, tests, in-pattern work implementing an approved spec, and the
  whole `product` backlog **including what a reader sees** — page prose, the CV, portfolio copy,
  interface strings, preview cards, alt text. An amendment that decides something is safe class;
  a record correction that only points at an already-ratified decision is safe class too.
- **Boundary class:** a merge that touches `iac/` (the deploy applies it against real infrastructure —
  confirm the plan first); anything that threatens the site's continuity; any change to the rules by
  which work is decided; and **publishing an article**, which is the owner's *voice*.
- **When the class is unclear, it is boundary.** The gate never merges an expansion of its own
  authority. The owner ratifies by commenting on the merge request, and the gate verifies that comment
  itself; a relay is a notification, never the authority.
- **The `reader-facing` label is an ordering and lens signal, not a gate**: the gate still dispatches
  the product lead's copy lens on a reader-facing `product` diff, by its own instructions.

**One residue, stated so it is a known cost rather than a surprise:** social scrapers pin the preview
card they first fetch, so a wrong unfurl on an already-shared post is not repaired by the next merge.
It stays wrong on that post and right everywhere after. This is bounded and accepted.

## How to ask — one global rule, then the form of an escalation

**Rule 1 governs every ask directed to the owner — decisions and actions, inside or outside work in
flight.** An interview, a design conversation and an ad-hoc request are not thereby escalations; rules
2–5 govern the form only when the act they describe applies. The global rule is one ask. The remaining
rules say what shape that one ask takes, and an interview remains distinct: it elicits without options.

1. **One owner ask per activation or message.** Two, however short, is a list, and he pays the
   context-rebuilding cost twice. Ask or order the first; preserve every remaining ask until after he
   answers, then carry the next to its own activation or message. Never move the remainder into a prose
   or numbered list. **This is
   the costliest rule here, not the politest one:** where the surface you raise questions through shows
   only the first of several, the remainder were never put to anybody, nothing announces the loss, and
   the work carries on as if they had been answered. Ask one.
2. **The interruption is a tweet; the context lives in the OPTIONS.** Each option states its own
   consequence, and that is the entire preamble — the reasoning goes in something he can open, never
   into the interruption. **Write the consequence into the option's own visible text.**
3. **Enumerate the choices and give each its consequence. Four is a ceiling, not a target.** Use a
   structured multiple-choice presentation where your harness has one, enumerate in prose where it does
   not, and keep the ceiling either way. An open question standing in for a reduction you owed is the
   failure this rule exists for.
4. **An act you cannot perform yourself — a merge above all — is an order and a link, not a
   question.** The test is whether there is a second option you would genuinely defend; if there is
   not, it is an instruction — one line, the act and the object, no options, no recommendation. The
   tell in a bad one is that every option is the same act at a different time. Lead with the ask.
5. **An interview takes NO options; an escalation always does.** They are opposite rules because they
   are opposite acts — an interview draws out what he thinks and a menu would put words in his mouth,
   while an escalation asks him to settle something you have already reduced.

**Rule 4 was built as an automatic control once and removed; do not build it again.** It classified by
label spelling rather than by choice shape, and each narrowing refused a new class of genuine decision.
**A preventive control whose false positives are invisible to the person it protects is worse than no
control at all, however good its true positives.** Rules 2, 4 and 5 are held by review. The sibling
repository's brief carries the same five rules; the rules must agree, never the characters.

## How work is dispatched

Work here is carried out by the platform's profiles, whose briefs live in the sibling repository. The
main session hands each piece of work to the profile that owns it. **The list below is the whole live
roster**; a check in the `app` workflow compares the names between the two markers with the sibling's
profile directory, so a retired name reddens here instead of becoming an instruction that fails when
followed. Retired names — the security reviewer, the harness reviewer and harness lead, the plain
writer, the plan reviewer and the principles guide — fail when invoked.

<!-- roster:dispatch -->
- **`tech-lead`** — a decision against the principles and the decision library; writes the product and system records.
- **`product-lead`** — what to build next, and whether published copy is true.
- **`developer`** — builds a slice end to end against an approved spec.
- **`content-writer`** — drafts articles, site copy and social-post language in the owner's voice; never posts directly.
- **`content-reviewer`** — repairs that draft in place, for at most two rounds, where it can quote a clause of the voice standard or the claim is false against the source; never posts directly. There is no copy block on the content lane.
- **`quality-assurance`** — the merge gate, holding the delivery lens and the production lens, including the permission floor and the supply chain.
- **`agents-lead`** — the machinery: hooks, configuration, briefs, the plugin. Pre-implementation, and may build the harness changes it reviews, never merging or gating.
- **`scrum-master`** — which profile acts next, and whether the rites ran in order. It holds no tools, so it returns a selection record and executes nothing.
<!-- /roster:dispatch -->

**Every dispatch is a fresh instance, and no instance is reused.** Never carry an instance from one
issue to the next, and never carry the instance that built a change into reviewing it — the review is
its own dispatch, started fresh. Proposing a change and building it are separate dispatches too. **This
is about instances, not profiles:** the agents lead may still both build a `loop` item and review it (an
accepted decision in the sibling repository's roster-and-loop record, mitigated by that profile never
merging); it requires the two acts to run in two contexts, because a verdict attests the diff the
reviewing context actually holds. Nothing observes which instance ran a dispatch.

## Standing rules for working this loop

**These are the owner's standing rules for any agent working this loop, restated as obligations.** Each
is true on a harness with no hooks. They add to the floor above rather than restate it. Mode-dependent
values, and the bound on work in progress, are deliberately not stated here — read them from
`docs/loop-mode.md`.

### Git and the forge

1. **Merge with a real merge commit. Never squash, and do not rebase-merge unless the owner asks.** The
   branch's individual commits are the changelog: release notes are built from their conventional
   commit subjects. If a repository permits only squash, report that rather than squashing.
2. **In a commit message, reference an issue as `Refs #N`. Never put a closing verb — close, fix,
   resolve, in any tense — in the same clause as an issue number, not even to deny it.** The forge's
   parser is lexical: it closes the issue on merge and never reads the negation. A merge request's
   resolved closing set is derived from its body alone, so check the commit range instead:

   ```
   git log <merge-base>..<head> --format='%B' \
     | grep -inE '\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\b[^.]{0,20}#[0-9]+'
   ```

   Calibrated rather than trusted: the same selector finds a negated sentence in this repository's own
   history, so it can return a hit.

   ```
   git log --all --format='%B' --grep='Filed not fixed: #266' \
     | grep -inE '\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\b[^.]{0,20}#[0-9]+'
   # -> 1 line: "Filed not fixed: #266 (ContactFooter hardcodes a UI string outside the i18n"
   ```
3. **Undo a recent change by reversing that change, never by checking out or restoring the whole
   file.** Resetting a file discards every unstaged edit in it, and nothing keeps a copy. Before
   deliberately breaking something to test it, commit the good state.
4. **Address a repository explicitly rather than through the shell's current directory** — `git -C
   <path>`, and a repository flag placed after the subcommand — and never change directory inside a
   compound command. Several checkouts of one repository can be live at once.
5. **Commit messages longer than one line go through a file as well** (floor item 9): the shell
   silently deletes backtick and dollar spans from an inline message.
6. **Scratch never goes to a shared system temporary directory, and never inside a `.git`
   directory.** If your harness gives you no session scratchpad, ask where scratch belongs. Merge-request
   bodies and commit messages go to the scratchpad; lens and gate verdicts go to the merge-request
   comment; interview transcripts and raw source material go to the private directory; a diagnostic
   probe worth running twice is a real spec under `apps/fed/e2e/`, otherwise nothing; an isolated
   checkout is a `git worktree` with its own install. A scratch directory under the application is
   retired and deliberately not ignored, so writing there reddens lint at once.
7. **Never wait on a pipeline with a sleep-and-poll loop.** Push, report that checks are running, and
   check once, when it matters, for the exact commit you mean by its full identifier. **The same holds
   for an agent you dispatched:** wait for it once, blocking, with the longest timeout your tool
   accepts. Every check is a model request that re-sends your whole context.

### Reporting to the owner

8. **A merge-request link reaches the owner only when that merge request is ready to merge**: every
   check has finished and passed, and the gate's verdict at the current head leaves only his act.
   Before that, report state in prose and name the item by number. An issue link is unaffected.
9. **When you do hand him a link, it is the browser address, not a command line for him to run.**
10. **A failed check is yours to fix, not his to hear about.** Send it back to whoever built the change,
    with the failing job and its cause, and keep going until the pipeline is green — unless the failure
    needs a decision only he holds, in which case *How to ask* governs its form.
11. **Anything you need from him goes first in the message, labelled as a request.**
12. **His decision lands on the item it decides, at the moment he makes it** — a comment on the issue
    or merge request, carrying his words. Relaying his answer into a dispatch does not record it: a
    fresh context reads the tracker, never your conversation.

### The queue

13. **An item the owner opened is never closed on an agent's advice.** A lead recommending that it be
    dropped withholds `ready`; closing it is his act.
14. **When he gives several asks at once, each becomes its own tracked item before anything is
    built.** Folding them straight into slices invents groupings and silently drops whatever did not
    fit one.
15. **In every mode, every eligible `loop` item is worked before any eligible `product` item.**
    Eligible means in the pool that `docs/loop-mode.md` defines for the mode in force — read the
    predicate there, not a paraphrase of it. Every mode's pool requires `ready`; neither predicate
    filters `blocked`.
16. **`content` is selected by the owner one piece at a time and is never drained autonomously.** Its
    intake starts by interviewing him, recorded in his words, one question at a time and without
    options.
17. **The eligible pool spans both repositories of this platform** — read both queues. Read the mode of
    record before any pool query, and never infer the mode from what a query returns: an empty active
    milestone is the terminal condition under one mode and means nothing under the other, and the two
    query results are byte-identical. At drain entry, compare the two repositories' mode records and
    stop on a disagreement.
<!-- review-chain-routing -->
18. **Review is routed by type.** `loop`: one agents-lead lens pass, plus the gate. `product`: the
    leads' lenses as the slice warrants, plus the gate. `content`: the content writer drafts and the
    content reviewer repairs in place for at most two rounds, plus the gate. The gate runs on every
    merge request whatever the type, under both its lenses, and nothing in this routing narrows a gate
    criterion, removes a hold or changes a verdict literal — a reader-facing copy criterion still fires
    regardless of type. The routing is a default: dispatching a lens the row does not name needs its
    reason stated in the dispatch. A lens's own stop condition bounds a pass; this routing bounds how
    many passes run. No rule is keyed on a round count. Intake is routed the same way: a `loop` item's
    description is closed by the agents lead alone, a `content` item's by the product lead alone, and
    a `product` item's by the product and tech leads together.
<!-- /review-chain-routing -->
19. **A dispatch that only reads a checkout still gets its own worktree whenever a build may be
    running.** A concurrent build switches branches under a reader sharing its checkout.

### Building and investigating

20. **Before changing the loop, re-derive its state model**: the item types, the states each passes
    through, which role acts at each transition, and what observable artifact records it.
21. **Before relying on a check you wrote or changed, break its subject on purpose, watch it go red,
    restore, and watch it go green.** Mutate the thing checked, never the checker. See *Before you
    trust a green, break it on purpose* in the platform's engineering-standards skill.
22. **A true answer that closes the inquiry is the failure to guard against.** When a symptom repeats,
    *the actor should have been more careful* is a reason to keep going: find what made the rule
    unreachable at the moment of the act (principle 12 in the same skill).
23. **Do not assert in a dispatch brief a premise you have not measured.** Measure it and carry the
    command, or write it as a premise the dispatch must verify — a brief is the specification the
    dispatch builds against, so a false premise there becomes the design. State facts in a brief, and
    mark any argument written to justify one as briefing-only. **Never ask a dispatched profile to
    re-read a file its instructions already carry, and as that profile do not re-read one on your
    own**; if you think the carried copy is stale, read only the section you need and say why.
24. **A change to the machinery is evaluated against every harness that runs sessions in this
    repository**, not only the one you are running on.
25. **A secret's scope and name follow the single standard in the platform's devops skill.**

### Who acts

26. **The main session — the context the owner talks to, called the orchestrator here — only
    dispatches. It never edits a repository file itself.** No layer enforces this.
27. **On the `loop` lane, the owner decides whether an item is ready, and the orchestrator applies the
    `ready` label once it has aligned with him** and his words are recorded on the item (standing rule
    12). No dispatched profile applies it. On the other lanes, `ready` follows the intake that closes
    the description (standing rule 18).

### The loop mode, parallel development and the serial gate

<!-- loop-mode-contract -->
28. **A loop mode names a widely known agile method and fixes exactly two things: what the iteration
    container MEANS, and which rites run at its edges.** The value, the enum and both pool predicates
    are in `docs/loop-mode.md`. Under `scrum` the milestone is a commitment — a limb of the pool
    predicate whose exhaustion ends the iteration and hands off to review, retrospective and planning,
    ranked at planning. Under `kanban` the same milestone is a period label that bounds nothing, no rite
    runs at a boundary, and the order is arrival order, `loop` before `product`. The milestone exists in
    both modes. Nothing enters a running iteration automatically; composing one is the owner's act.
    **A mode selects a predicate and a rite set; it never selects a permission rule.** A mode may never
    touch the permission floor, the merge gate and its lenses, head-scoped verdicts, only-the-owner-
    opens-work, the readiness bar (an `sp:N` estimate stays in both modes), the routing labels, or the
    container's existence; `content` has no second mode. Any trigger for a rite keys on elapsed time,
    never on the pool being empty. If a mechanism ever needs to know the mode, that review happens
    before it is written.
29. **Development parallelises; the review gate does not.** At most one merge request is in review at a
    time, whatever `wip:` says, and the next is not dispatched to the gate until the previous one has
    merged or been sent back. **Before dispatching the gate, rebase the branch onto the current trunk**:
    a serial gate composes safely only across that rebase, and the question to ask is *has the trunk
    moved since the head I attested?*, never only *does a named concurrent branch overlap?*. Conflicts
    are resolved at merge-request time by the slice's author. The sequence inside an iteration is the
    machine's: the scrum master proposes the set and the orchestrator opens worktrees and dispatches,
    with no per-item approval. Remove a slice's worktree after it merges.
<!-- /loop-mode-contract -->
30. **A gate dispatch names the merge request by number, positionally**:
    `gh pr merge <number> --merge`. A merge with no reference resolves against the current checkout's
    branch, which with several worktrees can be another slice's.
31. **A harness diff needs an agents-lead verdict marker on the merge request whose commit line names
    the head being merged**, in full forty characters; a marker naming an older head attests a diff it
    never read. The gate checks this before merging.

## The pipelines

Each workflow is named after the directory it gates; jobs are named after the command they run. The
full map is `.github/workflows/README.md`.

- **`app`** — dependency audit (blocks on high and critical production advisories, ADR-0021), lint,
  type-check, unit tests with coverage, static build, end-to-end, SonarCloud, and the harness-drift
  check, behind one terminal aggregator whose name branch protection fixes.
- **`iac`** — credential-free policy scan and format check, then the plan, the only job holding a cloud
  token. The cut is credentials, not commands.
- **`github`** — workflow linting and shell linting, in its own file so a syntax error elsewhere cannot
  stop the linter that catches it.
- **`brief`** — the mechanical properties of this file.
- **`deploy`** — on push to `main`, skipping its own `bump:` commits: release, then the gate, then the
  apply and the application publish, then end-to-end against the live apex. The post-deploy end-to-end
  run is not a gate; a red one means the site is broken and someone must act.

**Every merge-request workflow runs on every merge request and filters inside the job**, because a
workflow-level path filter can never be a required check. Each ends with a notice naming which of three
cases happened — nothing matched so nothing was verified; a step failed so the rest never ran; the gate
ran, here is the list. A check that matched nothing must not read like one that passed. The merge
request carries every check that can be true before merge; only assertions unsatisfiable before the
deploy exists live in the post-deploy smoke. **`main` is the working branch**: never add tooling that
blocks edits or commits by branch.

## What is checked, and what no check can say

A gate asserts that this file is **tracked**, **under the character budget with headroom**, **free of a
declared set of tokens specific to one harness outside the labelled harness-specific section**, that
**every repository-relative path it names exists**, and that **no second root brief is tracked**. It
also asserts the five *How to ask* commitments are present.

**What no check can assert: that this brief is TRUE, or that a sentence outside the harness-specific
section is neutral rather than merely free of the tokens on a list.** The human test is *would this
sentence still be true on a harness with no hooks?* That is held by whoever writes and reviews this
file. **Counts age**: where you need one, derive it.

<!-- harness-specific -->
## Harness-specific instructions

Each subsection applies only to the harness it names. Nothing here relaxes a rule above.

### Claude Code

- **This file reaches the main session natively.** Measured 2026-10-11 on Claude Code `2.1.296`: a
  headless session with no tools, in a directory holding only this file, answered a nonce that existed
  only here. Measured on `2.1.263` (#409): a skill body does not reach the main session, only the
  skill's name and description; and an additional working directory does not bring its root brief.
  That second fact was measured for the other filename and is unmeasured for this one.
- **The plugin and its hooks.** `.claude/settings.json` enables the `tadeumendonca-skills` plugin, whose
  `PreToolUse` permission guard denies a push or merge to `main`, `terraform apply` and `destroy`,
  direct cloud mutation, force-push, `rm -rf` and secret writes. Never run with
  `--dangerously-skip-permissions`. Nothing bounds work in progress or the serial gate: opening a merge
  request is allowlisted, so a second one opens silently.
- **Pickers.** Rule 3 of *How to ask* means `AskUserQuestion`, never prose numbering. It is absent from
  a headless session (`claude -p`), where the model degrades to prose numbering silently; every
  escalation path today is interactive. The plugin's one-question guard, a `PreToolUse` hook on that
  tool, denies a payload carrying two or more questions — a syntactic count, held at the source by
  mutation tests. The plugin's two merge-request-link detectors answer *may* a link go; rule 4 answers
  *in what form*.
- **Verdict markers.** The agents-lead marker is a merge-request comment carrying
  `harness-lead-verdict` and a `commit:` line. The plugin's zombie-loop detector, on `Stop`, reports a
  merge request whose markers are all stale, one turn late, and denies nothing.
- **The production sweep origin.** `.claude/settings.json` declares it under `.env.HARNESS_SWEEP_ORIGIN`;
  the plugin's browser server is bounded by it, and the sprint-review rite's first probe compares the
  server's argument with this tracked value. Read it only with
  `git -C <consumer> show HEAD:.claude/settings.json | jq -r '.env.HARNESS_SWEEP_ORIGIN // empty'`;
  empty output means no declaration and the rite stops. The pattern must cover every URL the route
  generator emits, and it takes effect after a restart of a session rooted here. **No additional
  directories are declared**, by the owner's ruling on #683: with the sibling checkout declared, the
  origin was bound in 2 of 12 trials against 12 of 12 without it. A session here therefore reads the
  sibling checkout only through `git -C`.
- **Tool servers** for the public-presence workflow are added with `claude mcp add -s local`, never in
  a committed project file.
- **The `claude` workflow** runs the assistant on an explicit mention in an issue or merge request. The
  merge-request review gate is the quality-assurance profile; the automatic app review was retired.
- **`apps/fed/CLAUDE.md`** is a per-directory guide only this harness reads; it is outside #721.
<!-- /harness-specific -->

## What this file deliberately does not carry

- **Installation steps.** They are in `README.md`.
- **The invocation syntax for a typed command.** Reach a guide by its path and read it.
- **Counts.** Every enumerated number ages. Where you need one, derive it.
