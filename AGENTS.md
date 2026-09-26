# tadeumendonca-io — the harness-neutral brief

**This file is the whole brief for any agent harness that reads `AGENTS.md`.** It is not a
compatibility copy and it is not generated. Where your harness reads a root brief under a different
name, that other file exists in this repository too and is longer; **this one is not derived from it**,
and the two are authored side by side under the same rule rather than one being transformed into the
other.

## The budget, and whose it is

**Keep this file under 50,000 characters.** That number is **one consumer's measured floor, not a
standard**: Kiro `1.0.437` loads `AGENTS.md` as always-on steering and truncates it at 50,000
characters, announcing the loss only on a debug channel. **Every other harness's budget is unmeasured.**
The measurement is a read of the shipped bundle's control flow on a machine where that tool has never
authenticated; it has not been confirmed against a live session.

## What this repository is

**The owner's proof-of-engineering site — a fully static single-page application served from object
storage behind a CDN. There is no backend**: no API, no database, no authentication, no Lambda. It
was a backend-bearing monorepo once; that half was retired.

It is the public presence for the apex domain: an interactive CV, a portfolio linking to a curated
catalog of public repositories, a reading shelf, and long-form writing. **Content ships in the
repository** — markdown for long-form, typed source for structured data — and every route is
prerendered at build time, in both locales, so social and search metadata land in the served HTML.

**The argument is the code it links to.** Decisions are defensible with documented trade-offs, because
the repository is public and it *is* the pitch. No over-engineering; also not a playground — it has to
work.

## The floor — obligations, not descriptions of enforcement

**Every rule below is stated as something you must do, and each is true on a harness with no hooks at
all.** Where this platform also enforces one mechanically, that is a property of one harness and is
deliberately not written into the rule.

1. **No solo architectural decisions.** Architecture, contracts, positioning and anything irreversible
   or public-facing go to the owner. In-pattern implementation is yours to decide and report — asking
   on in-pattern work is the loop failing to flow, not caution.
2. **Never merge your own work, and never push to the trunk.** `main` is the only branch; work on a
   short-lived branch off it and open a merge request.
3. **Never rewrite published history.** No force-push to a shared branch, no destructive reset over
   work you did not create.
4. **Never write a secret into this repository or into a forge secret store.**
5. **Infrastructure mutation is pipeline-only.** Never run `terraform apply` or `terraform destroy`
   from a workstation. Local is read-only: format, validate, inspection plan. Destroying live
   infrastructure means removing it from configuration and merging. Changing DNS, the CDN
   distribution or the bucket needs explicit confirmation first.
6. **Never use a runtime flag that disables your harness's permission checks.**
7. **Never publish anything private.** See *The private layer* below — it is the sharpest rule here,
   because this repository is public and the mistake is not reversible.
8. **Never name a client in public writing.** A client or other third-party organisation is described
   by its sector or industry, never by its name; the owner's own employer may be named. Abstract every
   war story to a generic principle.
9. **Scratch files go in your harness's own session scratchpad, never in a repository path.** Bodies
   for merge-request and issue text are written to a file and passed by file, never inlined into a
   shell argument.
10. **One work item at a time.** One branch, one open merge request, finished through merge.
11. **A review finding is named, never filed.** Only the owner opens work.
12. **Everything published on the forge is written in English** — this file, the README, commit and
    merge-request text, issues, decision records. **The site's own copy is bilingual**; that is
    content, not forge publication.
13. **Publish a measured number with the command that produced it, or do not publish the number.**
14. **Never hardcode a string the interface displays.** The site's chrome is bilingual, and every new
    interface string is added to the in-repository locale catalog **in both locales**. A string typed
    straight into a component is shipped untranslated to half the audience — measured here once, where
    one module typed as a plain string served the wrong language for three days because nothing
    objected. Long-form content is one file per locale rather than two languages in one document; a
    missing translation should fail the build, never render.

## Quality — what "done" requires

- Lint and type-check clean; unit coverage at or above the project threshold; a green build.
- **The end-to-end suite is the proof that nothing already working broke**, and it must functionally
  cover every implemented feature. A change that adds behaviour without its regression is not done.
- **Observability is part of done, in the shape this repository actually has**: analytics, the client
  error surface, and a build and prerender smoke — routes render, metadata is present in the served
  HTML. There is no server telemetry here because there is no server.
- **A green pipeline is not the review.** The pipeline proves nothing broke; the gate judges whether
  the change is right.

## The routes, and why the path is authoritative

Public URLs carry a locale prefix. **The path decides the language** — a prefixed URL renders that
edition regardless of the visitor's browser, which is what makes a shared link keep its language.
Unprefixed sub-paths exist only as a client-side redirect and are **never** advertised in the sitemap
or in alternate-language metadata. The bare root is the one deliberate exception: it is prerendered,
it is in the sitemap, and it is the advertised default entry for a crawler with no scripting.

**`apps/fed/scripts/routes.mjs` is the build-time source of truth for the route set. Read it before
assuming a route exists.** Do not maintain a route list anywhere else — a second list is a list that
rots.

**The prerender is not a visitor.** It snapshots in a single browser and that HTML is served to
everyone, so anything rendering off the *visitor* — language preference, stored state, viewport —
rather than off the *route* must opt out of the snapshot. A post-mount check does not do it: the
snapshot is taken from an already-hydrated page.

## Structure

- **`apps/fed/`** — the single-page application: the components, the typed data under
  `apps/fed/src/data/` (the CV, the portfolio catalog and the reading shelf are typed source, not
  markdown), the route generator in `apps/fed/scripts/`, and the end-to-end suite in `apps/fed/e2e/`.
  **This directory carries no nested `AGENTS.md`, deliberately, and that absence is the whole of the
  claim.** A per-directory guide for it *does* exist — under the other root-brief filename, which the
  harness reading this file does not resolve at any depth — and its material is absorbed into this
  file rather than pointed at. A second brief under *this* filename would be a second thing to keep
  honest, and the duplicated pair in this workspace was measured drifting 118 lines in three weeks.
  Read this file, then read the source.
- **`iac/`** — the infrastructure as code: object storage, the CDN and its edge rewrite function,
  custom email records, the pipeline's identity roles, and an account-level cost budget scoped
  deliberately wider than this project so it catches spend this repository did not create. State lives
  in a managed remote backend; apply and destroy are pipeline-only.
- **`docs/adr/`** — the decision library, and **the architecture documentation**. This file is the
  map; those records are the territory. **Read the relevant record before changing anything it
  decides.** Also `docs/catalog-ready.md`, the bar a project must clear before it is published in the
  portfolio.
- **`.github/workflows/README.md`** — the full pipeline map, kept next to the pipeline definitions
  because that is where the questions get asked. **Read it before changing a workflow.**
- **`VERSION`** — numeric SemVer, no pre-release suffix. The deploy bumps the patch on every merge to
  the trunk and publishes a release; it is the deploy's first step because the version is a build
  input.

## The private layer

This repository is **the one place the owner's professional presence is maintained from**, and the site
is one surface among several. The positioning, the copy canonically published on each surface, and the
playbook that keeps them in sync live in a **private, version-control-ignored directory at the
repository root**, named in the ignore file. It is never published.

Rules that follow, and they are absolute:

- **Read the positioning source before writing any public-facing copy** — site content, READMEs,
  profile text, CV text. Never write positioning copy from memory; it drifts.
- **Never commit, quote, paraphrase or otherwise move anything out of that directory into a public
  surface** — not into this repository, not into an issue, not into a merge request, not into a
  comment.
- **A positioning change propagates to every surface in one batch**, and the record of what each
  surface carries is updated to match what actually shipped.
- **Writes to external public surfaces are ask-first.** Show the proposal and wait.

## Fixed decisions — do not reverse without discussion

- **Static site, no backend.** Content is in the repository and prerendered.
- **The application owns its styling system directly**; no component-library dependency; a single
  theme; no progressive-web-app shell.
- **The visual identity is a set of deliberate constraints, not defaults — confirm before changing any
  of them.** One fixed theme and **no light/dark toggle**; a near-black, warm off-white and exactly
  **one** accent colour; a display face and a monospace face for labels, data and metadata,
  self-hosted rather than fetched; and **zero border-radius, no shadow, no gradient**, enforced in the
  styling scale itself so a leftover rounded or shadowed utility renders square and flat. There is one
  carved exception, a round portrait, reachable only through its own named utility and deliberately not
  through the general scale. Read these as decisions someone made and had reasons for: they are the
  reason the surface looks like one thing, and each is individually easy to erode by accident.
- **Pipeline identity is pinned to the repository's immutable subject**, never to its name — a rename
  silently breaks every trust relationship otherwise.
- **The vocabulary for the practice is fixed and lives in the private positioning source.** Read it
  before writing copy that names the practice.
- **A client is described by its sector in public writing, never by its name; the owner's employer
  may be named** (floor item 8).

## Requires explicit confirmation before you act

- **A merge that touches `iac/`** — the deploy applies it against real infrastructure. Confirm the
  plan first.
- **Publishing an article.** It is the owner's *voice*: what the piece argues, in whose words, is not
  something an agent supplies.
- **Anything that threatens the site's continuity**, and any change to the rules by which work is
  decided.

**One residue, stated so it is a known cost rather than a surprise:** social scrapers pin the preview
card they first fetch, so a wrong unfurl on an already-shared post is not repaired by the next merge.
It stays wrong on that post and right everywhere after. This is bounded and accepted.

## How to ask — the form of an escalation

The section above says **when** the owner has to be in the loop. This says **in what form you reach
him**, and it governs one act only: a decision rising out of work already in flight. An interview, a
design conversation, an ad-hoc request typed at a terminal is not an escalation, whatever its subject.

1. **One decision per interruption.** Two, however short, is a decision list, and he pays the
   context-rebuilding cost twice. Ask the first and carry the second to its own interruption. **This is
   the costliest rule here, not the politest one:** where the surface you raise questions through shows
   only the first of several, the remainder were never put to anybody, nothing announces the loss, and
   the work carries on as if they had been answered. You have no way to tell which surface you got. Ask
   one.
2. **The interruption is a tweet; the context lives in the OPTIONS.** Each option states its own
   consequence, and that is the entire preamble — the reasoning goes in something he can open, never
   into the interruption. **Write the consequence into the option's own visible text.** A consequence
   attached beside the option rather than inside it can be lost in transport on the way to him, silently.
3. **Enumerate the choices and give each its consequence. Four is a ceiling, not a target.** This is an
   obligation about the choices and not about any widget: use a structured presentation where your
   harness has one, enumerate in prose where it does not, and keep the ceiling either way. An open
   question standing in for a reduction you owed is the failure this rule exists for.
4. **An act you cannot perform yourself is an order and a link, not a question.** The test is whether
   there is a second option you would genuinely defend; if there is not, it is an instruction — one
   line, the act and the object, no options, no recommendation. The tell in a bad one is that every
   option is the same act at a different time. Lead with the ask.
5. **An interview takes NO options; an escalation always does.** They are opposite rules because they
   are opposite acts — an interview draws out what he thinks and a menu would put words in his mouth,
   while an escalation asks him to settle something you have already reduced. **The escalation half is
   a floor rule rather than a matter of taste:** an options-less question can be disposed of by the
   machinery itself and the work advanced, leaving at most a debug record nobody is watching.

**Rule 4 was built as an automatic control once and removed.** The lesson is why it is a written rule
here: **a preventive control whose false positives are invisible to the person it protects is worse than
no control at all, however good its true positives** — the suppression lands before he sees anything, so
a withheld decision reaches him as prose that reads like a decision already made.

**The provenance of the three consequences above, because a measured claim with no version quietly goes
false:** they are read from the control flow of Kiro `1.0.437`'s shipped bundle, on the same machine and
the same build as the budget figure at the top of this file — a machine that has never authenticated
that tool and has never run a session in it. Control flow read, not behaviour observed; dated, not
settled. **None of the five obligations depends on that reading being right**: each is worth obeying on
a harness where none of it holds, which is why they are stated as things you do rather than as things
that happen.

**The sibling repository's brief is to carry the same five rules, with NO byte-identity obligation
between them.** That is stated as the rule and not as a claim about that repository's state, which
nothing here can verify. The two briefs are deliberately different documents — different floors,
different structure, different subject matter — so it is the rules that must agree and never the
characters. The divergence is not a defect to repair.

## How work is dispatched

Work here is carried out by the platform's profiles — product lead, tech lead, agents lead, scrum
master, developer, content writer, content reviewer and quality assurance — whose briefs live in the
sibling repository rather than in this one. The main session hands each piece of work to one of them.

**Every dispatch is a fresh instance, and no instance is reused.** When you hand work to a profile,
start a new instance of it for that one dispatch. Never carry an instance from one issue to the next,
and never carry the instance that built a change into reviewing it — the review is its own dispatch,
started fresh. Proposing a change and building it are separate dispatches too. **This is about
instances, not profiles:** the agents lead may still both build a `loop` item and review it, which is
an accepted decision in the sibling repository's decision library (its roster-and-loop record, record
0015 there, mitigated by that profile never merging), and this rule does not reverse it — it requires
the two acts to run in two contexts. The reason is what a verdict attests: the diff the reviewing
context actually holds. An instance carried across several issues, or whose earlier history has been
summarised or truncated to fit, may no longer hold the diff it signs, and its verdict reads the same
either way. Nothing observes which instance ran a dispatch; this is held by whoever dispatches and by
review.

## Standing rules for working this loop

**These are the owner's standing rules for any agent working this loop, restated as obligations.**
Until this section existed they were recorded only in one harness's private memory store, which no
other harness reads, so they never reached a session running anywhere else — and a session rooted in
this repository reads this file, not the sibling repository's brief, which carried them first. Each is
true on a harness with no hooks. They add to the floor above rather than restate it; where one sits
next to a floor item, it names that item. Mode-dependent values, and the bound on work in progress, are
deliberately not stated here — read them from `docs/loop-mode.md`.

### Git and the forge

1. **Merge with a real merge commit. Never squash, and do not rebase-merge unless the owner asks.** The
   branch's individual commits are the changelog: release notes are built from their conventional
   commit subjects, and a squash collapses them into one. If a repository permits only squash, report
   that rather than squashing.
2. **In a commit message, reference an issue as `Refs #N`. Never put a closing verb — close, fix,
   resolve, in any tense — in the same clause as an issue number, not even to deny it.** The forge's
   parser is lexical: it closes the issue on merge and never reads the negation. A merge request's
   resolved closing set is derived from its body alone, so inspecting the body cannot see a commit
   message. Check the commit range instead:

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
   file.** Resetting a file to the index discards every edit in it that is not yet staged, not only
   the last one, and nothing keeps a copy; restoring it from the last commit discards the staged ones
   too. Before deliberately breaking something to test it, commit the good state;
   then a restore is correct instead of destructive.
4. **Address a repository explicitly rather than through the shell's current directory** — `git -C
   <path>`, and a repository flag placed after the subcommand — and never change directory inside a
   compound command. Several checkouts of one repository can be live at once, so the current
   directory does not identify which one an act lands in, and an act that defaults to the current
   branch can land on a different slice's work.
5. **Commit messages longer than one line go through a file as well** — floor item 9 requires it for
   merge-request and issue bodies, and the reason is the same: the shell silently deletes backtick and
   dollar spans from an inline message, and the commit is created anyway, carrying the mutilated text.
6. **Scratch never goes to a shared system temporary directory, and never inside a repository's `.git`
   directory.** Floor item 9 says where scratch goes; these are the two places it has actually gone
   instead. If your harness gives you no session scratchpad, ask where scratch belongs rather than
   choosing either of those.
7. **Never wait on a pipeline with a sleep-and-poll loop.** Push, report that checks are running, and
   check once, when it matters. When you read a result, read it for the exact commit you mean, by its
   full identifier. **The same holds for an agent you dispatched:** wait for it once, blocking, with
   the longest timeout your tool accepts — the wait returns as soon as the agent finishes — and never
   sleep, list or re-wait on a short timeout in between. Every check is a model request that re-sends
   your whole context.

### Reporting to the owner

8. **A merge-request link reaches the owner only when that merge request is ready to merge**: every
   check has finished and passed, and the gate's verdict at the current head leaves only his act.
   Before that, report state in prose and name the item by number. A merge-request link in his hands
   reads as *something is waiting for me*, whatever sentence sits beside it. An issue link carries no
   such signal and is unaffected.
9. **When you do hand him a link, it is the browser address, not a command line for him to run.**
10. **A failed check is yours to fix, not his to hear about.** Send it back to whoever built the change,
    with the failing job and its cause, and keep going until the pipeline is green — unless the failure
    needs a decision only he holds, in which case it is an escalation and *How to ask* above governs
    its form.
11. **Anything you need from him goes first in the message, labelled as a request.** An ask buried
    under a status report is not read. Rule 4 of *How to ask* says this for an act he must perform;
    this extends it to every message.
12. **His decision lands on the item it decides, at the moment he makes it** — a comment on the issue
    or merge request, carrying his words. Relaying his answer into a dispatch is a separate act and does
    not record it: a fresh context, such as a gate or a later session, reads the tracker, never your
    conversation.

### The queue

13. **An item the owner opened is never closed on an agent's advice.** A lead recommending that it be
    dropped withholds `ready`; the item stays, and closing it is his act.
14. **When he gives several asks at once, each becomes its own tracked item before anything is
    built.** Folding them straight into slices invents groupings and silently drops whatever did not
    fit one.
15. **In every mode, every eligible `loop` item is worked before any eligible `product` item.**
    Ordering inside each block follows the mode of record. Eligible means in the pool that
    `docs/loop-mode.md` defines for the mode in force — read the predicate there, not a paraphrase of
    it; under `scrum` that pool holds only items in the active iteration's milestone. Every mode's pool
    requires `ready`, so an item still awaiting `ready` is never in it. Neither predicate filters
    `blocked`, so a `ready` item carrying `blocked` is still in the pool.
16. **`content` is selected by the owner one piece at a time and is never drained autonomously.** When a
    `content` item is opened, its intake starts by interviewing him about what it must communicate,
    recorded in his words, one question at a time and without options (rule 5 of *How to ask*).
17. **The eligible pool spans both repositories of this platform** — read both queues. Read the mode of
    record, `docs/loop-mode.md`, before any pool query, and never infer the mode from what a query
    returns: an empty result means different things in different modes.
18. **Review is routed by type.** `loop`: one agents-lead lens pass, plus the gate. `product`: the
    leads' lenses as the slice warrants, plus the gate. `content`: the content writer drafts and the
    content reviewer repairs in place for at most two rounds, plus the gate. The gate runs on every
    merge request whatever the type, and nothing in this routing narrows it. Intake is routed the same
    way: a `loop` item's description is closed by the agents lead alone, a `content` item's by the
    product lead alone, and a `product` item's by the product and tech leads together.
19. **A dispatch that only reads a checkout still gets its own worktree whenever a build may be
    running.** Producing no diff is not the same as not colliding: a concurrent build switches branches
    under a reader sharing its checkout, and the reader measures the wrong tree.

### Building and investigating

20. **Before changing the loop, re-derive its state model**: the item types, the states each passes
    through, which role acts at each transition, and what observable artifact records that it happened.
    A rule whose application no artifact records is applied inconsistently and silently.
21. **Before relying on a check you wrote or changed, break its subject on purpose, watch it go red,
    restore, and watch it go green.** Mutate the thing checked, never the checker. A check that has
    only ever passed has been observed passing, not shown to work. See *Before you trust a green, break
    it on purpose* in the platform's engineering-standards skill.
22. **A true answer that closes the inquiry is the failure to guard against.** When a symptom repeats,
    *the actor should have been more careful* is a reason to keep going, not a conclusion: find what
    made the rule unreachable at the moment of the act. That is principle 12 in the same skill.
23. **Do not assert in a dispatch brief a premise you have not measured.** Measure it and carry the
    command, or write it as a premise the dispatch must verify. A brief is the specification the
    dispatch builds against, so a false premise there becomes the design. State facts in a brief, and
    mark any argument written to justify one as briefing-only — reasoning placed in a brief tends to
    come back as published text. **Never ask a dispatched profile to re-read a file its instructions
    already carry, and as that profile do not re-read one on your own:** the read adds a second copy
    that every later request re-sends. If you have reason to think the carried copy is stale, read only
    the section you need and say why.
24. **A change to the machinery is evaluated against every harness that runs sessions in this
    repository**, not only the one you are running on.
25. **A secret's scope and name follow the single standard in the platform's devops skill.** Never
    decide either per repository.

### Who acts, and what is written in public

26. **The main session — the context the owner talks to, called the orchestrator here — only
    dispatches. It never edits a repository file itself.** Every real change flows through a profile
    and that profile's gates, on any harness. **No layer enforces this**: the check that once refused
    such an edit was removed, so nothing stops the orchestrator from making one. It is an obligation
    held by the orchestrator and by review.
27. **On the `loop` lane, the owner decides whether an item is ready, and the orchestrator applies the
    `ready` label once it has aligned with him.** The agents lead closing the description does not earn
    the label, and no dispatched profile applies it. Aligned means he has said the item is ready, and
    his words are recorded on the item (standing rule 12, not floor item 12). On the other lanes,
    `ready` follows the intake that closes the description (standing rule 18).
28. **On any public surface, a client or other third-party organisation is described by its sector or
    industry, never by its name.** The owner's own employer may be named. Public means everything
    published — prose, commit and merge-request text, issues, decision records, examples. Floor item 8
    states the same rule.

## What is checked, and what no check can say

A gate asserts that this file is **tracked**, **under the character budget with headroom**, **free of a
declared set of tokens specific to one harness**, and that **every repository-relative path it names
exists**.

**What no check can assert: that this brief is TRUE, or that it is neutral rather than merely free of
the tokens on a list.** A sentence that is portable in vocabulary and false in substance passes every
arm. Neutrality is held by whoever writes and reviews this file.

## What this file deliberately does not carry

- **The harness-specific installation and configuration steps.** They are in `README.md` and in this
  repository's other root brief.
- **The invocation syntax for a typed command.** Reach a guide by its path and read it.
- **Counts.** Every enumerated number ages. Where you need one, derive it.
