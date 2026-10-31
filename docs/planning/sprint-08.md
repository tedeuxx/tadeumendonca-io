# sprint-08 — planning

commit: 1c298e3 (branch `review/sprint-07`, cut from `origin/main` a94f0f0)
assembled: 2026-10-31  ·  repositories: `tedeuxx/tadeumendonca-io`, `tedeuxx/tadeumendonca-skills`

## Step 0 — loop mode

```
grep -m1 '^loop-mode: ' docs/loop-mode.md                                   # -> loop-mode: scrum   (-io)
git -C <skills> show origin/main:docs/loop-mode.md | grep -m1 '^loop-mode: ' # -> loop-mode: scrum   (-skills)
```

Both repositories agree. This planning does not change the mode.

## The pool as assembled

```
gh issue list --repo tedeuxx/<repo> --state open --limit 200 --json number,title,labels,milestone \
  --jq '.[]|select(.milestone==null)|[.number,(.labels|map(.name)|join(",")),.title[0:70]]|@tsv'
```

eligible: 11 (-io 11, -skills 0) · awaiting the owner: 6 · content (not drained): 51 in -io
- awaiting the owner, or blocked: -io #655 and #597 (no `ready`), #781 and #691 (`blocked`); -skills #578 (no `ready`), #576 (`blocked`).
- no routing label, so no class reaches them: -skills #577, #575, #574, #570.
- carried over, invisible to this predicate: -io #712 (`content`, `ready`, `sp:8`) is still in the open `sprint-07` milestone.

proposals read from `docs/retrospective/sprint-07/`: 12 findings across 6 files (`agents-lead`,
`content-reviewer`, `content-writer`, `developer`, `product-lead`, `quality-assurance`).
sweep report read: `docs/iteration-sweep/sprint-07.md`, judgement half.
funnel candidates open in `docs/funnel-review/`: 0. `grep -nE '^(Candidate rule|Evidence|Ruled):' docs/funnel-review/*.md`
prints nothing (exit 1). The store holds `sprint-06.md` and `sprint-07.md`, and both are `FUNNEL-REVIEW-RAN`.
Neither carries a candidate.

Closing-rite order this iteration, from this branch's history: sweep `990a502` → funnel `4e11cad` →
retrospective scope `347e59e` → retrospective files `1c298e3` → this planning.

## The ranking as returned

`scrum-master`, dispatched once, 2026-10-31. It was given the pool above verbatim, and its record is
summarised here, not quoted.

1. -io #790 `loop` `sp:2`. It comes first by #339 because it is the only eligible `loop` item.
2. -io #456 `product` `sp:13`.
3. -io #575 `product` `sp:3`.
4. -io #635 `product` `sp:2`.
5. -io #640 `product` `sp:8`.
6. -io #662 `product` `sp:8`.
7. -io #669 `product` `sp:8`.
8. -io #710 `product` `sp:3`.
9. -io #783 `product` `sp:5`.
10. -io #788 `product` `sp:5`.
11. -io #789 `product` `sp:5`.

Positions 2 to 11 are decided by the tiebreak only. No ratified rule orders within a class; the
intra-class sequence is a filing-order tiebreak, not a ranking.

Its process findings, in short:
- It could not confirm that the funnel review ran. It did run: commit `4e11cad` carries
  `FUNNEL-REVIEW-RAN`, and it landed before the retrospective files.
- #790 may be ready to close rather than to plan. Its PR #791 merged, and the probe ran this
  session (#790, issuecomment-6545920215). The session tried to close it as completed, and the
  permission layer denied that (external system write). It stays in the pool.
- The `sprint-07` milestone is still open and holds #712. Closing it is not part of this ranking.
- It could not rank the 12 retrospective findings. They are candidates and enter the activation as a count.
- The four -skills Issues with no routing label cannot be reached by any pool predicate.
- #669 and #788 both cover the IP step of locale resolution. `tech-lead` and `product-lead` should
  judge any dependency between them before parallel builds.
- The tiebreak puts #456, the largest item at `sp:13`, at the first product position. That is filing
  order, not priority.

## The composition as proposed — every eligible item, in or out, with why

| # | item | in/out | why |
|---|---|---|---|
| 1 | -io #790 harness: drop the project chrome-devtools server | in | `loop` before `product` (#339) |
| 2 | -io #456 Reconcile every ADR against the capability definition | in | eligible; tiebreak only — no ratified rule orders within this class |
| 3 | -io #575 A held draft must declare its content Issue | in | eligible; tiebreak only — no ratified rule orders within this class |
| 4 | -io #635 «Promotion is one edit» at three sites | in | eligible; tiebreak only — no ratified rule orders within this class |
| 5 | -io #640 The analytics schema page | in | eligible; tiebreak only — no ratified rule orders within this class |
| 6 | -io #662 Instagram Stories card generator | in | eligible; tiebreak only — no ratified rule orders within this class |
| 7 | -io #669 Locale resolution: IP step at the edge | in | eligible; tiebreak only — no ratified rule orders within this class |
| 8 | -io #710 Slice B: per-article cover and OG | in | eligible; tiebreak only — no ratified rule orders within this class |
| 9 | -io #783 ci: release token expires on a calendar | in | eligible; tiebreak only — no ratified rule orders within this class |
| 10 | -io #788 Locale resolution: client IP step | in | eligible; tiebreak only — no ratified rule orders within this class |
| 11 | -io #789 Reader share-to-Story | in | eligible; tiebreak only — no ratified rule orders within this class |

Proposed: 11 items, 62 sp (1 `loop` 2 sp, 10 `product` 60 sp). Left out of the eligible pool: 0.
No ratified rule bounds iteration size. This is 62 sp against sprint-07's 12 sp.

## The activation log

**Activation 1** (2026-10-31): one structured picker. The question said: Sprint-08: 11 items, 62 sp
(#790 loop + 10 product); 12 retrospective findings, none becomes an Issue by default; funnel
candidates: 0. Confirm? To change something, write it in the free-text field. It offered three
options: confirm without #790 (10 product, 60 sp; #790 is already done and the owner closes it),
confirm all 11 (loop-first applied exactly), and stop (nothing is created).
The owner answered: **«Confirmar os 11»**. There was no second activation.

Retrospective findings: none named, so none becomes an Issue. Funnel candidates: 0, so no `Ruled:` line is owed.

## The composition as confirmed

Milestone `sprint-08` was created in `tedeuxx/tadeumendonca-io` as number 6 (2026-10-31T19:01:29Z),
by `milestone-create.py` with `--description-file`. The 11 items were admitted with
`gh issue edit <n> --milestone "sprint-08"`, and each was verified by issue:
`milestone-read.py 6` reports `open_issues: 11`. No milestone was created in `-skills`, because
nothing there was admitted.

Ordered body, as written into the milestone description:

```
1. #790 (loop, sp:2), loop before product (#339)
2. #456 (product, sp:13)
3. #575 (product, sp:3)
4. #635 (product, sp:2)
5. #640 (product, sp:8)
6. #662 (product, sp:8)
7. #669 (product, sp:8)
8. #710 (product, sp:3)
9. #783 (product, sp:5)
10. #788 (product, sp:5)
11. #789 (product, sp:5)
```

Positions 2 to 11 follow the filing-order tiebreak, not a ranking. The total is 62 sp.

## Worklog snapshot

`docs/planning/sprint-08.worklog.json`: repository `tedeuxx/tadeumendonca-io`, milestone 6, eleven
counting units with their recorded `sp:N`. The start and end boundaries are `null`, because the
owner set none.

## Estimation pendency this leaves

Every proposed item already carries `sp:N`. None is pending.

## What could not be assembled

- Only two repositories were enumerated. The list was supplied, not derived.
- The carried-over class: -io #712 is open in `sprint-07` and invisible to the assembly predicate.
- The four -skills Issues with no routing label match no class.
- Retrospective findings and sweep judgement items have no Issue, so none can be composed.
  They become Issues only where the owner names them.
