# tadeumendonca-io — the brief

**This file is the single brief for every agent harness that works in this repository** (#721, owner
decision 2026-10-11: no brief that only one harness reads). It is authored, not generated. The body
states rules as obligations true on any harness; instructions for one harness sit only in the labelled
section at the end.

sphere: personal

This is a declaration only, recorded as decision record 0035 in the [workstation configuration repository's decision library](https://github.com/tedeuxx/mhw/tree/main/docs/adr); there is no stop-on-undeclared rule.

## The budget

**Keep this file under 30,000 bytes; the gate fails at 30,000.** The smallest measured consumer reads
only the first 32,768 bytes and silently drops the rest, so a rule past that point does not exist for
it. Which harnesses were measured, and how, is in the harness-specific section. Carry rules and the
minimum reason for each; measurements and struck wording live in git history and the decision records.

## What this repository is

**The owner's proof-of-engineering site: a fully static single-page application served from object
storage behind a CDN. No backend** — no API, database, authentication or Lambda; that half was retired.
It is the public presence for the apex domain, backing his repositioning toward AI engineering (agentic
development, AI-native automation) on delivery-lifecycle and distributed-systems experience: an
interactive CV, a portfolio of public repositories, a reading shelf, long-form writing. **Content ships
in the repository** — markdown for long-form, typed source for structured data — prerendered at build
time in both locales so social and search metadata land in the served HTML.

**The argument is the code it links to.** Decisions carry documented trade-offs because the repository
is public and *is* the pitch. No over-engineering; not a playground either — it has to work.

## The floor — obligations, true on a harness with no hooks

1. **No solo architectural decisions.** Plan and align before coding. Architecture, contracts,
   positioning and anything irreversible or public-facing go to the owner. In-pattern implementation is
   yours to decide and report; asking on it is the loop failing to flow.
2. **Never merge your own work, and never push to the trunk.** `main` is the only branch; work on a
   short-lived branch off it and open a merge request.
3. **Never rewrite published history**: no force-push to a shared branch, no destructive reset over
   work you did not create, no recursive force delete.
4. **Never write a secret into this repository or into a forge secret store.**
5. **Infrastructure mutation is pipeline-only.** Never run `terraform apply` or `terraform destroy`
   from a workstation, nor mutate the cloud account directly. Local is read-only: format, validate,
   inspection plan. Destroying infrastructure means removing it from configuration and merging.
   Changing DNS, the CDN distribution or the bucket needs explicit confirmation first.
6. **Never use a runtime flag that disables your harness's permission checks.**
7. **Never publish anything private** (*The private layer*). This repository is public and the mistake
   is not reversible.
8. **Never name a client in public writing.** A client or other third-party organisation is described
   by its sector or industry; the owner's own employer may be named. Public means everything published
   — prose, commit and merge-request text, issues, decision records, examples. Abstract every war story
   to a generic principle.
9. **Scratch files go in your harness's session scratchpad, never in a repository path.** Merge-request,
   issue and multi-line commit text is written to a file and passed by file — the shell silently
   deletes backtick and dollar spans from an inline argument.
10. **Bound work in progress by `wip:` in `docs/loop-mode.md`, and finish each slice through merge.**
    Development may run in parallel up to that bound, one `git worktree` per slice; review never does
    (see *Loop mode, parallel development, the serial gate*).
11. **A review finding is named, never filed.** Only the owner opens work.
12. **Everything published on the forge is in English** — this file, READMEs, commit and merge-request
    text, issues, decision records. **The site's copy is bilingual** (pt-BR and en, ADR-0032).
13. **Publish a measured number with the command that produced it, or do not publish it.**
14. **Never hardcode a string the interface displays.** Add it to the locale catalog **in both
    locales**; structured data carries a leaf-bilingual type, so a missing translation fails the build
    instead of rendering. Long-form is one file per locale.

## Quality — what "done" requires

- Lint and type-check clean, unit coverage at or above 85%, a green build, the SonarCloud gate.
- **The end-to-end suite (Playwright) proves nothing working broke** and covers every implemented
  feature; behaviour added without its regression is not done.
- **Observability in the shape this repository has**: analytics, the client error surface, and a build
  and prerender smoke (routes render, metadata in the served HTML). No server, so no server telemetry.
- **Security by design**: least-privilege pipeline roles per job, no secrets in the repository, a
  minimal static surface. Rigor scales with blast radius.
- **A green pipeline is not the review**; the gate judges whether the change is right.

## The routes

Public URLs carry a locale prefix (ADR-0036), and **the path decides the language** regardless of the
browser, so a shared link keeps its language. Unprefixed sub-paths are client-side redirects only: not
prerendered, **never** in the sitemap or alternate-language metadata. **Two exceptions** (ADR-0052): the
bare root, prerendered in English, in the sitemap, the default for a crawler without scripting; and the
bare article path with the English slug, the neutral share address every social post carries —
prerendered in English, self-canonical, in the sitemap, its article's default.

**`apps/fed/scripts/routes.mjs` is the source of truth for the route set; read it before assuming a
route exists, and keep no route list anywhere else.** The surfaces:

- **Landing** — the storefront; it hosts the articles list, and the old blog index redirects there.
  Article slugs are **per locale** (ADR-0037).
- **Interactive CV** — the only CV surface; a two-page edition is printed from it at build time
  (ADR-0034). Both derive from `apps/fed/src/data/profile.ts`; nothing is re-typed.
- **Portfolio** — typed data in `apps/fed/src/data/catalog.ts`; the bar to be listed is
  `docs/catalog-ready.md`.
- **Ramp-up plan and architecture page** — markdown, both locales.
- **Library** — typed data in `apps/fed/src/data/library.ts`; its empty state is live copy kept under
  test; its slug is not localized. Where it and the ramp-up plan name the same book they agree on facts
  (title, URL, finished status), never on prose.

**The prerender is not a visitor.** It snapshots one en-US browser and serves that HTML to everyone, so
anything rendering off the *visitor* (language preference, stored state, viewport) rather than the
*route* must opt out through `window.__PRERENDER__`. A post-mount check does not: the snapshot is of a
hydrated page. The exemption is *identical for every visitor*, not *does not render*.

## Architecture and structure

- **`apps/fed/`** — the application (React, Vite, TypeScript, its own Tailwind, no PWA shell): typed
  data in `apps/fed/src/data/`, the route generator in `apps/fed/scripts/`, the end-to-end suite in
  `apps/fed/e2e/`. The build prerenders every route in both locales from the local preview server.
  **Never add a nested brief under this file's name**; a duplicated pair here drifted 118 lines in
  three weeks.
- **`iac/`** — storage, the CDN and its URL-rewrite function, email records, pipeline identity roles,
  and an account-wide cost budget scoped wider than this project on purpose. State in Terraform Cloud,
  local execution, one environment at the apex; the web firewall was retired. **`iac/cloudfront-functions/`
  is application logic**, gated by both `app` (behaviour) and `iac` (the edge running it): a gate
  follows what a file is, not its directory (ADR-0018).
- **`docs/adr/`** — the decision library and **the architecture documentation**. Its README is the
  index and the count; write no count elsewhere. **Read the relevant record before changing anything
  it decides.** Also `docs/catalog-ready.md` and `docs/iac-deploy-policy.md`.
- **`.github/workflows/README.md`** — the pipeline map. **Read it before changing a workflow.**
- **`VERSION`** — numeric SemVer, no suffix. The deploy's first job bumps the patch on every merge,
  tags and releases, because the footer renders it. A deliberate minor or major is the same job run by
  hand with its part input (ADR-0044). The `bump:` commit is loop-guarded.

## The private layer

This repository is **the one place the owner's professional presence is maintained from**; the site is
one surface of several. Positioning, each surface's canonical copy and the sync playbook live in a
**private, version-control-ignored directory at the root**, named in the ignore file. Absolute rules:

- **Read its positioning and surfaces files before writing any public copy** — site, READMEs, profile,
  CV. Never write positioning from memory.
- **Never commit, quote, paraphrase or move anything from it into a public surface** — repository,
  issue, merge request or comment.
- **A positioning change reaches every surface in one batch**, and the surfaces file is updated to
  what shipped.
- **Writes to external public surfaces are ask-first.**
- **Tool servers for this workflow are registered in your harness's per-user local scope**, never in a
  committed configuration file.

## Fixed decisions — do not reverse without discussion

- **Static site, no backend**; content in the repository, prerendered.
- **The application owns its styling** (ADR-0007): no component library, one theme, no PWA shell.
- **The visual identity is deliberate — confirm before changing any of it** (ADR-0008): **no
  light/dark toggle**; near-black `#0A0A0A`, off-white `#F5F4EF` and **one** accent, safety orange
  `#FF5A00`; a self-hosted display face and monospace face; **zero radius, no shadow, no gradient**,
  enforced in the styling scale. The one exception, a round portrait, has its own named utility.
- **Pipeline identity is pinned to the repository's immutable subject**, never its name. Role
  identifiers are environment secrets; tooling tokens are repository secrets.
- **The practice's vocabulary lives in the private positioning file**; read it before naming the
  practice. *agent-driven* is retired from reader-facing copy.

## Merge classes

**Loop model: `trunk-single-env`** — one branch, one environment, merge request to `main` to deploy.
The integration-branch and staging half of the platform's loop skills does not apply; where a platform
skill and this file disagree, this file wins.

The merge **is** the deploy, and the quality-assurance gate holds it. It runs on every merge request,
verifies the Definition of Done with evidence, then merges the **safe class** or escalates the
**boundary class** to the owner (ADR-0003 and its amendments are operative; read them to classify).

- **Safe:** docs, dependency bumps, tests, in-pattern work on an approved spec, the whole `product`
  backlog **including what a reader sees**, an amendment that decides something, and a record
  correction that only points at a ratified decision.
- **Boundary:** a merge touching `iac/` (confirm the plan first); anything threatening the site's
  continuity; any change to how work is decided; **publishing an article** (the owner's voice).
- **Unclear means boundary.** The gate never merges an expansion of its own authority. The owner
  ratifies by commenting on the merge request and the gate verifies that comment; a relay is never the
  authority.
- **`reader-facing` is an ordering and lens signal, not a gate**; the gate still dispatches the product
  lead's copy lens on such a diff.

**Known residue:** social scrapers pin the first card they fetch, so a wrong unfurl stays wrong on an
already-shared post. Bounded and accepted.

## How to ask

**Rule 1 governs every ask directed to the owner — decisions and actions, inside or outside work in
flight.** A design conversation or an ad-hoc request is not thereby an escalation. Rules 2–5 govern
form only where their act applies; an interview remains distinct: it elicits without options.

1. **One owner ask per activation or message.** Two is a list and he rebuilds context twice. Ask or
   order the first; preserve every remaining ask until after he
   answers, then carry the next to its own activation. Never move the remainder into a prose
   or numbered list: where a surface shows only the first, the rest silently never reached him.
2. **The interruption is a tweet; the context lives in the OPTIONS**, each stating its consequence in
   its own visible text. Reasoning goes in something he can open.
3. **Enumerate the choices with their consequences; four is a ceiling.** Use a structured multiple-
   choice presentation where your harness has one, prose where not. An open question in place of a
   reduction you owed is the failure.
4. **An act you cannot perform — a merge above all — is an order and a link, not a question.** If there
   is no second option you would defend, it is one line: the act and the object. The tell: every option
   is the same act at a different time.
5. **An interview takes NO options; an escalation always does.** An interview draws out what he thinks;
   an escalation asks him to settle what you already reduced.

**Rule 4 was built as an automatic control and removed — do not rebuild it.** It classified by label
spelling, not choice shape. **A preventive control whose false positives are invisible to the person
it protects is worse than none.** Rules 2, 4 and 5 are held by review. The sibling repository's brief
carries the same five rules; the rules must agree, never the characters.

## How work is dispatched

The main session hands each piece of work to the profile that owns it; profile briefs live in the
sibling repository. **The list is the whole live roster**, checked by the `app` workflow against the
sibling's profiles. Retired names (security reviewer, harness reviewer or lead, plain writer, plan
reviewer, principles guide) fail when invoked.

<!-- roster:dispatch -->
- **`tech-lead`** — decisions against the principles and records; writes product and system records.
- **`product-lead`** — what to build next; whether published copy is true.
- **`developer`** — builds a slice end to end against an approved spec.
- **`content-writer`** — drafts articles, site copy and social posts in the owner's voice; never posts.
- **`content-reviewer`** — repairs that draft in place, at most two rounds, quoting the voice standard or the source; never posts. No copy block on the content lane.
- **`quality-assurance`** — the merge gate: delivery and production lenses, permission floor, supply chain.
- **`agents-lead`** — the machinery (hooks, configuration, briefs, plugin); may build what it reviews, never merges or gates.
- **`scrum-master`** — which profile acts next, and whether rites ran in order; holds no tools.
<!-- /roster:dispatch -->

**Every dispatch is a fresh instance.** Never carry an instance across issues, nor the builder's
instance into review; proposing and building are separate dispatches too. The agents lead may both
build and review a `loop` item, but in two contexts, because a verdict attests the diff the reviewing
context holds.

## Standing rules

Each is true on a harness with no hooks. Mode values and the work-in-progress bound are in
`docs/loop-mode.md`.

### Git, forge and reporting

1. **Merge with a real merge commit; never squash, no rebase-merge unless he asks.** Commits are the
   changelog. If only squash is permitted, report it.
2. **Reference an issue as `Refs #N`; never put a closing verb (close, fix, resolve, any tense) in the
   same clause as an issue number, even negated** — the forge closes on merge. The closing set read
   from the body cannot see commits, so check the range:
   `git log <merge-base>..<head> --format='%B' | grep -inE '\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\b[^.]{0,20}#[0-9]+'`
3. **Undo a change by reversing it, never by restoring the whole file**, which discards every unstaged
   edit. Commit the good state before breaking something to test it.
4. **Address a repository explicitly** (`git -C <path>`, a repository flag after the subcommand); never
   change directory inside a compound command. Several checkouts can be live at once.
5. **Scratch never goes to a shared system temp directory or inside `.git`**; with no scratchpad, ask.
   Verdicts go to the merge-request comment; interview transcripts and source material to the private
   directory; a probe worth running twice is a spec under `apps/fed/e2e/`, else nothing; an isolated
   checkout is a `git worktree` with its own install. The application's old scratch directory is
   retired and deliberately not ignored, so writing there fails lint.
6. **Never sleep-and-poll a pipeline or an agent.** Push, say checks are running, check once for the
   exact commit by full identifier; wait for a dispatched agent once, blocking, with the longest
   timeout. Every check re-sends your whole context.
7. **A merge-request link reaches the owner only when it is ready to merge** — every check passed and
   the gate's verdict at head leaves only his act. Before that, report in prose by number. A link is
   the browser address, never a command for him to run.
8. **A failed check is yours to fix**: send it back to the builder with the job and cause until green,
   unless only he can decide it (then *How to ask*).
9. **What you need from him goes first, labelled as a request.**
10. **His decision lands on the item it decides when he makes it** — a comment carrying his words.
    Relaying it into a dispatch is not recording it.

### The queue

11. **An item he opened is never closed on an agent's advice**; a lead withholds `ready` instead.
12. **Several asks at once become one tracked item each before anything is built.**
13. **Every eligible `loop` item is worked before any eligible `product` item**, in every mode.
    Eligible means in the pool `docs/loop-mode.md` defines for the mode in force — read the predicate,
    not a paraphrase. Every pool requires `ready`; none filters `blocked`.
14. **`content` is selected by him one piece at a time, never drained.** Its intake interviews him, in
    his words, one question at a time, without options.
15. **The pool spans both repositories.** Read the mode of record before any pool query and never infer
    it from a result: an empty active milestone ends an iteration in one mode and means nothing in the
    other, with byte-identical output. At drain entry, compare both repositories' mode records and stop
    on a disagreement.
<!-- review-chain-routing -->
16. **Review is routed by type.** `loop`: one agents-lead lens pass plus the gate. `product`: the leads'
    lenses as warranted plus the gate. `content`: writer drafts, reviewer repairs in place (two rounds
    at most), plus the gate. The gate runs on every merge request under both lenses; routing never
    narrows a criterion, removes a hold or changes a verdict literal, and the reader-facing copy
    criterion fires regardless of type. A lens the row does not name needs its reason in the dispatch.
    A lens's stop condition bounds a pass; routing bounds the passes; no rule keys on a round count.
    Intake: `loop` closed by the agents lead alone, `content` by the product lead alone, `product` by
    both leads.
<!-- /review-chain-routing -->
17. **A read-only dispatch gets its own worktree whenever a build may be running.**

### Building, investigating, acting

18. **Before changing the loop, re-derive its state model**: types, states, the role at each
    transition, and the artifact that records it.
19. **Before relying on a check, break its subject, see red, restore, see green.** Mutate the thing
    checked, never the checker (engineering-standards skill). **A true answer that closes the inquiry
    is the failure**: on a repeating symptom, *be more careful* means keep digging for what made the
    rule unreachable.
20. **Do not assert an unmeasured premise in a dispatch brief.** Carry the command, or mark it a premise
    to verify; mark any justification briefing-only. **Do not ask a dispatched profile to re-read a
    file it already carries, nor re-read one yourself**; if stale, read only the section and say why.
    **Evaluate a machinery change against every harness that runs sessions here.** Secret scope and
    name follow the devops skill's single standard.
21. **The orchestrator — the main session the owner talks to — only dispatches and never edits a
    repository file.** On the `loop` lane **he decides `ready` and the orchestrator applies it once
    aligned**, his words recorded on the item; no dispatched profile applies it. Elsewhere `ready`
    follows the intake that closes the description.

### Loop mode, parallel development, the serial gate

<!-- loop-mode-contract -->
22. **A mode names a known agile method and fixes only what the iteration container MEANS and which
    rites run at its edges**; value, enum and predicates are in `docs/loop-mode.md`. `scrum`: the
    milestone is a commitment, a limb of the pool whose exhaustion ends the iteration and hands off to
    review, retrospective and planning; ranked at planning. `kanban`: the same milestone is a period
    label bounding nothing, no rite at a boundary, arrival order with `loop` first. The milestone exists
    in both; nothing enters a running iteration automatically; composing one is his act. **A mode
    selects a predicate and a rite set, never a permission rule**: it may not touch the permission
    floor, the gate and its lenses, head-scoped verdicts, only-the-owner-opens-work, the readiness bar
    (`sp:N` in both modes), the routing labels or the container's existence; `content` has no second
    mode. A rite trigger keys on elapsed time, never on an empty pool. A mechanism that needs the mode
    is reviewed before it is written.
23. **Development parallelises; review does not.** One merge request in review at a time whatever
    `wip:` says; the next goes to the gate only after the previous merged or was sent back. **Rebase
    onto the current trunk before the gate**, asking *has the trunk moved since the head I attested?*,
    not only *does a named branch overlap?*. The author resolves conflicts at merge-request time. The
    sequence in an iteration is the machine's: the scrum master proposes, the orchestrator opens
    worktrees and dispatches, no per-item approval. Remove a slice's worktree after merge.
<!-- /loop-mode-contract -->
24. **A gate dispatch names the merge request by number, positionally** (`gh pr merge <number> --merge`);
    with no reference it resolves to the current checkout's branch, possibly another slice's.
25. **A harness diff needs an agents-lead verdict marker whose commit line names the merged head in
    full forty characters**; an older head's marker attests a diff it never read. The gate checks it.

## The pipelines

Workflows are named after the directory they gate; the map is `.github/workflows/README.md`.

- **`app`** — dependency audit (blocks high and critical production advisories, ADR-0021), lint,
  types, unit tests with coverage, build, end-to-end, SonarCloud, harness drift, behind one aggregator
  whose name branch protection fixes.
- **`iac`** — credential-free policy scan and format check, then the plan, the only job with a cloud
  token.
- **`github`** — workflow and shell linting, separate so another workflow's syntax error cannot stop it.
- **`brief`** — this file's mechanical properties.
- **`deploy`** — on push to `main`, skipping `bump:` commits: release, gate, apply and publish, then
  end-to-end against the live apex, which is not a gate — red means the site is broken.

**Every merge-request workflow runs on every merge request and filters inside the job**, since a
workflow-level path filter can never be a required check, and ends with a notice saying whether
nothing matched, a step failed, or what ran. A check that matched nothing must not read as passed. The
merge request carries every check that can be true before merge; only post-deploy-only assertions live
in the post-deploy smoke. **`main` is the working branch**: no tooling may block edits by branch.

## What is checked

A gate asserts this file is **tracked**, **under the byte budget**, **free of declared single-harness
tokens outside the labelled section**, that **its repository-relative paths exist**, that **no
competing root brief is tracked**, and that the five *How to ask* commitments are present. **No check
can assert the brief is TRUE, or that a sentence is neutral rather than token-free** — nor that text
inside a harness subsection belongs to that harness; review holds those. Test: *would this sentence be
true on a harness with no hooks?* Counts age; derive them.

<!-- harness-specific -->
## Harness-specific instructions

Each subsection applies only to the harness it names and relaxes nothing above.

### Claude Code

- **This file loads only as a fallback.** Measured on `2.1.296` (2026-10-11, headless, no tools): alone
  it loads; a root CLAUDE.md, a .claude/CLAUDE.md, a CLAUDE.local.md or a CLAUDE.md in any ancestor
  directory each **replace** it entirely. The gate refuses the three tracked forms; an untracked local
  file or an ancestor file is invisible to it, so never create one here or above this checkout. On
  `2.1.263` (#409) a skill body did not reach the main session (only name and description) and an
  added working directory did not bring its root brief; the second is unmeasured for this filename.
- **The plugin.** `.claude/settings.json` enables `tadeumendonca-skills`, whose `PreToolUse` guard
  denies push or merge to `main`, `terraform apply`/`destroy`, cloud mutation, force-push, `rm -rf` and
  secret writes. Never use `--dangerously-skip-permissions`. Nothing bounds work in progress or the
  serial gate: opening a merge request is allowlisted.
- **Pickers.** *How to ask* rule 3 means `AskUserQuestion`, never prose numbering; headless (`claude
  -p`) lacks it and degrades to prose silently, so escalate only from interactive sessions. The
  plugin's one-question guard denies two or more questions in one call. Its link detectors decide
  *whether* a merge-request link may go; rule 4 decides the form.
- **Verdict markers** are merge-request comments carrying `harness-lead-verdict` and a `commit:` line;
  the plugin's zombie-loop detector reports all-stale markers on `Stop`, one turn late, denying nothing.
- **Sweep origin.** `.claude/settings.json` declares `.env.HARNESS_SWEEP_ORIGIN`, which bounds the
  plugin's browser server and which the sprint-review rite's first probe compares. Read it only with
  `git -C <consumer> show HEAD:.claude/settings.json | jq -r '.env.HARNESS_SWEEP_ORIGIN // empty'`;
  empty means the rite stops. It must cover every generated route URL and takes effect after restart.
  **No additional directories are declared** (#683: the origin bound in 2 of 12 trials with the
  sibling declared, 12 of 12 without); reach the sibling only through `git -C`.
- **Tool servers**: `claude mcp add -s local`, never a committed project file.
- **The `claude` workflow** answers explicit mentions; the review gate is the quality-assurance
  profile, and the automatic app review is retired.
- **`apps/fed/CLAUDE.md`** is a per-directory guide only this harness reads; outside #721.

### Codex

- **The budget's smallest measured consumer.** `0.155.0-alpha.16.3` defaults `project_doc_max_bytes`
  to 32768 and truncates the rest; measured live 2026-10-11 with nonces before and after that offset.

### Kiro

- `1.0.437` loads this file as always-on steering and truncates at 50,000 characters, logging the loss
  only on a debug channel (read from the shipped bundle, never run authenticated).
<!-- /harness-specific -->
