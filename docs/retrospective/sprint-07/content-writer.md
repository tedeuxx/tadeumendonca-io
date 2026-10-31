# sprint-07 — retrospective · content-writer

commit: 347e59e521a1b3cb5520d8fcdbb637eb5537185c
fed-with: my `dispatch-metrics:` records on tedeuxx/tadeumendonca-io #712 (deduped by `dedupe_key`,
greatest `duration_seconds` kept, never summed); `git log --since=2026-10-17 --
apps/fed/src/content/blog/build-your-first-ai-app*` and the retired-slug history before f609911
(3b6dbc9 → 6346bf1); Issue #712 body and comments; PRs #770, #778, #780, #784, #785, #786, #787.
Not read: the review file `docs/content-review/` and every other persona's artifact, as instructed.

My dispatches on #712 in the window, one row per `dedupe_key`:

| branch | duration_seconds (max) | tool_calls | PR |
|---|---:|---:|---|
| content/712-retitle | 140 | 19 | #778 |
| content/712-reframe | 15,039 | 46 | #780 |
| content/712-preview-read | 459 | 40 | #784 |
| content/712-prerequisites | 1,955 | 64 | #786 |
| content/712-release | 931 | 35 | #787 |
| content/712-social | 213 | 21 | (social record branch) |

The first draft (#770, 3b6dbc9, 2026-10-19) has no record of mine on #712 in this set. The 15,039 s
reframe figure is wall clock. It includes the time spent waiting on the owner's title answers, so it
is not a measure of work. One `sp:8` piece produced seven merged PRs: #770, #778, #780, #784, #785,
#786 and #787. Four of them merged on 2026-10-30, the day the piece was released.

## Finding 1 — the reader's gain was first asked at the preview, so the piece's subject changed after two review rounds

**What I saw.** The Issue was filed with `<!-- owner-take: supplied -->`. It quotes three lines from
the owner's prompt and says *"No separate interview was run."* All three lines are about the
**method** (validation, scheduling, the human-in-the-loop policy). None says what the reader gains.
I drafted against that spine. The first review round repaired the draft in place, and the piece went
to the held preview. There the owner rejected the title on reader-gain grounds: *«nao conecta com o
que o nosso leitor ganha ao ler o artigo ate o final»*. On 2026-10-24 he rejected three more
titles. Only when he was asked *what the reader holds at the end* did the real subject appear: an
AI application, low code, built without knowing how to program, *«apenas conversando»*. The piece
was then reframed (#780), retitled twice more and moved to a new slug (f609911). Its subject today
is not the one the Issue's title and description still name.

**The artifacts.** #712 comments from 2026-10-24T15:30 to 20:36, which record four title decisions
and the reframe. The commits 9840be8, 739b525, c246805, 8292112 and f609911. The Issue title, still
*"validating what an agent reads and returns"*, against the shipped slug `build-your-first-ai-app`.

**What it cost.** A second round section, a reframe PR and a slug move. Four title pickers for the
owner in one day. The longest dispatch I ran this iteration. The Issue's own *"how we would know it
worked"* (replies that engage the validation pattern) now measures a piece that was never published.

**The change I propose.** When a prompt or note supplies a `content` take, intake still asks the
owner one question before `ready`: the title gate's clause 3, *what does the reader go and do, or
hold, after the last paragraph?* His answer is recorded verbatim beside the supplied take. A supplied
take answers *what he thinks*, and this question answers *what the reader gets*. This iteration
shows the two are different. When a reframe changes the subject, the Issue description is
re-closed before the next draft. Otherwise, the price of leaving it: every piece whose take arrives
as a prompt runs the title-and-spine search at the preview, the most expensive point in the lane,
with the owner as the search engine.

## Finding 2 — the do-it-yourself half of the piece came from the owner's preview reads, and its vendor claims came unsourced

**What I saw.** The reframe made this a piece for the AI-curious tier: content *they can do
themselves*. My brief states that mandate. The `published-voice` rules that make it concrete already
existed when I drafted: rule 22 (layered), rule 14 (the close names one act) and the title gate's
clause 3 (an experiment). Yet two owner preview reads on 2026-10-30 had to ask for exactly that
half. The first asked for an illustration of the solution before the first paragraph, a demo to
open, lower density, and a copyable prompt (#784). The second asked for every prerequisite,
limitation and required subscription to be declared (#786). The plan questions went to the owner on
release day (*«voce deve avaliar o minimo necessario»*). I worked the answers in from the
orchestrator's findings comment. The gate on #786 then checked the cited vendor pages and found plan
claims those pages do not support: the default state of a setting, which plans include scheduled
tasks, and whether link sharing works on the free plan. I corrected them in ca264fb.

**The artifacts.** The commit bodies of 5d813a6, c678f61, 281e4fb and ca264fb. The #712 comments
"Owner preview read" (20:00), "Owner preview read 2" (20:36), "Prerequisites" (20:48) and
"Correction to the findings" (21:07), all on 2026-10-30. The prerequisites dispatch's 64 tool calls,
the most of any dispatch I ran.

**What it cost.** Three content PRs and three gate passes in one evening (#784, #786, #787), plus a
developer fix (#785) that a preview comment surfaced. The false claims were caught by the merge gate,
not inside the drafting pair. As `content-publishing` says, the review pair's grounds reach the ruler
and the source, never the world. A vendor's plan page is the world.

**The change I propose.** Before the first held preview of a piece for the AI-curious tier, I draft
the do-it-yourself block myself: what the reader needs (accounts, plans, cost, a computer that stays
on), what this version does not do, and the one act to start with. Each vendor or plan claim in that
block cites the vendor's own page, which I read at drafting time, never a relayed summary. A claim I
cannot cite becomes a question on the Issue, not a sentence. This is a drafting instruction, held by
my own brief, and it needs no new mechanism. The price of leaving it: the owner's preview read stays
the place where tier-1 completeness is discovered, and vendor claims on this lane are checked only
when the gate happens to fetch the page.

## What I would leave alone

- **The held preview at the real URL.** Every substantive correction on this piece came from the
  owner reading the real page. That is the lane working. The cost above comes from the first preview
  arriving with the subject and the do-it-yourself half still open, not from previewing.
- **One PR per owner read.** It is expensive, and it keeps each revision a separate diff the gate can
  read. Batching reads would trade that for fewer merges, and I would not make that trade on a piece
  in his voice.
- **Recording each owner answer on the Issue verbatim.** Every finding above was reconstructable from
  #712 alone. That is why this file could be written without opening anyone else's artifact.
