# Content review — the dated addendum to `blast-radius-supernova` (#737)

The review record for the dated addendum that #737 adds to the published article
`blast-radius-supernova`, in both editions, as a pending revision
(`apps/fed/src/content/revisions/blast-radius-supernova.{en,pt}.md`). The original review record for the
article is `docs/content-review/blast-radius-supernova.md`, and this slice does not touch it (AC 9).

The ruler is the `published-voice` skill. The sources are the owner's answer Q1 on #737, his interview
answers Q3 to Q5 on #732 (which Q1 carries over), the ruling "Mover a assinatura" on #732, this
repository at the branch base `98a063d`, the plugin repository `tedeuxx/tadeumendonca-skills` at its
`origin/main` `b69055c`, and the publication commit `0812dac`.

The provenance table and the publication-day checks below were written by the drafter. The rounds are
the reviewer's, appended after them.

## The article's claims were true at `0812dac` (AC 9, *Outcome*)

The addendum corrects four statements of the article without calling any of them false on the day. Each
was re-checked against the state of the two repositories on publication day. `<skills>` is a checkout
of `tedeuxx/tadeumendonca-skills`; the plugin commit is the last one on its `main` before the end of
2026-08-28.

| article claim (EN line, same line in PT) | command | result |
|---|---|---|
| L169: the plugin registers two hooks on shell commands, `permission-guard` then `wip-guard` | `git -C <skills> rev-list -1 --before='2026-08-28T23:59:59Z' origin/main` → `8cd68b6`; `git -C <skills> show 8cd68b6:hooks/hooks.json \| jq -c '.hooks.PreToolUse[] \| select(.matcher=="Bash") \| [.hooks[].command]'` | `permission-guard.sh`, `wip-guard.sh`, in that order |
| L235: hooks deny a command before it runs (the plugin was the method running here) | `git show 0812dac:.claude/settings.json \| jq -c .enabledPlugins` | `"tadeumendonca-skills@tadeumendonca": true` |
| L179: a job compares the inventory against the plugin's tree and reddens the build | `git show 0812dac:.github/workflows/app.yml \| grep -c check-harness-drift.mjs` | `3` |
| L1–L255: the article as published | `git log -1 --format='%H %cI' 0812dac` | `0812dacb… 2026-08-28T06:16:49-03:00`; the front matter's `date` is `2026-08-28` |

## Provenance — one row per addendum sentence (AC 9)

Rows are the English edition; the Portuguese edition says the same thing sentence for sentence. "Q1
(#737)" is the owner's answer on this Issue; "Q3" to "Q5" are his interview comments on #732. Paths are
relative to the repository root at `98a063d` unless a row says `<skills>`.

| # | sentence (EN) | source |
|---|---|---|
| R | `---` before the heading, and the sign-off "Good luck out there, and may your radius be narrow." moved from L255 to the addendum's last line | AC 3 and AC 4; the ruling "Mover a assinatura" on #732 (comment 6213913802), carried over by Q1 (#737) |
| H | Addendum — 16 October 2026 | AC 4 and AC 17: a forecast of the release day, as on #732 |
| 1 | This piece is a record of the loop as it stood when I published it, on 28 August 2026, and it stays one. | Q1 (#737) "sim, vale o mesmo do #732", carrying #732 Q1 "um registro de quando publiquei"; the front matter `date: '2026-08-28T12:00:00.000Z'` |
| 2 | Since then, part of what it describes has changed. | connective; the items are rows 4 to 12 |
| 3 | What changed since: | connective |
| 4 | **Two hooks, one command.** I wrote that every shell command I run passes through `permission-guard` and then through `wip-guard`. | the article's own L169, unchanged |
| 5 | `wip-guard` was removed from the plugin on 4 September 2026. | `git -C <skills> log origin/main --diff-filter=D --format='%h %ad %s' --date=short -- hooks/scripts/wip-guard.sh` → `e145cd0f 2026-09-04 fix(hooks): delete wip-guard …` |
| 6 | Today the plugin registers one hook on shell commands, `permission-guard`. | `git -C <skills> show origin/main:hooks/hooks.json \| jq -c '.hooks.PreToolUse[] \| select(.matcher=="Bash") \| [.hooks[].command]'` → one entry, `permission-guard.sh` |
| 7 | **Where the method lives.** The `tadeumendonca-skills` plugin is disabled in this repository, and the method that runs here comes from the workstation at user level. | `apps/fed/src/content/architecture.en.md` L127, verbatim; `git show origin/main:.claude/settings.json \| jq .enabledPlugins` and the same for `apps/fed/.claude/settings.json` → `"tadeumendonca-skills@tadeumendonca": false` (set by `566789c`, 2026-10-13) |
| 8 | Its agents, skills and commands are installed by tedeuxx/mhw. | `architecture.en.md` L127, verbatim; the same wording released in `what-my-agents-do` (PR #744) |
| 9 | The plugin is still published, but it is deprecated as a source, and its README points to `tedeuxx/mhw`. | `architecture.en.md` L127, verbatim; `git -C <skills> show origin/main:README.md \| sed -n '3,4p'` → "Deprecated as a source (2026-10-12). The method now lives in [tedeuxx/mhw]…" |
| 10 | **What refuses a command.** Near the end I wrote of hooks that deny a command before it runs. | the article's own L235, unchanged ("hooks that deny a command before it runs") |
| 11 | In this repository no hook does that today. | `architecture.en.md` L127: "In this repository no hook refuses anything."; `git show origin/main:.claude/settings.json \| jq '.hooks // "no hooks key"'` → `"no hooks key"`, the same for `apps/fed/.claude/settings.json`; row 7 for the plugin |
| 12 | The irreversible commands are refused by native deny rules, which match the command by its spelling, and the merge is held by a written rule. | `architecture.en.md` L127: "The merge is held by a written rule. The irreversible commands are held by native deny rules matched on the command's spelling"; `git show origin/main:.claude/settings.json \| jq '.permissions.deny'` lists them (for example `Bash(git push --force:*)`, `Bash(git reset --hard:*)`, `Bash(rm -rf:*)`) |
| 13 | **The drift detector.** That one has not moved. The inventory still compares against the plugin's repository, and a mismatch still reddens the build here. | the article's own L179 for the subject; `.github/workflows/app.yml` job `harness-drift` checks out `repository: tedeuxx/tadeumendonca-skills` and runs `node apps/fed/scripts/check-harness-drift.mjs "$GITHUB_WORKSPACE/.skills-checkout"`, and the aggregator fails on `contains(needs.*.result, 'failure')` with `harness-drift` among its needs (`grep -n 'harness-drift\|tadeumendonca-skills\|needs.\*.result' .github/workflows/app.yml`) |
| 14 | The current state of the loop is on the architecture page. | AC 4a ("links /architecture for the current state") |
| 15 | Now the why. | connective; #732 Q2 "o que mudou. e pq" |
| 16 | For me, as a software engineer, these are not capabilities of a project. They are capabilities of how I work. | Q3 "para mim (swe), nao sao capacidades de projeto, sao capacidades como eu trabalho", with his own correction "*capacidades" |
| 17 | Each person works differently — unless the organisation imposes a way of working on us. | Q4 "pq cada pessoa trabalha diferente" and "a nao ser que a organizacao nos obrigue uma forma de trablho" |
| 18 | That is why I needed to rehearse the organisations' way of working with myself. | Q4 "por isso precisava ensaiar a forma das organizacoes comigo msm" |
| 19 | And another point: perimeter defence. My workstation must set the rules of the game. The projects only follow. | Q5, verbatim in translation |

Rows 16 to 19 are worded exactly as the released `what-my-agents-do` addendum (PR #744), sentence for
sentence, in both editions.

**What the addendum deliberately does not say (AC 2, AC 8).** It makes no statement about L173 ("the
single strongest argument I have for why this loop is made of hooks and gates rather than of a very long
document"): no row endorses, retracts or reframes it, and the unit test pins L173 as published and
refuses either edition's addendum quoting it. It does not explain the layered configuration of #695,
claims nothing about what the workstation enforces beyond what `/architecture` and `tedeuxx/mhw` state,
and names no employer or client.

**Numbers (AC 5).** The addendum publishes three dates and no other digit. "One hook" (row 6) is a
count written as a word; its command is row 6.
