# sprint-06 — retrospective scope

commit: c94d4be9967140bebe7539cd402761c7c27d9f32
measured: 2026-10-17

This file holds query output only: no findings, and no consulted persona's retrospective answer was
read for it. The dispatch set below is a lower bound. Codex exposes no reliable per-dispatch metrics in
this session, so this record publishes neither utilization nor token totals.

## 1 · The iteration in both repositories, and what was open when the rite ran

The repository records agree on `loop-mode: scrum`:

```sh
rg -m1 '^loop-mode: ' docs/loop-mode.md
git -C /Users/tadeumen/git-reps/tadeumendonca-skills show origin/main:docs/loop-mode.md \
  | rg -m1 '^loop-mode: '
# loop-mode: scrum
# loop-mode: scrum
```

The observable milestone namespaces were enumerated from the Issues before selecting the iteration:

```sh
gh issue list --repo tedeuxx/tadeumendonca-skills --state all --limit 300 --json milestone \
  --jq '[.[].milestone|select(.!=null)|{number,title}]|unique_by(.number)|sort_by(.number)'
gh issue list --repo tedeuxx/tadeumendonca-io --state all --limit 300 --json milestone \
  --jq '[.[].milestone|select(.!=null)|{number,title}]|unique_by(.number)|sort_by(.number)'
```

| repository | observable milestones |
|---|---|
| `tadeumendonca-skills` | 1 `v0.2.0 Phase 1`; 2 `sprint-01`; 4 `sprint-02`; 5 `sprint-03`; 6 `sprint-04`; 7 `sprint-05` |
| `tadeumendonca-io` | 1 `sprint-01`; 2 `sprint-02`; 3 `sprint-05`; 4 `sprint-06` |

The reviewed milestone reader returned this for `-io` milestone 4:

```sh
python3 /Users/tadeumen/.local/share/personal-multi-harness-workstation-configuration/method/scripts/milestone-read.py \
  4 --repo tedeuxx/tadeumendonca-io
# title: sprint-06; state: open; open_issues: 0; closed_issues: 6
```

No `sprint-06` milestone is observable in `-skills`: the enumeration above ends at milestone 7, and a
read of the next milestone number returns HTTP 404:

```sh
python3 /Users/tadeumen/.local/share/personal-multi-harness-workstation-configuration/method/scripts/milestone-read.py \
  8 --repo tedeuxx/tadeumendonca-skills
# gh failed: gh: Not Found (HTTP 404)
```

The members were selected from the returned Issues; no milestone title was passed to `gh issue list` as
a filter:

```sh
gh issue list --repo tedeuxx/tadeumendonca-io --state all --limit 300 \
  --json number,milestone,state,stateReason,labels \
  --jq '[.[]|select(.milestone!=null and .milestone.number==4) \
          |{n:.number,s:.state,r:.stateReason,l:[.labels[].name]}]|sort_by(.n)'
```

| Issue | type | points | state / reason |
|---|---|---:|---|
| #688 | product | 5 | CLOSED / COMPLETED |
| #715 | loop | 8 | CLOSED / COMPLETED |
| #716 | product | 3 | CLOSED / COMPLETED |
| #717 | product | 1 | CLOSED / COMPLETED |
| #718 | product | 2 | CLOSED / COMPLETED |
| #719 | product | 3 | CLOSED / COMPLETED |

The milestone is still open as a tracker object and holds **0 open Issues**. The `-skills` half has no
iteration object for this title.

## 2 · `loop` items with NO milestone

```sh
gh issue list --repo tedeuxx/tadeumendonca-skills --state open --label loop --limit 200 \
  --json number,milestone \
  --jq '{open_loop:length,unmilestoned:[.[]|select(.milestone==null)|.number]}'
# {"open_loop":0,"unmilestoned":[]}
gh issue list --repo tedeuxx/tadeumendonca-io --state open --label loop --limit 200 \
  --json number,milestone \
  --jq '{open_loop:length,unmilestoned:[.[]|select(.milestone==null)|.number]}'
# {"open_loop":0,"unmilestoned":[]}
```

Calibration: the same label over all states returns 139 Issues in `-skills` and 11 in `-io`, so neither
zero comes from a dead label selector.

## 3 · The derived consult set — a lower bound

### First source: dispatch-metrics records on the six Issues

The canonical step-2 query was run on #715, #688 and #716–#719. Only #715 carries records:

| Issue | comments | distinct `dedupe_key` values |
|---|---|---|
| #715 | `agents-lead` 2; `quality-assurance` 1 | `agents-lead` 1; `quality-assurance` 1 |
| the other five | none | none |

The two `agents-lead` comments on #715 are cumulative records for the same dispatch; the later duration
is 939 seconds, so they are not summed. The records attest only that `agents-lead` and
`quality-assurance` ran on that item. They came from Claude Code's retired-plugin metrics hook. Codex
has no equivalent record in this session; absence on the other five Issues is not evidence that no
persona ran.

### Second source: verdict artifacts on the associated merged PRs

The Issue comments, explicit `Refs #N` bodies and numbered branches associate these PRs with the six
iteration items:

| Issue | associated merged PRs |
|---|---|
| #715 | #727, #766 |
| #688 | #743, #747, #751 |
| #716 | #731 |
| #717 | #734 |
| #718 | #735 |
| #719 | none; it was closed by the owner after GA account work and the method work moved to `tedeuxx/mhw` |

Each PR was read independently:

```sh
gh pr view <n> --repo tedeuxx/tadeumendonca-io --json number,title,comments \
  --jq '{pr:.number,
         gatekeeper:([.comments[]|select((.body//"")|contains("<!-- gatekeeper-verdict:"))]|length),
         harness:([.comments[]|select((.body//"")|contains("<!-- harness-lead-verdict:"))]|length),
         product_copy:([.comments[]|select((.body//"")|contains("<!-- copy-verdict: product-lead -->"))]|length)}'
```

| PR | gatekeeper | harness | product copy |
|---:|---:|---:|---:|
| #727 | 2 | 1 | 1 |
| #766 | 1 | 2 | 0 |
| #743 | 1 | 1 | 1 |
| #747 | 2 | 0 | 1 |
| #751 | 1 | 0 | 0 |
| #731 | 2 | 0 | 2 |
| #734 | 1 | 0 | 1 |
| #735 | 1 | 0 | 1 |

The markers attest exactly three personas:

- `gatekeeper-verdict` attests `quality-assurance` on every associated PR;
- `harness-lead-verdict` attests `agents-lead` on #727, #766 and #743;
- the `copy-verdict: product-lead` envelopes relayed verbatim inside the gate comments attest
  `product-lead` on #727, #743, #747, #731, #734 and #735.

No marker exists for `developer`, `tech-lead`, `content-writer` or `content-reviewer`. The #688 Issue
contains an explicit `product-lead` + `tech-lead` intake stamp dated 2026-10-02, before sprint-06 was
planned on 2026-10-10; it is not evidence that `tech-lead` ran during this iteration. PR authorship and
branch names do not distinguish a human from a persona, so they are not used to hand-add `developer`.
No sprint-06 file under `docs/content-review/` was found, so neither content persona is hand-added.

### Subtracted by property

`scrum-master` is excluded even if it was involved in planning. Its installed Codex brief declares an
empty tool grant (`tools: []`), so it cannot write its own respondent file; the rite refuses an
orchestrator relay.

## 4 · The recorded consult set

**`agents-lead`, `quality-assurance`, `product-lead`.**

**This is a lower bound.** A persona that ran under Codex and left no verdict or tracked artifact is
indistinguishable from one that never ran. No utilization percentage, aggregate duration or token total
is derivable across the iteration, so none is published.

## 5 · Evidence available for the isolated respondent files

- `agents-lead`: the deduplicated #715 dispatch-metrics record; harness markers on #727, #766 and #743;
  those PRs and the Issues they reference.
- `quality-assurance`: the deduplicated #715 dispatch-metrics record; gate markers on all eight PRs;
  those PRs and the six iteration Issues.
- `product-lead`: the six relayed copy-verdict envelopes listed above; those PRs and the Issues they
  reference; `docs/funnel-review/sprint-06.md` once its concurrent author finishes it.

No `docs/iteration-sweep/sprint-06.md` file exists at this commit, so the `product-lead` consultation
cannot be fed a sprint-review report. The funnel-review files exist only as untracked concurrent work
at measurement time; their content was not read for this scope record.
