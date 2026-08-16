# 0043. The dev-loop inventory is derived from the plugin repo — a committed manifest plus a cross-repo drift check, and the manifest may not say "denies" about a thing that only advises

- **Status:** accepted
- **Date:** 2026-08-03
- **Deciders:** the owner
- **Supersedes / superseded by:** —
- **Driven by:** Issue [#318](https://github.com/tedeuxx/tadeumendonca-io/issues/318) (the dev-loop
  components diagram) · constrained-by [ADR-0002](./0002-fully-static-spa-no-backend.md) and
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) (nothing fetched, at build time or at runtime)
  · follows the drift shape of [ADR-0040](./0040-build-time-mermaid-diagrams.md) and of the decision
  index (`apps/fed/scripts/adr-source.mjs`) · applies
  [ADR-0015](./0015-oidc-immutable-subject-least-privilege.md)'s reasoning to a CI path filter

## Context & problem
`/architecture` already carries a **flow** diagram — how work moves through the loop, and where the human
sits (ADR-0040's 2026-07-30 amendment). What the page has never carried is the **inventory**: what the
loop is *made of*. That inventory is the strongest evidence for the page's hardest claim — that this is a
methodology someone else could adopt rather than something bespoke — and today the page asserts it in
prose and shows none of it.

The inventory's source of truth is **`tadeumendonca-skills`, a different repository**, which this repo's
build does not contain. That is the whole problem. Every other generated artifact on this site reads from
somewhere inside this repo: `diagrams.json` from the markdown bodies, `adrs.json` from `docs/adr/`. This
one cannot.

**The motivating evidence is that the specification for this very slice was already wrong in three
fields.** #318's own comment, written 2026-07-31, states the inventory as *19 agent personas*, *3 hooks*
and six command families. Read against the tree on 2026-08-03:

| claimed | actual | why it drifted |
|---|---|---|
| 19 personas | **6** — `developer`, `marketing-lead`, `product-lead`, `quality-assurance`, `security`, `tech-lead` | the plugin's own ADR-0002 amendment #7 cut the roster; thirteen personas that generated no conflict were absorbed |
| 3 hooks | **4** — `permission-guard` + `wip-guard` on `PreToolUse` (matcher `Bash`), `session-wip` + `session-plugin-version` on `SessionStart` | `session-plugin-version` was added and nothing anywhere counted it |
| "seven command families" | **6 namespaced families** (`architecture` 1, `backend` 20, `frontend` 18, `infrastructure` 21, `principles` 5, `workflow` 9 = 74) **plus one un-namespaced command**, `commands/autonomy-on.md` | a top-level command belongs to no family; counting it as a seventh makes a category out of an orphan |

**The three-hook figure is the important one, because it was not the issue author's error.** It is copied
faithfully from the plugin's **own README diagram**, which draws `H1` `H2` `H3` and omits
`session-plugin-version` entirely. And the plugin has a real inventory guard —
`hooks/scripts/inventory-counts.test.sh`, run by `docs-test.yml` — which pins persona and skill counts
across four documents and **covers hooks nowhere**. Its trigger filter is
`agents/** · commands/** · README.md · CLAUDE.md`, so adding a hook does not even start it.

That is the argument for this mechanism in one sentence: **the number was wrong at the source, the
mechanism standing next to it could not see it, and it propagated into a specification for a public page
without anyone doing anything careless.** A dated stamp on a hand-typed table would have recorded the
date on which those three wrong numbers were copied.

## Decision drivers
- **The page's thesis is checkability.** Every other claim on `/architecture` resolves to something a
  reader can open. An inventory that resolves to "someone typed this once" is the one paragraph running
  on a different rule than the rest of the page — and ADR-0040 already records the general form: a stale
  diagram is *worse* than an absent one, because a picture reads as current in a way prose does not.
- **Nothing is fetched, at build time or at runtime** (ADR-0002, ADR-0004). Whatever the reader gets
  ships in the artifact, and the artifact is built from files in this repo.
- **A path added to the deploy gate's filter widens a credential surface.** `deploy`'s gate outputs
  decide whether an OIDC-credentialed job runs; `.github/workflows/README.md` treats every entry there as
  a security decision, which is ADR-0015 applied to a filter. This mechanism must not go near it.
- **Drift must be red, in a build, naming the thing** — the shape both `diagram-source.mjs` and
  `adr-source.mjs` already use.
- **The claim the picture makes must be no stronger than the mechanism behind it.** Hooks deny before a
  tool runs; CI gates block a merge; **personas only advise**, and this repo's own guide says an
  undispatched lens *fails silently, with nothing mechanical behind it*. A diagram drawing both with the
  same arrow would assert a mechanism that does not exist.

## Considered options

### Where the inventory's source of truth lives
1. **A generated manifest, committed in-tree, with a drift check against the plugin repo** (chosen). The
   build reads only the manifest — identical in kind to `adrs.json` and `diagrams.json`, and nothing about
   `vite build` changes. The sibling repo is read by a **generator** and by a **check**, never by the
   build. *Trade-off:* a second repo can now turn this repo's build red, which is a departure recorded in
   full under **Consequences**.
2. **A hand-typed table with an "inventoried on `<date>`" stamp** — the cheaper option, and the one the
   owner rejected. *Why not:* the table above is the counterexample, produced by this very issue. A stamp
   makes staleness *legible* and does nothing to make it *detectable*; the reader who is being asked to
   believe the loop is adoptable is handed a date and told to discount accordingly. It also fails the
   page's own standard, which is why `/architecture` links canonical detail instead of restating it.
3. **Read the sibling repo at build time** — a git submodule, an npm dependency on the plugin, or the
   GitHub API. *Why not:* it puts a network or a second working tree into `npm run build`, against
   ADR-0002/ADR-0004, and it makes the **deploy** fail for a reason that has nothing to do with this
   repo. A submodule is the subtlest of the three and the worst: it pins a commit, so the page goes stale
   *silently* at whatever revision the pointer last moved to — the failure mode this decision exists to
   remove, wearing the clothes of a solution.
4. **Derive from the plugin's published documents** — its README diagram or its `inventory-counts`
   assertions. *Why not:* **demonstrably wrong today.** The README diagram omits a hook, and the
   assertion suite covers personas and skills only. Deriving from a document that is itself unchecked
   copies its defect into a second surface and adds a mechanism that certifies the copy.

### Where the drift check runs, and which repo owns it
1. **In this repo's `app` gate, with the plugin checked out as a second, tokenless checkout** (chosen).
   The plugin is a **public** repository, so `actions/checkout` needs no credential and no secret; the
   check therefore widens no credential surface, which is the property that makes it acceptable at all.
2. **A reciprocal check in the plugin's CI** — the plugin's own PR gate asserting that this repo's
   manifest still matches. *Why not, and this is a recommendation as much as a rejection:* it inverts the
   dependency. The plugin is the **methodology** library — the test for what belongs in it is *does this
   constrain any project using the plugin, or only this product?* — and a gate asserting that
   `tadeumendonca.io`'s architecture page is current is purely the latter. It would mean the plugin
   cannot merge while a named consumer is stale, which is a consumer holding a veto over a library, and
   it does not generalise: a second consumer makes it two checks, and a fork makes it unanswerable.
   **The lateness this leaves is real and is accepted below**, with a mitigation aimed at the part that
   actually hurts.
3. **`repository_dispatch` from the plugin to this repo on merge** — *Why not:* it needs a cross-repo
   **write** token held in the plugin, which today holds no credential of any kind. It buys timeliness by
   creating exactly the standing secret ADR-0015 exists to avoid, in the repo that currently has the
   smallest surface of the two.
4. **A scheduled run in this repo** — cron, tokenless, same check. *Why not now:* a scheduled red has no
   PR to land on and no author to act, so it converts "a stranger's PR goes red" into "a notification
   nobody owns". Recorded as the **cheap upgrade if the lateness ever actually bites**, since it costs one
   workflow trigger and no new decision.

### What the manifest is allowed to assert about a component
1. **A closed `enforcement` set — `denies` · `advises` · `documents` — with an unknown value throwing**
   (chosen), the same shape `parseStatus` uses for ADR status classes and for the same reason: a fifth
   value is either a typo or a change to the practice, and neither should quietly become a diagram node.
   `denies` is for the two `PreToolUse` hooks, which refuse before the act — and **for nothing else in
   the manifest**. The CI gates deny too, and they are deliberately **not manifest rows**: they live in
   this repo's `.github/workflows/`, not in the plugin, so a row for them would be an authored claim
   wearing a derived artifact's clothes. They are already drawn, as *Mechanical gates*, in the flow
   diagram this one complements. Hooks are classed by their **event**, not by being hooks: the two
   `SessionStart` hooks carry `documents`, because a hook that runs once at session start has no tool
   call to refuse. `advises` is for all six personas, and it is a claim about the **judgement** they
   produce — nothing checks a judgement. It is **not** a claim that they have no mechanical standing:
   `permission-guard.sh` rule 7b refuses `gh pr merge` from every `agent_type` except
   `*:quality-assurance`, so *who* merges is enforced while *how well they reviewed* is not. `security`
   is weaker and must not be flattened into the same sentence — nothing forces it to be dispatched at
   all. `documents` is for the command families, which neither deny nor advise; they remove a
   re-decision.

   *(Amended 2026-08-04: `advises` is for **every** persona — the count that stood here went stale on a
   roster change it does not govern. See the amendment below.)*

   *(Amended 2026-08-11: `documents` is for the command families **and for the skill library**, which is
   a fourth **kind** — not a fourth enforcement value. `skill-library` entered the closed set of kinds in
   [#428](https://github.com/tedeuxx/tadeumendonca-io/pull/428) with no amendment here, and this is where
   that omission is repaired. The `enforcement` set is untouched and stays closed at three. See the
   amendment below.)*

   *(Amended 2026-08-06: the classing rule stands — `hook:SessionStart` still maps to `documents` — but
   the **reason** given for it does not generalise. A `SessionStart` hook has no tool call to refuse and
   may still **act**: `session-scratch.sh` empties `.scratch/` before the session begins. The set stays
   closed at three and the page's prose narrows instead. See the amendment below.)*
2. **One uniform "component" shape with no enforcement field** — *Why not:* the diagram would then draw a
   shell script that refuses a tool call and a persona that someone has to remember to dispatch as peers.
   That is not a drawing preference; it is the page making a safety claim it cannot support, on the one
   page whose credibility rests on declining to do that.

## Decision outcome
Chosen: **`tadeumendonca-skills` is the source of truth for the dev-loop inventory; this repo carries a
committed manifest generated from it, and CI fails when the two disagree.**

**The build never reads the sibling repo.** A generator (`npm run gen-harness`, by the naming convention
of `gen-adrs` / `gen-diagrams`) reads the plugin tree — `agents/*.md` frontmatter, `hooks/hooks.json`,
`commands/` — and writes a committed manifest under `apps/fed/src/content/generated/`. Everything
downstream of that file behaves exactly as it does for `adrs.json`.

**What is derived and what is authored, stated precisely because the check only covers the first.**

- **Derived** (compared against the plugin, three ways): each persona's `name` and file; each hook's
  script name, event and matcher; ~~each command family's directory and file count~~; and the un-namespaced
  command. Identity and shape.

  *(Amended 2026-08-11: the struck clause described a **walk of the plugin's tree**, and the library it
  walked no longer exists in that form. At this head the manifest carries **zero `command-family` rows**
  and one `skill-library` row whose count is read from the plugin's own `skills` **declaration** in
  `.claude-plugin/plugin.json`. Derived-from-a-walk and derived-from-a-declaration are different
  warrants; the clause is struck rather than edited because the old warrant is what this record argued
  for. See the amendment below.)*
- **Authored in this repo:** the short label a diagram node can carry. The plugin gives personas a
  `description` in frontmatter, but they run to a paragraph — `tech-lead`'s is six lines — and hooks
  carry no description field at all, because `hooks.json` is a wiring file. So the gloss is written here.
  **The check compares identity, never description**, which is the same honest limit ADR-0040 records
  about its own guard: the guarantee is *"the source exists and is unchanged"*, not *"this artifact
  describes it correctly"*.

Adding a description schema to the plugin so the gloss could be derived was considered and **deferred**,
not rejected: a hook's one-line purpose is a methodology fact and would sit legitimately in that repo.
It is deferred because introducing a schema there to serve one consumer's page is option 2's inversion in
a milder form, and because the drift it would close is small next to the drift this closes.

**The drift check runs three ways, and this is not negotiable — `missing`, `orphaned`, `changed`.**
`adr-source.mjs`'s comment already records why: a set comparison alone misses the likeliest case, which
here is a persona **renamed** or a hook **re-pointed to a different event** — present on both sides,
different in a field. Both gatekeepers independently found the equivalent field omission on the ADR
index; it is not a hypothetical.

**The `autonomy-on.md` case is handled explicitly rather than filtered away.** A command that is in no
family is a real shape in the plugin — the plugin's own suite asserts `root_cmds -eq 1` so that a second
one goes red *(amended 2026-08-04: it now asserts `-eq 2`, because a second one arrived and this went red
exactly as predicted — see the amendment below)* — and a generator that walks only the directories drops
it without a word. The manifest
carries it, and a second un-namespaced command must fail rather than disappear.

**The cross-repo dependency is isolated in one CI job, and deliberately kept out of `npm test`.** The
pure half — *given this tree, does the manifest match* — is unit-tested against fixtures in `vitest`,
like `adr-source.test.mjs`. The **live** comparison is its own job in the `app` workflow with two
checkouts. The reason is that `npm test` must not require a contributor to have a second repository on
disk; a gate that fails for a missing sibling teaches everyone to ignore the gate.

**Where the plugin is absent, the check reports SKIPPED and never PASSED.** This is the same rule
`e2e/edge-rewrite.spec.ts` follows (#216): a check that could not run must not read like one that did.
In CI the checkout is unconditional, so the skip path exists for local runs only.

**This does not go into `deploy`'s gate filter, and that is a security decision, not a noise one.** The
manifest lives under `apps/fed/`, which the `code` filter already matches, so a regeneration is gated by
the ordinary path. Nothing here needs an entry anywhere near the workflow whose outputs decide whether an
OIDC-credentialed job runs.

**And one thing this mechanism cannot have, said plainly: it is not self-triggering.** When `docs/adr/**`
was added to the `app` filter, the fix for "the guard never runs on its own trigger" was to name the
authored source as a path in this repo. **There is no such path here.** The event that falsifies this
manifest happens in another repository, and no filter in this one can match it. That is the asymmetry,
in its mechanical form, and it is why the next section is not a formality.

## Consequences

**Good**
- The page's hardest claim becomes checkable in the same way as every other claim on it: a persona added,
  retired or renamed in the plugin either updates this page or turns this repo's build red.
- **No credential surface.** The plugin is public, the second checkout is tokenless, and nothing touches
  the deploy gate.
- **No runtime and no build-time fetch.** The reader gets bytes from a committed file; ADR-0002 and
  ADR-0004 hold unchanged.
- The diagram is permitted to distinguish a mechanism from a convention, which is the most credible thing
  it can say — and stronger than the inventory itself.
- The generator gives the plugin's hook inventory its **first** external check of any kind. Nothing in
  the plugin counts its own hooks today.

**Bad / accepted costs**
- **This is the first cross-repo build dependency in a repo whose entire architecture is "content ships
  in the repo".** That is a real departure and it is not softened by the manifest being in-tree: the
  *artifact* stays local, the *truth* does not. Concretely: another repository can now turn this repo's
  CI red; the two repos release independently, so there is no version at which they are known to agree;
  and a clone of this repo alone can no longer verify one of its own published claims.
- **The check is asymmetric, and the failure arrives late.** A plugin PR that retires a persona is green
  in the plugin and knows nothing about this page. The red surfaces at the **next `app` run in this
  repo** — which will usually be an unrelated PR, landing on an author who did not cause it. That is
  precisely the cost `app.yml`'s `docs/adr/**` comment names, and the fix used there (make the guard
  self-triggering) is structurally unavailable, per above. **The mitigation is therefore aimed at
  attribution rather than at timing:** the failure message must name the plugin repo, say that this is not
  the reader's change, and give the one command that fixes it. A scheduled run (option 4) is the upgrade
  if this proves worse in practice than on paper.
- **A moving target.** The check runs against the plugin's default branch, so a merge over there can turn
  a previously-green PR here red with no change on this side. Pinning a plugin commit would remove that
  and reintroduce silent staleness, which is worse; this is the deliberate side of the trade.
- **Identity is checked, description is not.** A hook whose behaviour changes without changing its name
  publishes a stale gloss under a green check. Bounded, named, and the same class as ADR-0040's
  hand-editable SVG.
- **A third place a harness change has to land** — the plugin, this manifest, and the diagram fences in
  both locale editions (ADR-0040's per-locale duplication cost applies unchanged).

**Neutral**
- **`iac/` untouched.** No edge, cache, bucket or Terraform change; this is content pipeline and CI only.
- No new runtime dependency and no bytes shipped to the reader — the manifest is consumed at build time
  and rendered as text, like everything else on the page.

## What this decides for the page, beyond the mechanism
Two claims the page and the diagram are now **required** to get right, recorded here because they are
decisions about what may be asserted rather than drawing choices:

1. **Hooks and CI gates `deny`; personas `advise`; command families `document`.** They must be visually
   distinguishable, and the accessible description must carry the distinction too — an `accDescr` that
   flattens it re-publishes the false claim to exactly the reader who cannot see the arrow style.
2. **The persona lens is not enforced by anything.** The page may say the roster exists and what each
   member is for; it may not imply that dispatch is guaranteed. The honest sentence is the one this
   repo's guide already uses about itself: a lens that is not dispatched fails silently.

## Amendment, 2026-08-04 — the plugin's version is resolved at DEPLOY time, with a committed artifact as the floor

**Decides:** the plugin's released version may be derived from a tokenless checkout of
`tedeuxx/tadeumendonca-skills` and published on `/portfolio`, resolved in **two levels** — the deploy
pipeline reads it fresh and passes it to the build; a **committed artifact** is the default that local
builds, PR builds and forks render. The value is therefore never fetched by the application, at build time
or at runtime, and there is no failure branch: an unresolved override is a *default*, not an error.

**Why this shape rather than a committed value alone**, which is what was drafted first and is the wrong
answer for a reason worth naming: `-io`'s own tag is exact because there is **one clock**. `version.ts`
reads the root `VERSION` at build time and the deploy's `release` job bumps that file **in the same commit
the build consumes**. Anything that publishes a second repository's version from a committed file accepts a
**second clock** and then argues about how to live with the gap. Nothing regenerates `harness.json` when
only the plugin's `VERSION` moved, so a committed-only value would be exact as of the last time somebody
regenerated the artifact — measured on the days around this record, `tedeuxx/tadeumendonca-skills` cut **14
releases on 2026-08-02 and 5 on 2026-08-03**, so that gap reaches tens of releases within a fortnight.
Resolving in the deploy collapses it to *the moment of the deploy* (`-io` published 8 times on 2026-08-03),
which is the same clock the footer's own tag runs on.

**Class: safe.** This amendment *decides* something, and by [ADR-0003](./0003-trunk-based-single-environment.md)'s
2026-07-31 amendment an ADR amendment that decides is safe class — `quality-assurance` merges it. It is not
one of the records that decide *how work is decided*, so it does not reach the owner as a boundary.

**Driven by** Issue [#345](https://github.com/tedeuxx/tadeumendonca-io/issues/345): the `tadeumendonca-skills`
card in `/portfolio` shows the word *RELEASES* where the `tadeumendonca-io` card shows its tag.

### #329 is discharged by mechanism, not waived — and the distinction is the load-bearing sentence
`catalog.ts` records an owner decision of **2026-08-02** rejecting a third `releases` shape that reads a tag
**over the network**: a build-time **GitHub API call** can turn a healthy `main` red on rate-limiting or an
outage, and *"what does the card show when the call fails"* has no good answer, since a stale tag is worse
than no tag and a blank is a visible hole. **That rejection stands. It is not revisited, softened or
overruled here.**

What changed is the premise it was argued against — *"the build cannot read the other repo"* — and the
mechanism is a different thing from the one refused, in three respects that must be read together rather
than as a list to pick from:

- **It is a `git` checkout of a public repository, not an API call.** No token, no `X-RateLimit`, no
  authenticated quota to exhaust — the property that made the API route able to redden a healthy `main` on
  somebody else's traffic is absent, not mitigated.
- **The application never reads it.** `npm run build` reads a committed file and an environment variable,
  exactly as it already reads `VITE_GA_MEASUREMENT_ID`. ADR-0002 and ADR-0004 hold verbatim: nothing is
  fetched at build time or at runtime *by the app*, and a clone with no sibling still builds and still
  ships.
- **There is no "when the call fails" branch to answer for**, because a failure resolves to the committed
  default rather than to nothing. See Decision 4 — that is the part that closes #329's objection outright
  rather than making it unlikely.

The rejected option is still rejected; a different option now exists. **Precisely which part #344
contributed, since it is easy to overstate:** it did not build the checkout this uses — that one is new, in
`deploy.yml`, and it is a *second* instance. What #344 established is the **pattern and its safety
argument** — that a tokenless checkout of this public repository is a legitimate way for this repo to read
that one — and it proved the plugin carries `VERSION` and `.bumpversion.toml`, which is what makes the tag a
file rather than a query. Decision 5 books the part the second instance adds and #344 did not have to weigh:
this one lands in a job that holds a credential.

### Decision 1 — the floor is its own artifact, not a row in `harness.json`

`apps/fed/src/content/generated/plugin-release.json`, written by the **same** `gen-harness` run from the same
resolved `pluginDir`, carrying the plugin's `VERSION` and nothing else. It is the **default** the deploy
overrides, not the value production renders.

*Why not a row in the manifest,* which is the option that reuses a drift check already paid for: the
manifest's shape refuses it. It is a **flat array of components**, every element carries an `enforcement`
value from a **closed set that throws on anything else**, and `check-harness-drift.mjs` runs
`assertEnforcement` over **every** element. A version is not a component; giving it a class would either
throw or force a fourth class into a set this record froze deliberately, and `diffAgainstManifest` keys on
`kind:id` with a union-of-keys equality — so the row would be equality-checked, which Decision 2 shows is the
wrong relation for this value. *Why not a wrapper object* (`{ version, components }`): it breaks the
top-level `Array.isArray` guard, the three-way diff and every fixture, to move one string.

*Trade-off, named:* a second generated file is a second thing to regenerate and a second thing that can go
stale. It buys leaving the manifest's schema and its equality check exactly as this record decided them.

### Decision 2 — the deploy resolves the value; `deploy-app` gains a step, not the gate a path

`deploy.yml`'s **`deploy-app`** job takes a **second, tokenless `actions/checkout`** of
`tedeuxx/tadeumendonca-skills`, reads its `VERSION`, and exports it to the build as
**`VITE_PLUGIN_VERSION`** — the same mechanism, in the same step, that already delivers
`VITE_GA_MEASUREMENT_ID`. Production therefore renders the plugin version as of that deploy.

**Three constraints on how that step is placed, because they are decisions and not YAML detail.**

1. **The checkout and its single read run BEFORE `Configure AWS credentials (OIDC)`, and the tree is
   removed once the value is read.** This job already reasons in exactly these terms: its `npm ci
   --ignore-scripts` comment says *"the threat is persist-then-execute … it runs BEFORE Configure AWS
   credentials"*. Resolving the version first and deleting the checkout leaves nothing but a string in the
   environment by the time the deploy role exists, which makes the mitigation **structural** rather than a
   promise that nothing in that tree is ever executed.
2. **`persist-credentials: false` on that checkout.** `actions/checkout` defaults to `${{ github.token }}`
   even for another public repository and writes it into that tree's `.git/config` for the life of the job.
   `security` raised this as an advisory on `-skills`#143 and noted that **no checkout in this repo sets
   it**; this is the checkout where it matters most, being the one that lands foreign content in the job
   that assumes the AWS role. The repo-wide sweep is a separate concern and is not decided here.
3. **The checkout is `continue-on-error`, and a step prints which source won.** A failed checkout must not
   stop a deploy that is otherwise ready to ship: it falls through to the committed default and the site
   still publishes. This is the property that keeps #329's objection genuinely closed rather than moved from
   the PR gate to the deploy — *another repository's availability cannot stop this site from shipping.*
   *Trade-off:* a silently older tag would then ship, so silence is not allowed — the resolving step emits a
   `::notice::` naming the source (deploy lookup, or committed default) and the value, which puts it in the
   deploy log where a `report` line is already read.

**This adds nothing to `deploy`'s `gate` filter, and the distinction must not be conflated.** That filter's
outputs decide *whether an OIDC-credentialed job runs* — the reason this record already keeps the harness
mechanism away from it, which is ADR-0015 applied to a path filter. Adding a **step to a job the gate has
already decided to run** changes nothing about that decision: `deploy-app` still runs if and only if
`gate.outputs.app == 'true'`, on the same pathspec as before. A *path* in the filter widens what can cause a
credentialed job to start; a *step* inside it cannot.

**One consequence the implementing PR must expect:** `.github/workflows/deploy.yml` is matched by **both**
the gate's `app_hits` and its `iac_hits` pathspecs, so the merge that ships this will report `iac=true` and
run **`terraform-apply` against real AWS**. That is CLAUDE.md's ⚠️ confirmation case by effect even though
no file under `iac/` changed.

### Decision 2b — what the drift check now asserts about the version, and what it deliberately does not

The drift check is **no longer what keeps the published value fresh** — the deploy is. Its remaining job is
to keep the *floor* honest, and it does so with two assertions that are **errors or nothing**, both silent
on the normal case:

- **Malformed or absent committed value → error.** It needs no plugin tree, so it runs even on the SKIPPED
  path, and it catches the one case production cannot: with the override present, a broken default is never
  evaluated in production and would surface only in a fork's build.
- **Committed value AHEAD of the plugin's `VERSION` → error.** The generator cannot produce this; only a
  hand-edit or a bad merge can, and it names a release that does not exist, so a fork's card 404s its
  reader. Re-validating a committed file the generator already wrote is the same discipline
  `assertEnforcement` applies to the manifest.

**Committed value BEHIND → nothing at all.** An earlier draft of this amendment emitted a `::notice::` here.
It is dropped, for the reason that governs this whole family of decisions: at the plugin's measured cadence
that line would print on nearly every run, and an output that always appears is read by no one — the same
argument that refuses equality, one notch quieter. Staleness in the floor no longer reaches a production
reader, and what a fork gets is a **real, older tag**, which is the honest thing for a build that could not
consult the source.

*Given up, stated so it is not rediscovered as a gap:* nothing detects that the committed default is old.
That is deliberate. If it ever matters, this record's own option 4 — a scheduled tokenless run — is the
cheap upgrade, costing one workflow trigger and no new decision.

### Decision 3 — what the card is allowed to claim

On production the value is exact **as of that deploy** — hours, on an active day, against the tens of
releases a committed-only value would have drifted. It is still not *now*, and it is still a different
guarantee from the `-io` card beside it, which is exact at the moment the reader sees it because the file it
reads is bumped in the commit that builds it.

So the rule survives the design change, at a much smaller magnitude: **the affordance may not be read as
"the plugin's current version".** What it truthfully names is *the plugin release this build was deployed
against* — under that reading it is exact by construction, as `this-build` is.

Two consequences follow, and only the first is a wording choice:
- **Whether a visible qualifier appears on the card is copy** — `marketing-lead`'s, not this record's, and
  the window being hours rather than weeks is a real input to that call. *(Amended 2026-08-04: that call
  now routes to `product-lead`, which absorbed the copy lens — see the amendment below.)*
- **That the accessible name must not overclaim is not.** It may not say *latest* or *this version of the
  project*; `portfolio.viewReleaseTag`'s existing copy says the second of those and must not be reused.

`/architecture` already states the general form of this window in bold — *"this page can be wrong for that
whole window and will not say so"* — about the **inventory**, whose window is unchanged by this amendment
and remains as long as the interval between regenerations. The card must not contradict it, and nothing here
narrows it: the deploy-time lookup freshens **one string**, not the inventory.

### Decision 4 — the absence path is a DEFAULT, not a failure, and that is what closes #329

Resolution has two levels and no third: **`VITE_PLUGIN_VERSION` if it is present and well-formed, otherwise
the committed artifact.** Both are in the build's own inputs — one an environment variable, one a file in
the tree — so the value exists in every environment: production, a PR build, a local build, a fork with no
sibling checkout, a clone with no network.

This is the precise shape of the discharge #329 asked for and never got. Its unanswerable question was
*"what does the card show when the call fails"*, and the honest answers were all bad — a stale tag is worse
than none, a blank is a visible hole. Here **the question does not arise**: the lower level is not an error
handler, it is the default, and it holds a real tag that really exists. Nothing degrades; a less fresh
source wins.

Two rules follow, and they are what keep the second level from becoming the hiding place a fallback usually
is:

- **The consumer validates the RESOLVED value and throws at module load if it is malformed** — the shape the
  bilingual content loader already uses. The override must be treated as absent when it is empty or
  whitespace (`??` does not catch `''`, and a shell `$(cat VERSION)` can deliver a stray newline), and the
  resolved string must match `^\d+\.\d+\.\d+$` with **no `v` prefix**, since the `v` is added by the URL
  builder. A build that would ship a link to a tag that cannot exist fails instead.
- **The card grows no fallback branch of its own.** Resolution happens once, in one module; the component
  receives a string. A branch for a case that cannot reach it is where a stale value hides.

### Decision 5 — accepted cost: foreign content in a credentialed job

`deploy-app` holds `id-token: write` and assumes the AWS deploy role, which can write the site's bucket and
invalidate its distribution. Checking out another repository into that job places **content this repo does
not control in a credentialed context**, and that is a real widening, recorded here rather than argued away.

*What bounds it:* the tree is read by exactly one operation — `cat VERSION` into an environment variable —
and nothing in it is executed, imported, installed or added to the build's module graph; the checkout is
tokenless and carries `persist-credentials: false`; and per Decision 2 it happens **before** the role is
assumed and the tree is removed once the value is read, so the foreign content and the credential do not
coexist in the job at all. That last point is the mitigation that makes this acceptable, and it is a
placement, so it can be verified by reading the job top to bottom.

*What is not bounded:* the source repository is trusted in the ordinary supply-chain sense — it is the
owner's own plugin, public, and already the source of a published inventory on this site. This amendment
does not create that trust relationship; #344 did. It extends it into a job that holds a credential, which
is the incremental thing to weigh.

*Also accepted:* the artifact `app` built and Playwright-tested on the PR now differs from production by a
**second** string. This record's parent workflow already books the first — *"the PR's e2e tests an artifact
that differs from production by one string"* — and the reasoning is identical, not new.

### What this amendment does *not* decide
The reader-facing `releases` union gains a third case. That contract is documented where #329 documented it —
the field's own doc comment in `src/data/catalog.ts`, which must be updated in the same MR to record that the
2026-08-02 rejection stands and why this is not a reversal. A separate ADR for a third enum case would be an
ADR written for a routine change, which trains readers to skim the ones that matter.

**The repo-wide `persist-credentials` posture is not decided here either.** `security`'s advisory on
`-skills`#143 observed that **no** checkout in this repo sets it. Decision 2 sets it on the one checkout this
amendment introduces, because that is the one landing foreign content beside a credential; whether the other
checkouts follow is a separate finding with a separate blast radius, and folding it in would make this record
decide two things.

## Amendment, 2026-08-04 — the roster moved under the record, and the record is appended to rather than corrected

`marketing-lead` was merged into `product-lead` in the plugin (`-skills`#144), and `commands/new-issue.md`
joined `commands/autonomy-on.md` at the root of `commands/`. The published inventory therefore moves:
**5 personas** (`developer`, `product-lead`, `quality-assurance`, `security`, `tech-lead`) and **2
un-namespaced commands**. Nothing above is rewritten to match — the 19→6 table in *Context & problem* is
dated evidence about the tree on 2026-08-03 and is still true of that day; **supersede, never rewrite.**

**Class: safe.** It decides nothing new about the mechanism; it records an inventory change the mechanism
was built to carry, and re-points one routing sentence. By ADR-0003's 2026-07-31 amendment that is the
reviewer's to merge.

**Three sentences above are superseded rather than edited, and this is where they are re-pointed:**
- *"`advises` is for all six personas"* (Decision, *What the manifest is allowed to assert*) — the rule is
  unchanged; only its **cardinality** was wrong, and it carried one it never needed. The sentence keeps an
  inline pointer here rather than being edited; in `harness-source.mjs`, where a comment is documentation
  and not a record, the count is **dropped outright**. `advises` is for **every** persona, and always was.
- *"the plugin's own suite asserts `root_cmds -eq 1`"* (Consequences) — it now asserts `-eq 2`, **because
  the guard worked exactly as this record said it would**: a second un-namespaced command was a real
  change to the shape, and it went red rather than vanishing. That sentence is the prediction; this is
  its outcome.
- *"Whether a visible qualifier appears on the card is copy — `marketing-lead`'s"* (Decision 3) — that
  call now routes to **`product-lead`**, which absorbed the copy lens. The routing changed; what the
  sentence decided about the card did not.

**What this amendment does not decide, and is flagged for the owner instead.** `advises` still classes
every persona, `product-lead` included — and after the merge `product-lead` holds a **blocking veto on
published claims**. It is a judgement nothing checks and no seat enforces, so `advises` remains the honest
class and the page's *"exactly one kind can stop you"* remains literally true of **mechanism**. But the
sentence now reads one degree stronger than the practice: a lens that blocks by convention is not the same
as a lens that only advises, and the page does not draw that difference. ~~Left as-is deliberately, and
raised rather than resolved here.~~

**→ Raised here and resolved in the same PR, by `429a363`.** The paragraph above is left standing because
it is the honest record of the state before that commit — but both of its closing claims are now false:
the page **does** draw the difference, and it was **not** left as-is. The owner chose to extend to
`product-lead` the treatment the page already gives `quality-assurance` — so `/architecture` now says, in
both editions, that it **blocks by convention rather than by hook**, and that nothing refuses the merge
command on its behalf.

`advises` is unchanged as the manifest class, and that is the decision rather than an omission: it claims
the JUDGEMENT is enforced by nothing, which is true of both personas. What was missing was the page saying
that a convention-blocking lens and an advisory-only one are not the same animal.

Two options were rejected. A **third enforcement class** between `denies` and `advises` would be more
precise and would touch the generator, the manifest, every assertion and this record — and the closed set
is exactly what keeps the diagram from lying, so widening it is not a small act. **Leaving it alone** was
defensible too, since the sentence is true about mechanism; the cost is that a reader who checks the
plugin finds the difference before the page tells them, on the page that exists to be checked.

Found by the copy lens reviewing the PR that falsified it. Worth stating plainly, because it is the same
defect this whole slice exists to close: a record describing a page, made false by a later commit **in the
same pull request**, on the page that publishes this index and invites the reader to click through.

**One regression guard was added, because this failure was invisible to every existing check.** The
components test asserted *manifest ⊆ drawing* and nothing in the other direction, so a **retired** persona
left in the fence passed: the manifest lost the row, and the cross-repo drift check compares the manifest
to the plugin, never the page to the manifest. `architecture-diagrams.test.mjs` now compares the persona
node's label to the manifest's persona list **as an exact set**, in both editions.

## Amendment, 2026-08-06 — a `SessionStart` hook can ACT, so the PAGE'S PROSE narrows; the closed set does not widen

**Decides one thing:** when a `SessionStart` hook does something other than report, the **page's prose
narrows** rather than the `enforcement` set gaining a fourth value. The set stays at three —
`denies` · `advises` · `documents` — and `hook:SessionStart` keeps mapping to `documents`. What changes
is what `/architecture` is allowed to say about that class: **not** *"they only report"*, but *"they act
at session start, with no tool call to refuse"*.

**Class: safe.** It decides how a page may word a claim; it changes no mechanism, no schema and no
generator behaviour. By [ADR-0003](./0003-trunk-based-single-environment.md)'s 2026-07-31 amendment an
amendment that decides is `quality-assurance`'s to merge, and this is not one of the records that decide
*how work is decided*.

### The sentence this re-points, and why its reasoning stopped holding

In *What the manifest is allowed to assert about a component*, option 1:

> Hooks are classed by their **event**, not by being hooks: the two `SessionStart` hooks carry
> `documents`, because a hook that runs once at session start has no tool call to refuse.

**The classing rule survives verbatim; its stated reason does not, and only for the second clause.** "No
tool call to refuse" is still true — a `SessionStart` hook is not handed a tool invocation and cannot
return a denial. What was smuggled in beside it, and never argued, is that having nothing to refuse
implies having nothing to *do*. That inference was sound about every hook this record was written
against, because on 2026-08-03 both `SessionStart` hooks printed a line and exited.

It is not sound in general, and the plugin now has the counterexample. `hooks/scripts/session-scratch.sh`
runs on `SessionStart` and **empties `<repo-root>/.scratch/` on both enumerated repositories** —
`find "$scratch" -mindepth 1 -delete`, a recursive delete of the user's files, executed before the
session begins. It refuses nothing. It reports afterwards. It is not a `documents` component in any sense
a reader of that word would recognise.

*Checked, not assumed, on 2026-08-06:* the script and its `-mindepth 1 -delete` are on the plugin branch
`feat/scratch-is-ephemeral-per-session`; `apps/fed/scripts/harness-source.mjs` maps
`'hook:SessionStart': 'documents'` in `ENFORCEMENT_BY_SHAPE`, keyed on the event with no per-script
branch, so the generator will class it `documents` with every check green.

**That is the failure this amendment exists to pre-empt, and its shape is the point.** Nothing breaks.
The generator emits a well-formed row, the drift check passes, the diagram tests pass, and the page
publishes — in both editions, under a fully green build, by a mechanism working exactly as designed —
that the `SessionStart` hooks *only report*. A false claim on the one page whose thesis is that its
claims are checkable, produced by the checking machinery rather than in spite of it.

### The rejected option: a fourth enforcement class

**A fourth value** — `acts`, or some sibling of it, for a hook that changes state without refusing a
call. It is the more precise answer and it is refused for the third time in this record, on the reason
that has not changed: the closed set is what keeps the diagram from lying, so widening it is not a small
act. It would touch the generator, the manifest, `assertEnforcement`, every fixture, the drawing's edge
styles and the `accDescr` in both editions — and it would buy a distinction the prose can carry for the
cost of one sentence.

There is precedent directly on point rather than by analogy. This record's 2026-08-04 amendment faced the
same fork over `product-lead` — a lens that **blocks by convention** classed `advises` alongside lenses
that only advise — and took the same branch: **the class stayed, the page drew the difference in prose.**
Taking the other branch here would leave the record having answered one instance of a question one way
and the next instance the other way, which is worse than either answer.

*Left open honestly:* if a third such case arrives, that is the signal the set is genuinely too coarse
and the fourth class should be reopened as its own record, not as an amendment to this one. Two is a
pattern the prose absorbs; three is a schema saying it needs a field.

### The accepted cost, stated so it is not rediscovered as an oversight

**The classing stays coarser than the practice**, and this is now the second place it is coarse. A reader
who takes `documents` at face value about a `SessionStart` row will be wrong about `session-scratch.sh`
in a direction that matters — they will believe a script that reports is a script that only reports.
What stands between that reader and the wrong belief is a **sentence on a page**, checked by nobody, in
two editions that must agree. That is strictly weaker than a schema value the generator would throw on,
and it is what is being bought with the stability of the closed set.

**The per-locale duplication cost this record already books applies again**, and the prose is the part
the harness cannot verify: `architecture-diagrams.test.mjs` asserts that each `accDescr` contains
`REFUSE`/`RECUSAM`, `ADVISE`/`ACONSELHAM`, `DOCUMENT`/`DOCUMENTAM` and the *fails silently* clause — it
asserts nothing about how the `SessionStart` class is characterised, and **no guard is added here**. A
test asserting the absence of a phrase would pass against every rewording of the same false claim, which
is the kind of check that reads as coverage and is not. The honest position is the one this record
already takes about the gloss on its own edges: **authored here, and checked by nothing.**

### What this amendment does NOT decide, and it is the constraint most likely to be broken by accident

~~**No count moves.** `tedeuxx/tadeumendonca-skills`#156 is **open and deliberately held as a draft**
(verified 2026-08-06); the plugin's `main` still registers **two** `SessionStart` hooks and **four** in
total… **The counts follow the merge**, through the generator, in a separate change.~~

**DISCHARGED 2026-08-07.** `-skills`#156 merged (`59fc4f6`); plugin `main` at **0.4.54** registers
**five** hooks, **three** of them on `SessionStart`. The generator was re-run and the page now says
*3 hooks · SessionStart* and *two of the five* — the separate change this clause pointed at, which is
the MR carrying this note.

**Struck rather than edited, and this is why:** the constraint was correct and was honoured. Rewriting
it to describe the new counts would erase the only record that the sequencing was deliberate — that a
page was knowingly left saying *two* for a day because *three* would have been false until a merge in
another repository. That is the decision worth keeping, not the number.

**The clause was still standing in the present tense in the MR that discharged it**, found by the gate
rather than by the author. A record whose own resolution condition has been met, saying "no count
moves" in a diff that moves every count, is the same defect class this record exists to prevent —
arriving inside the change that satisfies it.

Nor does this decide anything about the hook itself: whether a recursive delete belongs on `SessionStart`
at all is the plugin's decision, recorded in the plugin's own library, not here. This record governs only
what this site is allowed to assert about the inventory it publishes.

## Amendment, 2026-08-08 — the "related record" pointed at an ADR that was never written, and the number it used now resolves to a different decision

**Decides one thing:** the *Related record* line in `## Links` is **struck, not repaired**, because the
record it cites does not exist and never did — and the decision it described is, as of this date, still
unrecorded in either library.

**Class: safe.** It corrects a pointer in this record and decides nothing about permissions, the manifest,
the generator or the page. It changes no field the decision index publishes — see *What this does not
change* below.

### What the pointer said, and what is actually there

The struck line cited `./0044-committed-permission-floor-local-overlay-ephemeral.md` as *"the other
decision taken on 2026-08-03 about the harness… that one decides how permissions are governed."*

Measured on 2026-08-08:

| checked | command / path | result |
|---|---|---|
| the file was ever added, on any branch | `git log --all --diff-filter=A -- "docs/adr/0044-*"` | three commits, and **every one of them adds a *different* record** — `0044-version-parts-deliberate-major-minor.md`. **That is the load-bearing half: no `0044-committed-…` file was ever added, anywhere.** The attribution matters less but must be right: only **two** (`c3ba407`, `a177227`) belong to PR #393; the third, `1dd9b39` (2026-08-08 01:50), is on the **unmerged draft branch** `docs/adr-version-digits-publication-counter` and was never part of that PR. `--all` is deliberately broad — it spans branches that were never merged — and that breadth is exactly why "the three commits of PR #393" was the wrong sentence |
| when the pointer was written | `git log -S "0044-committed-permission-floor-local-overlay-ephemeral" --all --reverse` — **`--reverse`, and take the FIRST hit** | `4e32d6f`, 2026-08-03 — the commit that created *this* record. The pointer was forward-looking from the moment it was written and was never valid, not for a minute. **The `--reverse` is not decoration:** this amendment quotes the dead filename, so the commit carrying *this table* is itself a later hit. Written without it, the row would have been falsified by the act of writing it — the exact defect class the MR this rides in exists to remove |
| a matching record in this library | **every record in `docs/adr/`** — deliberately not written as a numeric range, which would under-cover the library the moment the next record lands (it did: 0044 and 0045 both arrived while this amendment was in review, and both were checked) | none decides the committed-floor/local-overlay question |
| a matching record in the methodology library | `tadeumendonca-skills/docs/adr/` 0001–0008 | none. The two nearest are **ADR-0004** *Autonomy and permission model* (2026-07-22, amended 2026-08-03) and **ADR-0008** *Which layer carries a control* (2026-08-04). Both are about permissions; **neither decides which settings belong in the committed floor and which may live only in an untracked local overlay** |
| whether the gap is otherwise recorded | Issue [#384](https://github.com/tedeuxx/tadeumendonca-io/issues/384), 2026-08-08 | states it independently: *"No ADR says which class a setting belongs to."* |

**So the honest reading is: the author intended a companion record, and it was not written.** The subject
it names is real — `452ce95` (2026-08-04) reports the effective floor of this repo having diverged from
its published one, with an untracked `.claude/settings.local.json` of 82 entries and no `deny` block
governing every session — but that was a commit, not a decision record, and **it happened a day after
this pointer was written.** Whether the author on 2026-08-03 had that specific decision in view, or
something adjacent, cannot be determined from any artifact this amendment could find. **This record does
not guess.** The true sentence is the one it now carries: *this pointed at a record that was never
written; the decision it describes may or may not have been taken, and as of 2026-08-08 it is not written
down anywhere.*

### Why the two other repairs lose

- **Repoint at the methodology library** (ADR-0004 or ADR-0008 in `tadeumendonca-skills`). Rejected. It
  reads as the cheapest fix and is the most dangerous one: it would assert that *this* is what the author
  meant, on the basis that both records are about permissions. Neither one decides the
  committed-vs-local-overlay question — checked above, and confirmed by #384 finding that axis unwritten
  five days later. **Cost of taking it:** a reader following the link lands somewhere real, finds a
  plausible permissions decision, and never learns that the companion they were promised does not exist.
  A wrong link that resolves is worse than one that 404s, which is the same failure mode this amendment
  exists to prevent.
- **Delete the line silently.** Rejected. Everyone who read this record between 2026-08-03 and today was
  told a companion decision exists. Deleting the sentence removes the evidence that they were told, and
  removes the only trace that a permissions record was believed to be coming — which is live information,
  since it is still owed. **Cost of taking it:** the gap stops being visible from the one record that
  points at it, and `supersede-never-delete` is applied to files but not to claims.

The struck-and-amended form keeps both: the original sentence stays legible for anyone who followed it,
and the correction is dated next to it.

### The number, and why it must not be re-used here

**ADR-0044 in this library is `0044-version-parts-deliberate-major-minor.md`** — the record about which
SemVer part a change takes. It is a different decision and it keeps the number; nothing is renumbered by
this amendment. That is precisely why the struck line could not be left standing, and the distinction is
worth stating exactly. **The `href` 404s either way** — it names
`0044-committed-permission-floor-local-overlay-ephemeral.md`, a filename that exists at no head. What
changes on that record's merge is the **label**: *"ADR-0044"* stops naming nothing and starts naming the
version-parts decision, so a reader who resolves the number — via `docs/adr/README.md`, via
`/architecture`, or by listing the directory — lands on a real record about version digits that this line
introduces as *"how permissions are governed"*. **A 404 tells the reader something is wrong; a resolving
number tells them nothing at all**, which is the failure this strike prevents.

### What this does not change

`apps/fed/scripts/adr-source.mjs` publishes five fields per record — `id`, `title`, `file`, `status`,
`amended` (`adr-source.mjs:96`). This amendment changes the body only: the title is untouched, the status stays `accepted`, and
`amended` was **already `true`** for this record, set by the three earlier `## Amendment` headings
(2026-08-04 ×2, 2026-08-06) and present as `"amended": true` in the committed
`apps/fed/src/content/generated/adrs.json`. **No row on `/architecture` moves, and the drift check has
nothing new to compare.**

## Amendment, 2026-08-11 — the skill library's count is read from the plugin's own DECLARATION, not from a walk of its tree

**Decides one thing:** where the plugin publishes a `skills` array in `.claude-plugin/plugin.json`, **that
array is the inventory's source for the skill library** — its length is the published count, cross-checked
against the tree in both directions — and walking the tree survives only as the fallback for a plugin that
declares no array. The *What is derived and what is authored* clause above described a walk; that is no
longer the reading, and the difference is a difference in **warrant**, not in implementation.

**Class: safe.** It changes no permission, no gate filter and nothing about how work is decided. It does
record a mechanism change rather than only a count — the mechanism ships in the MR carrying this note,
which is where a record of it belongs (`/workflow/adr`: same MR as the change it justifies).

*Everything below was verified against `apps/fed/scripts/harness-source.mjs` at this branch head, not
against the brief that asked for the amendment. Where a claim was reasoned rather than run, it says so.*

### The two readings are different warrants, and this is what the change buys and costs

**What it buys is measured, and the measurement is the reason the obvious fix was refused.** Recorded in
the module's own header, dated 2026-08-10, treatment against control, one variable, two byte-identical
trees differing only in `.claude-plugin/plugin.json`:

| tree | manifest | verdict |
|---|---|---|
| `skills/fam/nested/SKILL.md` | a `skills` array naming it | **RESOLVED** |
| `skills/fam/nested/SKILL.md` | no `skills` array | **SKILL-NOT-AVAILABLE** |
| `skills/flatctl/SKILL.md` | no `skills` array | **RESOLVED** |

So **declaration, not depth, is what makes a skill loadable.** The declared array is therefore the only
source that answers the question this inventory actually asks — *how many skills can this plugin load* —
and a depth-walking collector would count skills the loader will not register. That is this record's
founding error (publishing a capability the artifact does not have) arrived at from the opposite
direction, which is why the more obvious fix — teach the walker a second level — is the wrong one.

**What it costs, said plainly rather than left to look free: a walk cannot be wrong about what exists; a
declaration can.** The tree is evidence. The array is the plugin asserting its own inventory, and this
record exists because a hand-typed assertion said *19 personas* where the tree said *6*. The count is now
derived from an assertion of that same family, distinguished only — and it is the whole distinction — by
being **the assertion the loader itself reads**. A wrong array is a wrong page and a wrong plugin at once,
which is a strictly better failure than a wrong page over a right plugin, but it is not the failure this
record was originally designed against.

That is why the cross-check runs in **both directions** and is load-bearing rather than belt-and-braces:
`verifyDeclaredSkills` throws on a declared path with no `SKILL.md` behind it (a manifest that
over-claims) and throws on a skill in the tree the array omits (authored and not loadable). The tree does
not set the count; it is kept as the thing the count must agree with.

### The fallback, verified

With **no** `skills` array the generator walks the **top level of `skills/` only** — `autoRegisteredSkills`
in `harness-source.mjs`, which refuses anything that is not `skills/<name>/SKILL.md` rather than
descending. *Checked at this head, not assumed.* That is exactly the registration rule for an undeclared
tree per the measurement above, so the fallback is not a cheaper approximation of the declaration: it is
the same question answered by the rule that applies when there is nothing declared.

### `skill-library` is a member of the closed set of KINDS, and #428 is where it entered

The set of kinds this manifest may carry is closed and ordered in the generator — `hook` · `persona` ·
`skill-library` · `command-family` · `command` (`KIND_ORDER`) — with `enforcementFor` throwing on anything
it does not know. This record enumerated four of them and never gained the fifth:
[#428](https://github.com/tedeuxx/tadeumendonca-io/pull/428) (merged 2026-08-10) introduced
`skill-library` without amending here, and **this diff is where it goes live**, so this is where the
enumeration is repaired.

`command-family` **stays in the set although the live tree emits none.** That is deliberate, not
oversight: a plugin still in the old layout produces family rows, and `layoutOf` refuses a tree in **both**
layouts precisely so that no skill is counted twice during the move. The kind is retired when the layout
is, not when this consumer's plugin stops using it.

`skill-library` maps to `documents`, the same class the command families carried. **No enforcement value
moves and the closed `enforcement` set stays at three** — the fourth-class question this record has now
refused three times is untouched here.

### The granularity, and one reason that went on the record wrongly

The figure published is the library's **size** — 69 at this head — with **no per-family counts**. The
reason offered for that in review was that ~~the manifest holds nothing about families~~. **That reason is
false and is struck.** `declaredSkillPaths` returns `skills/<family>/<name>`: the family segment is
present, and per-family counts are derivable at **exactly the evidentiary strength of the 69**, from the
same array, checked by the same two-direction cross-check.

What actually removed them is a **collapse to a length in the generator** — `collectSkills` emits
`skills: names.length` and discards the paths.

**The accurate reason is *not emitted yet*, not *not checkable*, and the difference is not pedantry.** The
false reason points one way only: a later reader who believes per-family figures are unavailable to the
generator has a licence to hand-type five numbers onto a published page, on the grounds that nothing could
have checked them anyway. The true reason forbids exactly that — they are checkable, so if the page ever
wants them, the generator emits them.

The granularity decision itself is unchanged and is argued where it already stands (one library with a
count, matching the granularity the inventory has always had), together with its accepted cost: **a skill
renamed with the count unchanged is invisible to the drift check.** The inventory pins how many there are,
never which they are.

### The trust boundary this opens, ~~which is open at this head~~ — **closed at `db73a23`**, and the fix chose differently from the property stated below

**The dedupe compares STRINGS while the verification resolves PATHS.** `declaredSkillPaths` normalises
only a leading `./` and trailing slashes before its `seen` check, then `verifyDeclaredSkills` resolves
each entry with `join`, which collapses far more than that. Two spellings of one skill therefore survive
as two declarations that both resolve, pass both cross-checks, and are indistinguishable from an honest
artifact.

*Measured 2026-08-11 against ~~this head~~ `5373f7c`, the head this amendment was first written at* —
every row below is the behaviour **before** the fix, and is kept as the evidence that motivated it —
calling `collectSkills` on a fixture whose tree holds exactly one skill (`skills/vpc/SKILL.md`):

| declared array | emitted |
|---|---|
| `["./skills/vpc", "skills//vpc"]` | `skills: 2` |
| `["./skills/vpc", "skills/VPC"]` | `skills: 2` (macOS) |
| `["./skills/vpc"]`, with `skills/vpc` a **symlink to a directory outside the plugin tree** | `skills: 1` — followed, counted, no refusal |
| a `skills` array present, **no `skills/` directory at all** | `[]` — no row, no throw |

Two of those rows carry a limit on the measurement and it is stated rather than smoothed over. The
**case** row was run on macOS only; on a case-sensitive filesystem `existsSync` answers false and
`verifyDeclaredSkills` throws *"declared and does not exist in the tree"* — that half is ~~**reasoned from
the code, not run**~~ **run, and green, since `db73a23`** (struck 2026-08-11; see the closing subsection
for what ran and where), and it is the worse shape of the two: green on the author's laptop, red in
`harness-drift`, which is the exact split the module's `readdirSync`-over-`existsSync` comments elsewhere
exist to avoid. ~~The **no-`skills/`-directory** row returns before any refusal can fire, so the only thing
standing between it and a silently vanished library is the drift check against a manifest that still
carries the row — which survives one regeneration and no more. Both are the vacuous-pass failure this
module already throws on when `skills/` exists and is empty; the declaration path simply does not reach
that throw.~~ **Struck 2026-08-11: the declaration path now reaches a throw of its own — see the residuals
in the closing subsection.**

~~**The property this record requires, stated as a property and not as an implementation:** *a declared
path is normalised to a canonical, tree-resolved form before it is counted or compared, and a path that
resolves outside the plugin tree — by any spelling, including a symlink — is refused rather than
followed.* Whatever satisfies that is a correct fix; nothing here prescribes how.~~

~~A fix is being built in parallel on this same branch by `developer`. **This amendment does not wait for
it and does not describe it** — the property is what the record owes, and if the shipped fix chooses
differently, this section is the place that difference has to be argued rather than discovered.~~

**Both paragraphs struck 2026-08-11.** The second was an instruction, and it was discharged: the fix
landed two commits later on this same branch and **it did choose differently**. The first was struck
*because* of that — *canonical, tree-resolved* names a mechanism that does not hold the property on a
case-insensitive filesystem, so leaving it standing with a footnote would leave a reader hardening a
future site reaching for `realpathSync`. The restated property and the argument for it are the next
subsection, which is where the second paragraph said the difference had to be argued.

### The boundary is closed at `db73a23`, and the canonical resolver is what closing it had to refuse

**What closed it:** `b19380c` (*"resolve a declared skill path through the tree before counting it"*),
with `db73a23` adding the anti-vacuity sweep over the resulting suite. Both are on this branch, ahead of
the head this amendment was written at, and no `docs/` path moves in either — which is why this
subsection exists rather than a repaired sentence above.

**The restated property, and it is a restatement rather than a footnote:** *a declared path is resolved
segment by segment through each parent's **directory listing**, so that one directory has exactly one
identity on a case-sensitive and a case-insensitive filesystem alike; a path that resolves outside the
plugin's `skills/` tree — by any spelling, including a symlink — is refused rather than followed.* The
containment half is unchanged from the struck version. The identity half is not, and the change is the
whole result.

**Why the canonical resolver was refused.** `realpathSync` resolves **symlinks, not case**. Measured
2026-08-11 against `db73a23`, on a fixture whose `skills/` holds exactly `vpc` and whose manifest
declares both `./skills/vpc` and `skills/VPC`:

| probe | answer |
|---|---|
| parent listing | `["vpc"]` |
| `existsSync(.../VPC)` | `true` |
| `statSync(.../VPC).isDirectory()` | `true` |
| `readdirSync(.../VPC).includes('SKILL.md')` | `true` |
| `readdirSync(.../skills).includes('VPC')` | **`false`** — the only one that differs |
| `realpathSync(.../VPC)` tail segment | **`VPC`** — macOS does not canonicalise case |

Five of the six answers a resolver could ask are the *same* on both filesystems only because they are all
wrong in the same direction on one of them: they say the `VPC` spelling exists. The **listing** is the one
answer that cannot differ between the two platforms, because it reports the bytes actually stored in the
directory rather than the name the caller offered. So the fix compares against the listing at every
segment (`exactPathOf`), and the case variant is refused with **one sentence on both platforms** —
*"declared and does not exist in the tree"* — instead of the two-messages-one-verdict split the struck
text accepted as unavoidable. **Mutation `N7b`**, which applies the `realpathSync` implementation at both
sites, goes **red**; that is the assertion that the choice is load-bearing rather than stylistic.

**The property is held at two sites, and the second one is what actually refuses the case variant.**
`declaredIdentity` (the dedupe) and `verifyDeclaredSkills` (the cross-check) both walk the listing.
Measured at `db73a23` on the fixture above: `declaredSkillPaths` alone returns **both** spellings —
`['skills/vpc', 'skills/VPC']` — because an unresolvable path keys on its normalised string, so the two
survive the dedupe as two distinct keys; `collectSkills` then throws from `verifyDeclaredSkills`. Reverting
`declaredIdentity` alone therefore stays **green**, which is the fact worth recording: the two sites are
not two independent refusals of the same input, they are **the same listing rule applied at two depths**,
and for the case spelling only the deeper one refuses. A reader hardening one of them later needs to know
the other exists **and** that the suite will not tell them which one they broke.

**What ran, and where.** The Linux half is an executable assertion with one exact expected message
(`harness-source.test.mjs:502`, `/skills\/infrastructure\/VPC is declared and does not exist in the tree/`),
with **no `process.platform` conditional and no skip** anywhere in the file — checked by grep, not
assumed. It is green on macOS locally (77/77, run 2026-08-11) and green on the Linux runner in CI: the
`vitest` job on `app.yml`'s `ubuntu-latest` passes at this head. That is what retires the *reasoned, not
run* caveat above.

**The residuals, including one the fix creates.** Recorded here because a boundary reported closed with
its remainder unstated is the false-mechanism defect this library exists to catch:

- **Unicode normalisation replaces the case split.** A byte-exact listing comparison refuses an **NFD**
  declaration over an **NFC** directory. Measured 2026-08-11 against `db73a23` with `réseau`:
  `existsSync` **true**, `listing.includes` **false**, and `collectSkills` throws *"declared and does not
  exist in the tree"* for a directory that exists and that the loader would register. This is a **false
  red** — the safe direction, and the one the case trap failed in — and it is not live, because every
  declared path in the plugin is ASCII. It becomes live the first time a skill is named with an accent.
- **`withinSkillsTree`'s separator is correct and unpinned.** `real.startsWith(root + sep)` is what stops
  a sibling directory whose name merely *starts* with `skills` passing as a child. Shipped behaviour is
  correct; the gate measured that **removing `+ sep` leaves the suite 77/77 green**. This module's own
  suite pins the identical character one level up, at `resolvePluginDir`, and calls it *"one character
  nobody would miss in review"* (`harness-source.test.mjs:162`) — verified here: the declared-path tests
  cover the symlink escape and never the prefix escape. **The record's claim that containment is enforced
  is true and unguarded**, which is exactly the distinction this library refuses to blur. The missing
  assertion is a gap in the safety net rather than a decision, so it is named here and **not decided
  here**; closing it is ordinary work for the tracker.
- The **no-`skills/`-directory** row above is **also closed, and the record nearly said otherwise.** The
  first draft of this bullet claimed it was untouched by the fix, on the reasonable-sounding ground that
  the fix was about path identity; probing it at `db73a23` returns a throw — *"declares 1 skill(s) and
  the plugin has no `skills/` directory at all … Either ship the tree or remove the `skills` array"* —
  not the silent `[]` measured at `5373f7c`. The vacuous pass the struck text said the declaration path
  *"simply does not reach"* is now reached. Recorded with its near-miss because the residual list is the
  part of a closure report a reader trusts without re-running.

### What this does not change

The five fields `adr-source.mjs` publishes per record are untouched: the title is unchanged, the status
stays `accepted`, and `amended` was already `true`. The `enforcement` set, the three-way drift comparison,
the tokenless second checkout, the exclusion from `deploy`'s gate filter and the *identity is checked,
description is not* limit all stand exactly as decided. Nothing here decides anything about the plugin's
own layout move — that is `-skills`#164's decision, recorded in the methodology library, not this one.

## Amendment, 2026-08-16 — the non-negotiable's CARRIER moves from edge styling to column membership, and the move is strictly stronger

**Decides one thing:** the claim this record forbids the page from blurring — hooks deny, personas
advise, and drawing them alike asserts a mechanism that does not exist — is now carried by **which
column of a cartesian grid a component's kind appears in, compared cell by cell against the manifest's
`enforcement` field**, rather than by the styling of a directed edge. The decision itself is untouched.
Nothing about the manifest, the closed `enforcement` set, the generator, the three-way drift check or
the tokenless second checkout changes.

**Why this is an amendment and not a new record.** One decision, already taken here, is now enforced by
a different mechanism. Applied against the significance gate rather than defaulted to: it *alters a
previously-recorded decision* only in its enforcement, and this record's *What this decides for the
page* section states the constraint in terms the redraw makes literally false — so leaving it standing
unamended would publish a requirement about a drawing that no longer exists. It introduces no
dependency, no schema change and no cross-cutting pattern. **If it had required restating the decision
rather than recording how it is now held, it would be the owner's record to open, not an amendment.**

**Class: safe.** It records how an existing decision is enforced; it changes no permission, no gate
filter and nothing about how work is decided. By [ADR-0003](./0003-trunk-based-single-environment.md)'s
2026-07-31 amendment an amendment that decides is `quality-assurance`'s to merge.

### The clause this re-points

In *What this decides for the page, beyond the mechanism*, item 1:

> **Hooks and CI gates `deny`; personas `advise`; command families `document`.** They must be visually
> distinguishable, and the accessible description must carry the distinction too — an `accDescr` that
> flattens it re-publishes the false claim to exactly the reader who cannot see the arrow style.

**Both halves survive; only the second sentence's final noun is now wrong of the drawing.** There is no
arrow style, because the components fence has **no directed edges at all** — it is a four-lane × three-
column grid whose only links are mermaid's invisible `~~~`, used to order boxes inside a subgraph. What
a reader who cannot see the picture is deprived of is therefore **column membership**, and the `accDescr`
requirement is unchanged in force and in wording: each edition still has to say `REFUSE` / `RECUSAM`,
`ADVISE` / `ACONSELHAM`, `DOCUMENT` / `DOCUMENTAM` and the *fails silently* clause in words, and
`architecture-diagrams.test.mjs` still asserts exactly that.

The *Decision drivers* sentence — *"A diagram drawing both with the same arrow would assert a mechanism
that does not exist"* — is likewise true of the reasoning and stale in its instrument. **Read "arrow" as
"visual treatment" in both places.** Neither sentence is edited: they are the form the decision was
argued in, and the argument is what this record keeps.

### Why the new carrier is strictly stronger, stated as what each one could and could not catch

**The styled arrow was hand-authored and compared to nothing.** It was one accent-coloured link and one
dashed link in the compiled SVG, counted by a test that asserted their cardinality and their difference
from each other — a true statement about the *drawing's grammar*, and no statement at all about whether
the drawing agreed with the inventory it was drawn from.

**Measured against the tree at `9439c97`** — the head this branch left `main` at — `enforcement` appears
in `harness-source.mjs`, `harness-source.test.mjs`, `gen-harness.mjs` and `check-harness-drift.mjs`, and
in **no assertion that reads the page**. `git grep enforcement 9439c97 -- apps/fed/scripts/architecture-diagrams.test.mjs`
returns nothing. What did exist was `assertEnforcement`, run by `check-harness-drift.mjs` over every
component — and it validates only that the *value* is a member of the closed set, never what the picture
says about it. **So the field was generated, validated and published, and nothing anywhere connected it
to the claim the picture made.**

The consequence, stated at its worst rather than at its most likely: **the only thing standing between
this page and a persona drawn as a mechanism was a hardcoded two-name blocklist inside one node's label**
— `expect(denyNode).not.toContain('quality-assurance')` and `.not.toContain('security')`, read out of the
`HKD` node — plus `expect(fence.source).toContain('class PS convention')`. A **third** persona placed in
the deny position would have passed. So would flipping `permission-guard.sh` to `"advises"` in the plugin
and regenerating: the manifest would have moved and every assertion in that file stayed green.

**The grid derives every cell from the manifest.** Twelve cells — four kinds × three enforcement classes
— each a falsifiable statement, and the assertion is an equivalence rather than a subset: *a cell is
drawn empty **if and only if** the manifest holds no component of that kind in that class*, in **both
editions**. On top of it sit three derived claims the page makes in prose and no longer types: that
**exactly one kind can refuse and it is the hook** (`expect(refusing).toEqual(['hook'])`, computed from
the manifest's own kinds, not from a list); the per-kind lane totals; and the per-event hook split, whose
leading figure is stated as *"every hook that is not `PreToolUse`"* so that a hook registered on a fourth
event moves the number rather than leaving the cell quietly under-counting.

**That is the difference in one sentence: the old carrier asserted that the drawing was internally
consistent; the new one asserts that the drawing is true of the plugin.** It is the same upgrade this
record made for the *counts* in 2026-08-03, arriving three amendments later for the *classes*.

**The blocklist is kept, and keeping it is deliberate.** It is now redundant against the cell equivalence
in every case that equivalence covers, and it costs two lines to keep a named, human-legible statement of
the one thing this record forbids outright. A redundant assertion that names the forbidden act is worth
its cost where a derived one would only say *"a cell contradicts the manifest"*.

### The new constraint on styling, which is a real cost and is booked here

The grid's seven empty cells need a treatment that recedes, and **the `empty` `classDef` may not use the
accent colour `#FF5A00` and may not carry a `stroke-dasharray`**. Either token would make seven cells
claim a force they do not have, and would break the two node-styling assertions this record's visual half
still rests on — *exactly one* accented box (the mechanism) and *exactly one* dashed box (the convention)
in the compiled SVG, each different from the other.

**It must also stay inside ADR-0008's three colours**, and that half was found by a gate rather than by
reading: the first draft receded the empty cells with `#555555` and `#888888`, and
`diagram-source.test.mjs`'s *"diagram %i uses only the palette"* rejected both, **in both editions**. A
fourth grey is not available, so opacity is how a cell recedes here.

**This is a constraint enforced in two places and stated in a third.** The two assertions redden if it is
broken; a comment in the fence itself, in both editions, says why — because the person who next wants a
darker empty cell will be editing the fence, not this record.

### What was lost

**The edge-styling assertion is deleted, with the edges it was written about.** It counted exactly one
accent-coloured `path.flowchart-link` and exactly one dashed one in the compiled SVG. Nothing replaces it
in kind, and nothing should: it asserted a property of a drawing that no longer has directed edges.

What went with it is small and worth naming rather than discovering later. It was the only assertion that
looked at **link** styling on this fence, so a future fence that reintroduces directed edges reintroduces
an unguarded surface. And it was a second, independent witness to *"one mechanism, one convention"* —
weaker than the cell equivalence, but reading a different part of the SVG. The node-styling test survives
and holds the visual half alone.

**One knock-on outside this record's subject, recorded because it was caused by the same redraw:** the
E2E stroke assertion counted `path.flowchart-link` only, which a grid with no directed edges cannot
satisfy. It was widened to every stroked shape rather than special-cased, on the ground that the property
it was always testing is *visible against the canvas*.

### What this does not change

The five fields `adr-source.mjs` publishes per record are untouched: the title is unchanged, the status
stays `accepted`, and `amended` was already `true`. The `enforcement` set stays **closed at three** — the
fourth-class question this record has now refused three times is not reopened here, and nothing in the
grid needs it. The manifest's schema, `KIND_ORDER`, the three-way drift comparison, the tokenless second
checkout, the exclusion from `deploy`'s gate filter and the *identity is checked, description is not*
limit all stand exactly as decided.

**The `accDescr` remains authored here and checked for vocabulary, not for truth**, which is the same
honest limit this record already books twice. The cell equivalence reads the **fence**; a description
that describes the grid wrongly while containing all four required words still passes.

## Links
- **Implements** part of Issue [#318](https://github.com/tedeuxx/tadeumendonca-io/issues/318) — the
  dev-loop **components** diagram, complementing the **flow** diagram shipped by
  [ADR-0040](./0040-build-time-mermaid-diagrams.md)'s 2026-07-30 amendment. The two are not merged, for
  the reason recorded above: one diagram trying to be both would blur `denies` and `advises`.
- **Constrained by [ADR-0002](./0002-fully-static-spa-no-backend.md) and
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)** — the build reads the manifest, never the
  sibling repo.
- **Follows [ADR-0040](./0040-build-time-mermaid-diagrams.md)** for the diagram itself (Mermaid in the
  markdown body, compiled to committed inline SVG, per-locale `accTitle`/`accDescr`, palette assertions
  that check membership and never legibility) and for the shape of its own honesty about what a guard
  guarantees.
- **Follows the decision index** (`apps/fed/scripts/adr-source.mjs`, `gen-adrs.mjs`, #318) — authored
  source → committed artifact → red build on drift, three ways.
- **Applies [ADR-0015](./0015-oidc-immutable-subject-least-privilege.md)** to a CI path filter: this
  mechanism stays out of `deploy`'s gate because that gate's outputs decide whether a credentialed job
  runs. See `.github/workflows/README.md`.
- ~~**Related record:** [ADR-0044](./0044-committed-permission-floor-local-overlay-ephemeral.md) — the other
  decision taken on 2026-08-03 about the harness. Deliberately a separate record: this one decides how a
  page is built, that one decides how permissions are governed.~~ **Struck 2026-08-08: that record was
  never written, and the number now belongs to a different decision. See the amendment above.**
- Source read to produce the counts above: `tadeumendonca-skills` at `agents/`, `hooks/hooks.json`,
  `hooks/scripts/inventory-counts.test.sh`, `.github/workflows/docs-test.yml`, `commands/`, `README.md`.
