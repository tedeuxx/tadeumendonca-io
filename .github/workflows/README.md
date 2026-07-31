# CI/CD — the design we are aligning on, and the one running today

Two halves, in this order:

- **Part I — the target.** One drawing of the whole lifecycle as we want it. **Under discussion,
  nothing built.** This is the picture to argue with.
- **Part II — today.** How it actually works right now, drawn the same way, as the reference the
  target is a delta against.

> Diagrams render natively on github.com from the ```mermaid``` fences. This is **not** the
> [ADR-0040](../../docs/adr/0040-build-time-mermaid-diagrams.md) pipeline — that one compiles
> Mermaid to inline SVG at build time because the *site* must serve it to a crawler with no
> JavaScript. Here the reader is a person on github.com, so the fence is enough and there is no
> generated artifact to keep in sync.

**Source of truth for Part II is the YAML in this directory.** If they disagree, the YAML wins and
this file is the bug.

---
---

# PART I — THE TARGET

> **Status: proposed, 2026-07-31. No YAML has been touched.**
> Numbered markers below are discussion items, not a sequence.

## The whole lifecycle, as proposed

```mermaid
flowchart TD
    A["push to a feature branch"] -->|"still nothing"| A2(["no workflow runs"])
    A --> B["open a PR to main"]

    B --> CH["changes<br/><i>paths-filter · no credentials</i>"]

    CH -->|"code?"| IN["setup<br/><i>node + npm ci, cached</i>"]
    IN --> AU["audit"]
    IN --> LI["lint"]
    IN --> TY["typecheck"]
    IN --> TE["test ≥85%<br/><i>uploads lcov</i>"]
    IN --> BU["build<br/><i>uploads dist</i>"]
    BU --> E2["e2e<br/><i>downloads dist</i>"]
    TE --> SO["sonar<br/><i>downloads lcov</i>"]
    BU --> SO

    AU --> GATE["<b>build-test</b><br/><i>aggregator = required check</i>"]
    LI --> GATE
    TY --> GATE
    TE --> GATE
    E2 --> GATE
    SO --> GATE

    CH -->|"iac?"| PL["<b>plan</b>"]
    CH -->|"workflows?"| AL["<b>actionlint</b>"]

    GATE --> M["merge to main"]
    PL --> M
    AL --> M

    M --> VM["version-main<br/>bump · tag · Release"]
    VM -->|"commit bump: X → Y"| DP["deploy"]
    M -->|"only if iac/ changed"| IA["infra-apply"]

    DP --> LIVE(["site is live"])
    IA --> LIVE

    style A2 stroke-dasharray: 5 5
    style GATE stroke-width:3px
    style PL stroke-width:3px
    style AL stroke-width:3px
    style M stroke-width:3px
    style LIVE stroke-width:3px
```

## What changes, and what deliberately does not

**Changes — one thing only:** `build-test` stops being a 13-step monolith and becomes a set of jobs
with the dependencies it always had. That is where every edge in the top half comes from.

**Does not change:**

- pushing to a feature branch still runs nothing;
- `plan` and `actionlint` stay exactly as they are;
- the merge → `version-main` → `deploy` chain is untouched;
- the post-deploy smoke stays where it is — **still not a gate** (see Part II §3).

## Three things this design turns on

**1 · `build-test` becomes a terminal aggregator.** It stops doing work and only `needs:` the
others, succeeding or failing with them. Branch protection requires the job names
**`plan`, `build-test`, `actionlint`** — not workflow names — so keeping this name means **no
change to branch protection at all**. The graph also gains a real terminal node: "did the code gate
pass" becomes one box instead of an AND over six.

**2 · The path filter gets simpler, not more complex.** Today `dorny/paths-filter` runs as step 2
and **eleven** steps repeat `if: steps.changes.outputs.code == 'true'`. As jobs it becomes one
`changes` job whose outputs each job reads once. A skipped job satisfies a required check, so a
non-matching PR still reports green without the workflow-level `paths:` trap in Part II §6.

**3 · Two artifacts appear where there were none:** `dist` (build → e2e) and the lcov report
(test → sonar). That is real latency and a genuinely new failure mode — a job that passes locally
and fails in CI because an artifact did not arrive.

## The cost I am not going to pretend I know

**Every job is a fresh runner**, so each runs its own `npm ci`. `actions/setup-node`'s cache makes
that cheaper, not free. Total runner-minutes will certainly go up. **Wall-clock I have not
measured.** Measuring it is the first task, not a footnote — and if it does not improve, the honest
outcome is to keep the monolith and say so.

## The question I think should NOT be decided by the picture

**Merging `build-test` + `infra-plan` + `lint-workflows` into one file.** It gives one run per PR
instead of three. It draws **no edges** — those three are genuinely independent, so they would be
three unconnected boxes sharing a run. And it couples their failure: a YAML syntax error in the
merged file makes GitHub fail the whole workflow, so all three required checks go missing at once
and the PR blocks with no useful signal. Today a broken `lint-workflows.yml` costs `actionlint` and
nothing else.

**Recommendation: leave the three files alone.** Split the monolith, measure, and revisit only if
there is a reason beyond the drawing.

## Open, in the order to settle

1. Split the monolith — yes or no, pending the wall-clock measurement.
2. If yes: does `sonar` need `build`, or only the lcov from `test`? Drawn conservatively above as
   needing both.
3. Merge the three files — decided separately, and my answer is no.

---
---

# PART II — TODAY

GitHub's Actions tab shows six independent lists. The relationship between them is not visible
anywhere in that UI, because it does not exist as configuration: **one workflow pushes a commit
that another one listens for.**

## 1 · The whole lifecycle

```mermaid
flowchart TD
    A["push to a feature branch"] -->|"no workflow at all"| A2(["nothing runs"])
    A --> B["open a PR to main"]

    B --> C{"the three PR gates<br/>every PR, always"}
    C --> C1["build-test<br/>lint · typecheck · test ≥85%<br/>build · E2E · SonarCloud"]
    C --> C2["infra-plan<br/>fmt · validate · checkov · plan"]
    C --> C3["lint-workflows<br/>actionlint · shellcheck"]

    C1 --> D{"green?"}
    C2 --> D
    C3 --> D
    D -->|"no"| B
    D -->|"yes + critical-reviewer"| E["merge to main"]

    E --> F["version-main<br/>bump VERSION · tag · Release"]
    F -->|"pushes the commit<br/>bump: X → Y"| G["deploy<br/>triggered by paths: VERSION"]
    E -->|"only if iac/ changed"| H["infra-apply<br/>terraform apply"]

    G --> I(["site is live"])
    H --> I

    style A2 stroke-dasharray: 5 5
    style E stroke-width:3px
    style I stroke-width:3px
```

**Two things this diagram exists to make obvious.**

**Pushing to a feature branch runs nothing.** Not one of the six. The three PR workflows listen for
`pull_request: branches: [main]` — a push to a branch is not that event. The other three listen for
`push: branches: [main]` — your branch is not `main`. Verified against this repo's history: **zero**
runs have ever been triggered by a push outside `main`.

So **the local loop is your only gate until the PR exists**: `npm test`, `npm run lint`,
`npm run typecheck`, `npm run e2e:local`. The last one runs the same Playwright suite CI runs,
against a preview of the real build.

**The trigger is the PR, not the push.** Once the PR is open, every further push *does* re-run the
three — but as a `pull_request` event of type `synchronize`, not as a `push`. Same git operation,
different answer depending on whether a PR exists.

---

## 2 · The chain nothing declares

`version-main` does not mention `deploy`. `deploy` does not mention `version-main`. They are linked
only by a commit.

```mermaid
flowchart LR
    A["merge to main"] --> B["version-main"]
    B --> C["commit<br/>bump: X → Y<br/>+ tag vY"]
    C -->|"paths: VERSION"| D["deploy"]
    D --> E(["live"])

    style C stroke-width:3px
```

**Why the bump and not the merge.** `version-main` pushes `bump: X → Y` and tags `vY` on top of
every merge, so the bump commit is the **only** commit on `main` whose tree carries the version it
is tagged with. Triggering on the merge would build a tree whose `VERSION` still names the
*previous* release.

**Why it needs a special token.** A push made with the default `GITHUB_TOKEN` **does not trigger
other workflows**. `version-main` pushes with `VERSION_BUMP_TOKEN` — without it the bump would
happen and `deploy` would never wake up.

**The cost, which is inherent and cannot be designed away:** `version-main` is now load-bearing for
deployment. It wedged once, for four merges; back then that only stopped tagging. Now it stops the
site shipping. `workflow_dispatch` on `deploy` is the unconditional manual deploy and the rollback
path.

---

## 3 · Where the post-deploy smoke actually sits

This is the one most worth internalising, because it explains what a red `deploy` does and does not
mean.

```mermaid
flowchart TD
    subgraph gate["job 1 — gate (no credentials)"]
        G1["diff last-tag..HEAD over<br/>apps/fed · packages/shared · deploy.yml"]
    end

    subgraph deployjob["job 2 — deploy (needs: gate) — ELEVEN STEPS, ONE JOB"]
        D1["01-06 checkout · node · install<br/>playwright · AWS OIDC · SSM"]
        D2["07 build (prerendered)"]
        D3["08 Publish to S3"]
        D4["09 CloudFront invalidation"]
        D5["10 E2E smoke vs production"]
        D1 --> D2 --> D3 --> D4 --> D5
    end

    gate --> deployjob
    D3 -.->|"the site has already changed here"| X(["live"])
    D5 -.->|"red = a colour, nothing else"| Y(["no revert · no block · no rollback"])

    style D3 stroke-width:3px
    style D5 stroke-dasharray: 5 5
```

**The smoke is not a gate — it is the last step of the job that already published.** It runs at step
10; `Publish to S3` ran at step 08. It is not a separate job with `needs:`, it is a later step on the
same machine. When it goes red, the site changed seconds ago. It does not revert, does not block,
does not hold traffic.

That is deliberate — it is the post-deploy health confirmation, and it catches CDN-level breakage
the pre-merge run structurally cannot see (there is no local CloudFront). But **the only effect of a
red smoke is the colour of the workflow**, and that is worth knowing before you rely on it.

---

## 4 · The two filters are not the same list

Both filter on three paths. The lists look alike and are not.

```mermaid
flowchart LR
    subgraph bt["build-test"]
        B1["apps/fed"]
        B2["packages/shared"]
        B3["iac/cloudfront-functions"]
    end
    subgraph dp["deploy — job gate"]
        D1["apps/fed"]
        D2["packages/shared"]
        D3[".github/workflows/deploy.yml"]
    end

    style B3 stroke-width:3px
    style D3 stroke-width:3px
```

**The consequence:** a PR touching only `iac/` matches **none** of the deploy gate's paths, so
`deploy` **skips** and the post-deploy smoke never runs. An infrastructure fix to a
*content-serving* path is therefore unverifiable by CI — the only proof is a manual
`workflow_dispatch` on `deploy` after `infra-apply` goes green.

This is not hypothetical: it is why the `/og/*` origin fix on 2026-07-31 needed a manual dispatch to
be proven.

---

## 5 · Jobs are not atomic

Six workflows, **seven** jobs. Only `deploy` has more than one.

| workflow | jobs | what that means in practice |
|---|---|---|
| `build-test` | 1 | 13 steps in series on one machine. Nothing runs in parallel — typecheck waits for lint, which waits for audit. Fail at step 8 and steps 9–13 never run, while the Actions tab says only "build-test failed". |
| `deploy` | 2 | `gate` decides, `deploy` executes. The split exists so **the deciding job holds no credential** — on a release that touched nothing we serve, no token is ever issued. |
| `infra-plan` | 1 | — |
| `infra-apply` | 1 | Apply and the edge assertion share a job on purpose: the assertion must run against the function *this* apply published. Playwright is installed **before** the apply, so a download flake fails having changed nothing. |
| `lint-workflows` | 1 | — |
| `version-main` | 1 | — |

---

## 6 · Green does not mean "verified"

Every PR workflow runs on **every** PR and applies its path filter **inside** the job. That is not a
style preference: a workflow-level `paths:` filter can never be a required status check, because on
a non-matching PR it never reports and sits pending forever.

So a workflow can pass having skipped everything. Each one therefore ends with a `::notice::` naming
which of **three** cases happened:

- *nothing matched, so nothing was verified*
- *a step failed, so the rest never ran*
- *the gate ran — here is the list*

A check that matched nothing must not read like one that passed.

---

## The six files

| file | trigger | can it stop anything? |
|---|---|---|
| `build-test.yml` | PR → main · push → main | **yes** — blocks the merge |
| `infra-plan.yml` | PR → main | **yes** — blocks the merge |
| `lint-workflows.yml` | PR → main · push → main | **yes** — blocks the merge |
| `version-main.yml` | push → main | no — it produces the deploy's trigger |
| `deploy.yml` | push → main `paths: VERSION` · dispatch | **no** — it *is* the change |
| `infra-apply.yml` | push → main `paths: iac/**` · dispatch | **no** — it *is* the change |

`claude.yml` is on-demand (`@claude` in a comment) and is not part of this flow.
