# sprint-07 — retrospective · content-reviewer

commit: 347e59e521a1b3cb5520d8fcdbb637eb5537185c
fed-with: `docs/content-review/build-your-first-ai-app.md` (Round 1 at 45856ee, 2026-10-19; Round 2 at
876c54b, 2026-10-24; three later "not a review round" sections written by other hands); Issue #712
(the owner's preview-read comment 6532308225 and the correction comment 6533472379); PRs #770, #778,
#780, #784, #786, #787 (file lists and the gate verdict markers on #786).

## Finding 1 — the second round went on a three-line retitle, and the prose that came after it got no round

**What I saw.** The pair's two rounds were spent on the two smallest diffs to this piece. The four
largest changes came after the cap was spent, and none of them got a round.

| PR | what changed in each edition | round |
|---|---|---|
| #770 | the first draft | Round 1 |
| #778 | title, +3 −3 lines | Round 2, the last one allowed |
| #780 | reframe, +19 −13 | none |
| #784 | the revision after the preview read, +117 −80 (new section, copyable prompt, ~700 more words) | none, cap spent |
| #786 | prerequisites, plans, limits, +19 −1 | none, cap spent |

**The artifacts that show it.** The review file has `grep -c '^## Round'` → 2. The 2026-10-30
sections are headed "not a review round" and say that `content-reviewer` did not read them. Line counts
come from `gh pr view <n> --repo tedeuxx/tadeumendonca-io --json files`. On #786 the gate posted
`REQUEST-CHANGES` at head a968556. Its findings were claims stronger than the sources the piece itself
cites: "on by default", sharing on Free, and the plan list. A claim that goes further than its own
cited source is the kind of thing ground 2 (*false against the source*) exists to catch. Whether all
four were within my reach is my reading; I did not re-check them.

**What it costs.** The round counter works as a budget spent on whichever change comes first, not on
the changes that carry the most new claims. The owner's preview read is the step most likely to cause
a large rewrite. Under the current bound, that rewrite reaches the gate with no ruler pass. Here the
gate caught the false claims, at the cost of one extra gate cycle. When the gate does not catch them,
they reach the owner unread.

**What I propose, for the owner to rule on.** Restart the two-round bound at the owner's preview read,
and at nothing else. `content-publishing` leaves the reset question open on the ground that *"a bound
that can be reset by the party it constrains is not a bound."* A reset triggered by the owner's own
recorded read is not reset by that party. It is also observable, because his preview-read comment on
the Issue is the trigger. **The price of leaving it as it is:** every revision after the preview gets
only the gate's own falsification check, and the copy lens never reads it.

## Finding 2 — my rounds ran the checklist the brief named, missed rule 22, and the owner's preview read then asked for exactly rule 22

**What I saw.** Round 1's "Checks the brief named" covers rules 11, 14, 15, 16, 17, 18, 23 and the
title gate. It does not cover rule 22 (*a piece is LAYERED … the surface is the ENTRY*) or the
two-audiences section. The owner's preview read (comment 6532308225, item 3) said:
«mta densidade tecnica … precisa ser para as duas audiencias alvos do site, nao apenas a galera de
engenharia». That is rule 22's subject. The result was the largest revision the piece had (#784).

**The artifact that shows it.** Round 1, lines 97–116 of the review file. No line there names rule 22,
rule 25, or *Two audiences, one text*.

**What it costs.** A citable defect showed up as a full rewrite after the preview instead of as a
finding before it. Part of the cause is mine: I let the dispatch's checklist set what my round
covered, when the ruler should have set it. The other part is in the protocol. A rule-22 failure
usually **cannot be repaired in place**, because restructuring a piece's layers is authorship. The
round template has no section for "citable, not repairable here", so my rounds have nowhere to put the
kind of finding that most often comes back from the owner's preview.

**What I propose.** Two changes, both to how this pair works:
1. Every round reads the ruler's numbered rules 9–25 and the title gate as its own checklist, whatever
   the dispatch names. A brief may add checks but does not narrow the list.
2. Add one section to the round template, `### Citable, not repairable in place`. Each entry quotes
   the clause, says why an edit would be authorship, and goes to the writer and the owner. This is the
   output `published-voice` already prescribes for rule 15; the template just gives it a heading. It
   uses the existing literal `CONTENT-REVIEW-FINDINGS`, not a third one.

## What I would leave alone

- **The repair-not-block ruling.** Round 1 made four repairs: two on ground 1, two on ground 2, one of
  them the human-in-the-loop takeaway, which contradicted his own sentence. Each cost a sentence and
  none needed a handback.
- **Keeping the "not a review round" sections out of the `## Round` count.** The count stayed honest at
  2, and the headings say who did not read them.
- **Leaving the owner's own title alone in Round 2**, and raising the "four checks / three things"
  mismatch only as advisory.
