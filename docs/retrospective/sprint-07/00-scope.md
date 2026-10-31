# sprint-07 — retrospective scope

commit: 990a50214c65a7e861ba156da37eba07e774b342
skills-commit: 23158e9fbc2b3cde199cda7f481ccf94ed020e28 (`origin/main` of `tadeumendonca-skills`, fetched at measurement)
measured: 2026-10-31

This file holds query output only: no findings, and no persona's artifact was read for its meaning.
The consult set below is a lower bound. No utilization, duration or token total is published.

## 1 · The iteration in both repositories, and what was open when the rite ran

Both repository records read `loop-mode: scrum`:

```sh
grep -m1 '^loop-mode: ' docs/loop-mode.md
git -C /Users/tadeumen/git-reps/tadeumendonca-skills show origin/main:docs/loop-mode.md \
  | grep -m1 '^loop-mode: '
# loop-mode: scrum
# loop-mode: scrum
```

The milestone namespaces were enumerated from the Issues before any selection:

```sh
gh issue list --repo tedeuxx/tadeumendonca-skills --state all --limit 400 --json milestone \
  --jq '[.[].milestone|select(.!=null)|{number,title}]|unique_by(.number)|sort_by(.number)'
gh issue list --repo tedeuxx/tadeumendonca-io --state all --limit 400 --json milestone \
  --jq '[.[].milestone|select(.!=null)|{number,title}]|unique_by(.number)|sort_by(.number)'
```

| repository | observable milestones |
|---|---|
| `tadeumendonca-skills` | 1 `v0.2.0 Phase 1`; 2 `sprint-01`; 4 `sprint-02`; 5 `sprint-03`; 6 `sprint-04`; 7 `sprint-05` |
| `tadeumendonca-io` | 1 `sprint-01`; 2 `sprint-02`; 3 `sprint-05`; 4 `sprint-06`; 5 `sprint-07` |

An Issue-derived enumeration cannot see a milestone holding no Issues, so the next numbers were read
directly with the reviewed reader:

```sh
S=/Users/tadeumen/.local/share/personal-multi-harness-workstation-configuration/method/scripts/milestone-read.py
python3 $S 5 --repo tedeuxx/tadeumendonca-io
# title: sprint-07; state: open; open_issues: 1; closed_issues: 2
python3 $S 6 --repo tedeuxx/tadeumendonca-io
# gh failed: gh: Not Found (HTTP 404)
python3 $S 8 --repo tedeuxx/tadeumendonca-skills
# gh failed: gh: Not Found (HTTP 404)
python3 $S 9 --repo tedeuxx/tadeumendonca-skills
# gh failed: gh: Not Found (HTTP 404)
```

**No `sprint-07` milestone is observable in `-skills`.** The iteration is one object, `-io`
milestone 5. Its members were selected from the returned Issues; no milestone title was passed to a
query as a filter:

```sh
gh issue list --repo tedeuxx/tadeumendonca-io --state all --limit 400 \
  --json number,milestone,state,stateReason,labels,closedAt \
  --jq '[.[]|select(.milestone!=null and .milestone.number==5)
          |{n:.number,s:.state,r:.stateReason,c:.closedAt,l:[.labels[].name]}]|sort_by(.n)'
```

| Issue | type | points | state / reason | closed |
|---|---|---:|---|---|
| #663 | product | 1 | CLOSED / COMPLETED | 2026-10-24 |
| #712 | content, reader-facing | 8 | **OPEN** | — |
| #765 | product | 3 | CLOSED / COMPLETED | 2026-10-24 |

**At this moment the milestone is open and holds 1 open Issue, #712.** The rite runs against an
iteration that is not empty.

### The window

**2026-10-17 through 2026-10-31.** The start is the day after sprint-06's recorded window end; the end
is the day this rite ran, because the iteration has no close.

```sh
git show HEAD:docs/funnel-review/collected/sprint-06.tsv | grep -m1 '^# Window'
# # Window: 2026-10-10 through 2026-10-16.
git log --format='%h %ad %s' --date=short -- docs/planning/sprint-07.md
# 2710764 2026-10-24 docs(planning): strike two sprint-07 sentences made false by step 4
# c027047 2026-10-24 docs(planning): append the sprint-07 step-4 outcome
# 720ee6d 2026-10-24 docs(planning): record the sprint-07 re-plan
```

`docs/planning/sprint-07.md` records a **re-plan** on 2026-10-24: milestone 5 already existed then,
holding #712, and #663 and #765 were admitted at that rite. The milestone reader exposes no creation
date, so the window start rests on sprint-06's window end, not on the milestone object.

## 2 · `loop` items with NO milestone

```sh
gh issue list --repo tedeuxx/tadeumendonca-skills --state open --label loop --limit 200 \
  --json number,milestone \
  --jq '{open_loop:length,unmilestoned:[.[]|select(.milestone==null)|.number]}'
# {"open_loop":2,"unmilestoned":[578,576]}
gh issue list --repo tedeuxx/tadeumendonca-io --state open --label loop --limit 200 \
  --json number,milestone \
  --jq '{open_loop:length,unmilestoned:[.[]|select(.milestone==null)|.number]}'
# {"open_loop":2,"unmilestoned":[790,781]}
```

**2 in `-skills` (#576, #578), 2 in `-io` (#781, #790).** Calibration: the same label over all
states returns 142 Issues in `-skills` and 15 in `-io`, so neither count comes from a dead selector.

## 3 · The derived consult set — a lower bound

### First source: dispatch-metrics records on the three Issues

```sh
gh issue view <n> --repo tedeuxx/tadeumendonca-io --json comments \
  --jq '[.comments[]|select((.body//"")|contains("dispatch-metrics:"))
          |((.body|split("\n")[0])|capture("dispatch-metrics: (?<a>[^ ]+)").a)]
        |group_by(.)|map({(.[0]):length})|add // {}'
```

| Issue | comments | distinct `dedupe_key` | record dates |
|---|---|---|---|
| #712 | `content-writer` 15; `quality-assurance` 8; `developer` 1 | `content-writer` 6; `quality-assurance` 8; `developer` 1 | 2026-10-24, 2026-10-30 |
| #663 | none | — | — |
| #765 | none | — | — |

The agent types are namespaced `tadeumendonca-skills:<name>`. Every #712 record reads
`worktree_resolution: transcript-worktree` with `attribution: union`; none has the
`payload-cwd` + `union` shape the method marks unverified. Counts of comments are not summed: the
records are cumulative per stop.

### Second source: verdict markers on PRs merged in the window

```sh
gh pr list --repo tedeuxx/<repo> --state merged --search "merged:2026-10-17..2026-10-31" --limit 200 \
  --json number,comments \
  --jq '{prs:length,
         gatekeeper:[.[]|select(any(.comments[];.body|contains("<!-- gatekeeper-verdict:")))|.number],
         harness:[.[]|select(any(.comments[];.body|contains("<!-- harness-lead-verdict:")))|.number]}'
```

| repository | merged PRs | with `gatekeeper-verdict` | with `harness-lead-verdict` |
|---|---:|---|---|
| `-io` | 23 | all 23 (#730, #756, #757, #760, #761, #763, #764, #766, #767, #769, #770, #772–#774, #777–#780, #784–#787, #791) | #730, #757, #766, #767, #769, #772, #777, #791 |
| `-skills` | 2 | #571, #573 | #571, #573 |

Calibration: the same `-io` query for the literal `<!-- product-lead-verdict:` returns an empty list,
so the selector can return nothing. A relayed `copy-verdict: product-lead` envelope appears inside the
gate comments on `-io` #756 and #763.

PRs whose body names an iteration Issue (`gh pr list --repo tedeuxx/tadeumendonca-io --state all
--search "<n> in:body"`), with per-PR marker counts from `gh pr view <n> --json comments`:

| Issue | merged PRs in the window | gatekeeper | harness |
|---|---|---|---|
| #712 | #770, #778, #780, #784, #785, #786, #787 (and #777) | on each | none |
| #765 | #773, #779 (and #777) | on each | none |
| #663 | #777 only | 1 | 2 |

#777 is the planning merge request and names all three.

### Third source: a tracked round artifact

`docs/content-review/build-your-first-ai-app.md` was committed in the window and carries two
`## Round` sections; its commits are `45856ee` (2026-10-19, round 1 on the validation piece) and
`876c54b` (2026-10-24, round 2):

```sh
git log --since=2026-10-17 --format='%h %ad %s' --date=short -- docs/content-review
grep -c '^## Round' docs/content-review/build-your-first-ai-app.md   # 2
```

A `## Round` section is the `content-reviewer` artifact of record. Commit authorship does not
distinguish a persona from a human, so this is an artifact-based hand-add, not a dispatch record.
`docs/content-review/social-records-668.md` also changed in the window; #668 is not in milestone 5.

### Hand-added

`product-lead`, by the orchestrator's knowledge: it drove the sprint-07 sweep
(`docs/iteration-sweep/sprint-07.md`, committed at `990a502`, 2026-10-31) and is writing the funnel
report in this session. The relayed copy-verdict envelopes on #756 and #763 are consistent with it.

### Subtracted by property

`scrum-master` is excluded: `~/.claude/agents/scrum-master.md` declares `tools: []`, so it cannot
write its own respondent file, and the rite refuses an orchestrator relay. Every other profile below
holds `Write` (read from each installed brief's `tools:` line).

No source attests `tech-lead` in the window.

## 4 · The recorded consult set

**At least these ran: `agents-lead`, `quality-assurance`, `content-writer`, `developer`,
`content-reviewer`, `product-lead`.**

| persona | attested by |
|---|---|
| `agents-lead` | `harness-lead-verdict` markers (8 `-io` PRs, 2 `-skills` PRs) |
| `quality-assurance` | #712 records (8 dispatches); `gatekeeper-verdict` on all 25 window PRs |
| `content-writer` | #712 records (6 dispatches) |
| `developer` | #712 record (1 dispatch) |
| `content-reviewer` | the tracked round file (hand-added on an artifact) |
| `product-lead` | hand-added by the orchestrator; copy-verdict envelopes on #756, #763 |

**This is a lower bound.** A persona that ran and left no record, marker or tracked file is
indistinguishable from one that never ran.

### Known limits

1. Dispatch records exist only where Claude Code's metrics hook ran; Codex emits none, and a
   read-only dispatch on `main` that wrote to no merge request posts nothing.
2. The records are per repository; `-skills` holds no sprint-07 Issue to query.
3. The marker source attests `quality-assurance` and `agents-lead` only.
4. The window limb selects by merge date: #730 and #766 merged in the window and were associated
   with sprint-06 in its scope record, and a PR reviewed here but merged later is outside the set.
5. Records are cumulative per stop and must be deduplicated by `dedupe_key`, never summed.

## 5 · Evidence available for the isolated respondent files

- `agents-lead`: its markers on the PRs listed in section 3.
- `quality-assurance`: its #712 records; its gate markers on the 25 window PRs.
- `content-writer` and `developer`: their #712 records; the #712 PRs listed in section 3.
- `content-reviewer`: `docs/content-review/build-your-first-ai-app.md` and its two commits.
- `product-lead`: `docs/iteration-sweep/sprint-07.md`; the #756 and #763 envelopes;
  `docs/funnel-review/sprint-07.md` once its concurrent author finishes it. At measurement only an
  untracked `docs/funnel-review/collected/sprint-07.tsv` exists; it was not read.
