# sprint-07 — planning (re-plan)

commit: f9436d35dd0dd8aa931f12f826a17769344a4a15
assembled: 2026-10-24  ·  repositories: `tedeuxx/tadeumendonca-io`, `tedeuxx/tadeumendonca-skills`
mode: `scrum` in both repository records (`loop-mode: scrum` in each `docs/loop-mode.md`) · `wip: unbounded` in both

**This is a re-plan, not a first planning.** Milestone `sprint-07` already existed in this repository
as #5, holding #712 (`content`, `ready`, `sp:8`) as its only item. This rite re-assembled the pool
around it and admitted two `product` items. Nothing was removed from the milestone.

**The milestone description is stale against the mode records.** Read with
`python3 <method>/scripts/milestone-read.py --repo tedeuxx/tadeumendonca-io 5` at assembly, it says
*"No product build entered this sprint"* and that the loop queue continues *"under Kanban WIP=1"*.
Both records read `loop-mode: scrum` and `wip: unbounded`, and two `product` items enter below. The
description is rewritten by the orchestrator after this file lands; until then this file is the
correct record.

## The pool as assembled

eligible: 2 · awaiting the owner: 9 · blocked: 1 · unrouted: 1 · content (not drained): 50 open, 14 `ready`
proposals read from `docs/retrospective/sprint-06/`: 6 findings across 3 persona files (see *What could not be assembled*)
funnel candidates open in `docs/funnel-review/`: 0

- **eligible** (`product` or `loop`, `ready`, not `blocked`, no milestone): io #663 and #765, both
  `product`, both without `sp:N`. Skills: none.
- **awaiting the owner** (io `product` without `ready`): #710, #669, #662, #655, #640, #635, #597,
  #575, #456.
- **blocked**: io #691 (`product`, `reader-facing`, `blocked`).
- **unrouted**: skills #570 carries no routing label, so no predicate can place it.
- **content**: 50 open io Issues, 14 of them `ready` (#712, already in the milestone, is one of
  each). Not drained, by rule; the owner selects content one piece at a time.

Reproduce (live tracker). The skills line prints `unrouted` only:

```sh
for repo in tadeumendonca-skills tadeumendonca-io; do
  gh issue list --repo "tedeuxx/$repo" --state open --limit 200 --json number,labels,milestone \
    --jq '[.[]|select(.milestone==null)|(.labels|map(.name)) as $l
           |if ($l|index("content")) then (if ($l|index("ready")) then "content-ready" else "content" end)
            elif (($l|index("product")) or ($l|index("loop")))
              then (if ($l|index("blocked")) then "blocked" elif ($l|index("ready")) then "eligible" else "awaiting" end)
            else "unrouted" end]
          |group_by(.)|map({(.[0]):length})|add'
done
# 2026-10-24 → skills {"unrouted":1}
#              io     {"awaiting":9,"blocked":1,"content":36,"content-ready":13,"eligible":2}
gh issue list --repo tedeuxx/tadeumendonca-io --state open --label content --limit 200 --json labels \
  --jq '[length, ([.[]|select(.labels|map(.name)|index("ready"))]|length)]'
# → [50,14]
```

Funnel candidates, with the regex calibrated against a file that carries the column-0 fields:

```sh
git -C <io> grep -nE '^(Candidate rule|Evidence|Ruled):' origin/main -- 'docs/funnel-review/'   # no output, exit 1
grep -cE '^(Candidate rule|Evidence|Ruled):' <method>/commands/funnel-review.md                 # 5
```

`docs/funnel-review/sprint-06.md` carries `FUNNEL-REVIEW-RAN` and says in its own text that no
candidate rule is proposed.

## The ranking as returned

`scrum-master` returned the ranking below. **It reached this file through the orchestrator's dispatch
brief, not copied from the dispatch's transcript**, so it is the relayed content and not a byte-for-byte
copy of the handback.

1. #663 `product` (no `sp:N`): GA channels — the default grouping collapses every social source, and the
   same platform arrives under several identities. Tiebreak only (issue number ascending).
2. #765 `product` (no `sp:N`): the funnel-review store, its first report's internal-traffic line, and
   activating the Internal Traffic filter. Tiebreak only.

No ratified rule orders items within a class. There are no eligible `loop` items, so loop-first places
nothing; the whole order is the tiebreak.

Its process findings, as relayed:

- The milestone description is stale against the pool and against the mode records (*"no product
  build"*, *"Kanban WIP=1"*).
- Neither eligible item carries `sp:N`.
- The loop order the description names (mhw#193 → mhw#195 → mhw#196 → mhw#197) lives in a third
  repository, `tedeuxx/mhw`, outside this pool.
- The sprint-06 closing rites' artifacts are absent. **This finding rests on a false premise — see
  *What could not be assembled*: the retrospective and the funnel review exist; only the sweep is
  absent.**
- skills #570 carries no routing label.
- Whether `tadeumendonca-skills` carries a paired `sprint-07` milestone was not verified.

## The composition as proposed — every item in the pool, in or out, with why

| # | item | in/out | why |
|---|---|---|---|
| — | io #712 | in (already) | committed before this re-plan; `content`, `ready`, `sp:8`; selected by the owner 2026-10-19 |
| 1 | io #663 | in | eligible (`product` AND `ready`, not `blocked`); position is `tiebreak only` |
| 2 | io #765 | in | eligible (`product` AND `ready`, not `blocked`); position is `tiebreak only` |
| — | io #710, #669, #662, #655, #640, #635, #597, #575, #456 | out | `product` without `ready` |
| — | io #691 | out | `blocked` |
| — | skills #570 | out | no routing label |
| — | io content (49 unmilestoned) | out | `content` is selected one piece at a time, never drained |

## The activation log

**Activation 1** (2026-10-24): a structured picker with three options — admit both (#663 and #765),
admit only #663, admit nothing. The owner answered **«Admitir as duas (Recommended)»**.

One activation; the rite's bound of two was not reached.

**Activation 1 did not carry the count of sprint-06's six retrospective findings**, because the
orchestrator assembled the pool believing `docs/retrospective/sprint-06/` did not exist (see *What
could not be assembled*). So the owner did not rule on those findings in this activation. That
omission cannot be repaired here, because a ruling cannot be backdated. The original sprint-07
planning is the likely consumer of those findings: its milestone was created on 2026-10-18, the day
after the retrospective landed on 2026-10-17. **That is unverified.** The creation date was relayed by
the orchestrator. Reading the milestone's `created_at` from here was refused by the permission layer
(`gh api` is not allowlisted), and `milestone-read.py` does not return it.

The ruling is recorded on #663 and #765 as comments carrying his answer verbatim (both posted
2026-10-24, 15:22Z):

```sh
gh issue view 663 --repo tedeuxx/tadeumendonca-io --json comments --jq '.comments[-1].body'
gh issue view 765 --repo tedeuxx/tadeumendonca-io --json comments --jq '.comments[-1].body'
```

## The composition as confirmed

sprint-07 (`tedeuxx/tadeumendonca-io` milestone #5) = #712 (committed) + #663 → #765.

The order between #663 and #765 is the filing-order tiebreak, not a ranking.

**Appended after step 4.** The first commit of this file preceded the tracker writes, per the rite's
step 5. The orchestrator then:

- rewrote the milestone description with `milestone-update.py`, passing the prior description
  byte-exact through `--expect-file`;
- admitted #663 and #765 to the milestone.

That is a check-then-write, not an atomic compare-and-swap. The description now on the milestone, read
back with `milestone-read.py --repo tedeuxx/tadeumendonca-io 5` (state `open`, 3 open issues,
0 closed):

```
Scrum commitment for Sprint 07 (re-planned 2026-10-24, owner-confirmed at /sprint-planning sprint-07).

Goal: deliver the owner-selected reader-facing content and the two ready product items.

Committed scope, in order:
1. tadeumendonca-io#712 — content, reader-facing, ready, sp:8 (owner-selected; outside the drain).
2. tadeumendonca-io#663 — product, ready (GA channel grouping).
3. tadeumendonca-io#765 — product, ready (funnel-review store and internal-traffic filter).

The order between #663 and #765 is a filing-order tiebreak, not a ranking. Loop mode of record: scrum in both repositories (docs/loop-mode.md). Planning record: docs/planning/sprint-07.md.
```

The description does not carry the `sp:N` of #663 and #765, which were applied after it was written.
The labels are the carrier. Admission, read back one Issue at a time:

```sh
for n in 712 663 765; do
  gh issue view $n --repo tedeuxx/tadeumendonca-io --json number,labels,milestone \
    --jq '"\(.number) m=\(.milestone.number) \(.labels|map(.name)|join(","))"'
done
# 712 m=5 content,reader-facing,ready,sp:8
# 663 m=5 product,ready,sp:1
# 765 m=5 product,ready,sp:3
```

Committed points: 8 + 1 + 3 = 12.

### Finding: the drain cannot build #663

All four `product` estimators said, each in their own isolated dispatch, that #663 has no repository
slice. Its steps are the owner's own acts in the GA interface, and its only repository-side check is
the `grep` in its acceptance criterion 4. **So `developer` has nothing to build for #663, and it needs
the owner's hand.** A drain that selects it will reach the owner rather than a merge request. It is an
action pendency (an order and a link), not a decision.

### Finding: #765's `sp:3` sizes work delivered before this sprint

#765's build slice merged before this planning ran. It is PR #773, merged 2026-10-19 as
`c9a23af5ce06dba6072106dfbb10a2f8f6367cfc`, an ancestor of the commit this pool was assembled from:

```sh
gh pr view 773 --repo tedeuxx/tadeumendonca-io --json state,mergeCommit,mergedAt
# MERGED c9a23af5ce06dba6072106dfbb10a2f8f6367cfc 2026-10-19T14:47:22Z
git merge-base --is-ancestor c9a23af5ce06dba6072106dfbb10a2f8f6367cfc f9436d35dd0dd8aa931f12f826a17769344a4a15   # exit 0
```

What keeps #765 open is acceptance criterion 8 only, as relayed by the orchestrator: the owner's
read-only read of GA, then a follow-up commit replacing four `unverified` lines. **The estimators
sized the original slice, not the AC8 remainder.** So the 3 points counted in this sprint cover
delivery that predates it. The worklog snapshot says so in that unit's provenance. A points-per-week
figure that counts #765 at close will overstate what sprint-07 built.

### Finding: the drain has nothing buildable in sprint-07

Both admitted `product` items now wait on owner actions in the GA interface: #663 entirely, and #765
for its AC8 read. #712 is `content`, which is selected and never drained. **No item in sprint-07 is
buildable by the drain.** Each step that remains is an owner action or a follow-up to one.

## Worklog snapshot

`docs/planning/sprint-07.worklog.json` holds:

- repository `tedeuxx/tadeumendonca-io`, milestone number 5;
- three counting units, 12 points: #712 (`sp:8`), #663 (`sp:1`) and #765 (`sp:3`);
- for #663 and #765, the four isolated estimates and their median;
- the timezone.

`starts_at` and `ends_at` are `null`: the owner set no boundary.

~~**This snapshot is not yet readable by the worklog reporter.** `worklog.py` requires every counting
unit's `planned_points` to be a positive integer, so the two `null` estimates make `worklog.py report`
refuse the file.~~ **Struck after step 4:** the estimates landed and both `null`s are replaced, so
every unit now carries a positive integer.

Estimates: the `product` estimators, each a separate isolated dispatch, 2026-10-24; the median is
recorded.

| item | product-lead | tech-lead | developer | quality-assurance | recorded |
|---|---|---|---|---|---|
| #663 | 1 | 1 | 1 | 2 | 1 (median 1) |
| #765 | 3 | 3 | 3 | 3 | 3 |

The votes were relayed by the orchestrator. The labels were verified with `gh`, as above.

## Estimation pendency this leaves

~~#663 and #765 carry no `sp:N`. An estimation pass is running.~~ **Struck after step 4: none.**
Each of the three admitted items carries exactly one `sp:N` (see *The composition as confirmed*).
#663 still needs the owner's hand, as the finding above says. That is not an estimation pendency.

## What could not be assembled

- **The dispatch premise about sprint-06's closing rites was false, and it is corrected here rather
  than inherited.** The brief said no `docs/retrospective/sprint-06/` exists in either repository.
  At `f9436d35` this repository carries `docs/retrospective/sprint-06/` (`00-scope.md` plus three
  persona files, six `## Finding` sections) and `docs/funnel-review/sprint-06.md` (`FUNNEL-REVIEW-RAN`),
  both landed in `3fb76a0` (2026-10-17). What is genuinely absent is the **sprint review's sweep**:
  `docs/iteration-sweep/` ends at `sprint-05.md`. That absence is the handoff finding, and it is the
  only missing sprint-06 closing-rite artifact.

  **How the false premise arose: an orchestrator defect.** The orchestrator's `ls` listed the
  retrospective directory in this repository and a path that did not exist, in one command. Under zsh
  a glob that matches nothing aborts the whole command, so `ls` printed nothing. The empty output was
  read as "absent". That is an absence read from a check that never ran. Its consequence is in *The
  activation log*: activation 1 did not carry the six findings.

  ```sh
  git -C <io> ls-tree -r --name-only origin/main docs/retrospective/sprint-06 docs/funnel-review/sprint-06.md
  git -C <io> ls-tree --name-only origin/main docs/iteration-sweep/   # ends at sprint-05.md
  ```

- **The six sprint-06 findings were not traced to Issues.** A title search finds open mhw Issues whose
  titles match three of them (mhw#193, #195, #197) — a title match, not a verified trace. Those are the
  loop order the milestone description names, in a repository outside this pool, so none of the six
  enters here as a candidate.
- **The paired skills milestone was not checked.** Skills contributes nothing to this re-plan, so no
  skills milestone is needed; whether one titled `sprint-07` exists was not verified.
- **The ranking is relayed**, not copied from the `scrum-master` transcript (see *The ranking as
  returned*).
- The repository list was supplied, not derived.
