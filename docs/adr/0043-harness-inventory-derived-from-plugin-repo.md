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
  script name, event and matcher; each command family's directory and file count; and the un-namespaced
  command. Identity and shape.
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
one goes red — and a generator that walks only the directories drops it without a word. The manifest
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
- **Related record:** [ADR-0044](./0044-committed-permission-floor-local-overlay-ephemeral.md) — the other
  decision taken on 2026-08-03 about the harness. Deliberately a separate record: this one decides how a
  page is built, that one decides how permissions are governed.
- Source read to produce the counts above: `tadeumendonca-skills` at `agents/`, `hooks/hooks.json`,
  `hooks/scripts/inventory-counts.test.sh`, `.github/workflows/docs-test.yml`, `commands/`, `README.md`.
