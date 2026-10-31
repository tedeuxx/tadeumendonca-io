# sprint-07 — retrospective · quality-assurance

commit: 347e59e521a1b3cb5520d8fcdbb637eb5537185c
fed-with: my own `gatekeeper-verdict` markers on the 25 PRs merged 2026-10-17..2026-10-31
(23 in `tedeuxx/tadeumendonca-io`: #730, #756, #757, #760, #761, #763, #764, #766, #767, #769, #770,
#772, #773, #774, #777, #778, #779, #780, #784, #785, #786, #787, #791; 2 in
`tedeuxx/tadeumendonca-skills`: #571, #573), and my own `dispatch-metrics:` records on
`tadeumendonca-io` #712. I read no other persona's artifacts.

Instruments, so every number below can be re-run:

```
gh pr list --repo tedeuxx/<repo> --state merged --search "merged:2026-10-17..2026-10-31" \
  --limit 100 --json number,title
gh pr view <n> --repo tedeuxx/<repo> --json headRefOid,comments \
  --jq '.comments[]|select(.body|startswith("<!-- gatekeeper-verdict"))|.body|split("\n")[1]'
```

Baseline: 25 PRs, 31 verdicts. Every PR carries a verdict whose `head:` names the head it merged at.
The verdicts were: 14 `APPROVE-AND-MERGE`, 9 `APPROVE-AND-MERGE-BOUNDARY`, 4 `APPROVE-PENDING-HUMAN`
(#757, #766, #772, #571) and 4 `REQUEST-CHANGES` (#770, #772, #786, #787). Five PRs carry more
than one verdict, so the literals sum to 31, one per verdict.

## Finding 1 — Three of my four REQUEST-CHANGES rounds blocked on preconditions, not on the diff

**What I saw.** Four verdicts this iteration were `REQUEST-CHANGES`. Only one of them, #786 B1, found
a defect in the work: a plan claim stronger than the vendor page it cited. That needed judgement to
find. The other three blocked on a state of the PR that was readable before anyone dispatched me:

| PR | blocking finding | readable before dispatch with |
|---|---|---|
| #770 | B1: branch cut from `c6edf1b`, trunk at `c324e16`. B2: the `app` workflow `in_progress`, five checks pending | `git merge-base --is-ancestor origin/main <head>`; `gh pr checks 770` |
| #772 (2nd verdict) | the trunk moved after the head I attested, so a rebase was required (root brief rule 23) | `git merge-base --is-ancestor origin/main <head>` |
| #787 | `playwright` red 3 of 3 (`e2e/per-locale.spec.ts:774`). The PR body ran vitest, lint, typecheck and build, not E2E | `gh pr checks 787` |

In each case my verdict said the diff itself was sound ("the draft itself passes every criterion I
could check", "nothing found here is a defect in it").

**What it costs.** Each of these rounds is a full gate dispatch. The only two gate dispatches the #712
metrics recorded (dedupe by `dedupe_key`, keep the largest `duration_seconds`) took **446 s** (PR #778)
and **463 s** (PR #780), each with about 2.3 to 3.6 M cache-read tokens. Two is a small sample, so
read these figures as the size of one round, not as an average. For #772 the moved base also voided
the `agents-lead` marker carry, and arguably the owner's ratification too, so one stale base cost a
lens re-post and an owner act on top of my round.

**The change I propose.** The orchestrator checks three things before dispatching the gate, and
dispatches only when all three hold:

1. the head contains the current trunk;
2. `gh pr checks` reports every check complete and green;
3. a user-visible slice reports a local E2E run.

When one fails, it is fixed without spending a gate round. **Calibration against this iteration:**
this check stops #770, #772 (2nd verdict) and #787, and lets #786 through. #786 still gets its
`REQUEST-CHANGES`, which is correct, because its defect was in the content. **What it does not catch:**
a trunk that moves *during* my review. I would still find that, but at most once.

**The price of leaving it:** about one extra gate round for every three content or loop slices, at
today's ratio. The dispatch-metrics record covers too few dispatches to tell me whether that ratio is
stable.

## Finding 2 — The two-round budget cannot fire, because the round count reached me on 2 of 31 verdicts

**What I saw.** My brief makes the orchestrator supply the round number, forbids me to derive it, and
from round 3 attaches a decision request. Over 31 verdicts the count was supplied **twice**: #786 and
#787, both round 2, both on 2026-10-30. 28 verdicts state that it was not supplied, and #791 inferred
it (see below). #772 carried **three** verdicts (`APPROVE-PENDING-HUMAN` →
`REQUEST-CHANGES` → `APPROVE-AND-MERGE-BOUNDARY`), which is exactly where the round-3 decision request
should have fired. It did not, because I was never told it was round 3.

**A residual about myself, reported because nobody else watches the gate.** On #791 I wrote
*"Round: 1 (the count was not supplied; this is the first gate verdict on the PR, and the PR has one
commit)"*. That is a derivation from PR comments, which my brief calls a guess dressed as evidence. It
happened to be right, but it is the drift the rule exists to prevent.

**What it costs.** The only mechanism that turns *this slice is expensive* into an owner decision is
unused in practice. It has been "written" all iteration and has never been "applied". #772's three
rounds went by with no stated price.

**The change I propose (for the owner to choose; both are cheap):**

- **(a)** The orchestrator passes `round: N` in every gate dispatch. N is the number of
  `gatekeeper-verdict` markers already on the PR, plus one.
- **(b)** My brief admits that same count as the derivation. It is exact for *gate* rounds, because I
  posted every one of those markers myself, at a recorded head. The brief's objection applies to
  reconstructing build rounds, not to counting my own verdicts.

Option (b) moves the counter onto the persona that consumes it, and removes one handoff that failed on 29
of 31 verdicts. Option (a) keeps the fresh-context premise untouched.

**The price of leaving it:** a third or fourth round on a small slice proceeds with no stated cost,
which is the stall the rule was lowered from four to two to catch.

## What I would leave alone

- **Head-scoped verdicts at merge.** All 25 merges carry a verdict naming the head they merged at, and
  no PR was merged on a stale clearance.
- **Hold 2 and its carry-forward rule.** On #757 the hold cost one lens dispatch and no change to the
  diff. On #772 it correctly refused a carry across a moved base.
- **Class enumeration in blocking findings** (#786 B1 enumerated the vendor-claim class, #787 traced
  the convention across prior release commits). Both landed in one repair round.
