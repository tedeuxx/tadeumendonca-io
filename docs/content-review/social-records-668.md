# Content review — the four reconstructed launch-post records (#668)

One review file for four records. A per-record name would collide with the existing article reviews
`blast-radius-supernova.md` and `what-my-agents-do.md` in this directory, so the file is named after the
Issue, as `what-my-agents-do-addendum-732.md` was.

These are records, not prose in the owner's voice. The rulers are the acceptance criteria in the
product-lead intake comment on #668 and `published-voice`; the only source is the main session's
transcription of the live posts, read on 2026-10-19 and handed over in the dispatch (a session
scratchpad, not tracked here). Repairs would be made on two grounds only: a clause of either ruler, or
a claim false against that source.

## Round 1 — 2026-10-19

drafts, all at commit `50871651e0251e1d671bf5fbcc04b0101e44aa5c` on `content/668-social-records`:
- `docs/social/my-commitment.md`
- `docs/social/the-problem-stopped-changing.md`
- `docs/social/blast-radius-supernova.md`
- `docs/social/what-my-agents-do.md`

### What was checked, and with what

1. **Every body is byte-identical to its source (AC 2).** Each fenced body was extracted from the record
   and compared as UTF-8 bytes with the matching block of the transcription: two LinkedIn bodies, three
   X single posts and the three posts of the `my-commitment` thread. Eight of eight are identical.
   The comparison was calibrated: one space added to one source block turned exactly that comparison
   from identical to different, and the copy was discarded.
2. **The not-found entries guess at no reason (AC 3).** Both LinkedIn sections (`my-commitment`,
   `the-problem-stopped-changing`) carry no body and no URL, name the search date and where it looked,
   and say the absence is not explained. The transcription lists three possible explanations; none of
   them was carried into a record.
3. **Each honest-limit clause is dated 2026-10-19 (AC 4).** All four are, near the top, in each file's
   own words. Each says the record was written from the live post after publication, that the body holds
   and the reasoning does not, and how an edited post is handled. The two LinkedIn posts the source marks
   edited are recorded as edited; the X posts are recorded with no edit marker, as the source says.
4. **No gap is filled with plausible reasoning (AC 5).** Every *why* in the four files is either a listed
   gap or points at an artifact: ADR-0038 §C (present at head) and the #666 amendment.
5. **Links are kept as shipped (AC 6).** In-body links match the source byte for byte (`lnkd.in`,
   `t.co`, and the one full `/en/` URL in the `my-commitment` thread). Nothing is normalised. Each file
   places its posts against the 2026-09-19 share-link convention; `what-my-agents-do` leaves the
   same-day order open as a gap instead of asserting it, which is the honest form.
   `gh pr view 666 --repo tedeuxx/tadeumendonca-io --json mergedAt` returns `2026-09-20T12:55:10Z`,
   which matches the record.
6. **Every count ships with its command, and the command reproduces it (AC 7).** Each file's
   *Character counts* command was run from the worktree root at this commit. All eighteen figures came back
   as stated (whole post, blocks, raw and weighted X counts). The two ceiling percentages (85% and 97%)
   follow from 2564 and 2904 over 3,000.
7. **Scope and names (AC 1, AC 8).** `git diff --name-status origin/main...HEAD` lists four `A` lines
   under `docs/social/` and nothing else; `origin/main` is still `cc2baf5`. No client is named. The
   names that do appear are public figures and the owner's own employer, quoted from the live posts.
   Article URLs, titles and publication dates in the headers match the articles' front matter.

### Repaired

Nothing. No edit was made to any record: no finding could be placed under either ground.

### Advisory and droppable

- **The launch-window sentence in the `the-problem-stopped-changing` not-found entry is weaker than it
  reads.** It says nothing in the feed falls in that article's launch window because the loaded items
  jump from about one month to about five months. That launch was on 2026-08-21 to 2026-08-23, which on
  2026-10-19 is under two months old. The same transcription says the `blast-radius-supernova` post
  (2026-08-28) was found among those same "about one month" items. So the window may fall inside the
  loaded range. The sentence matches the source word for word, so it is not a repair ground. The
  evidence that does carry the not-found finding is the slug and domain search, which the entry also
  states. Worth one look by the owner. Not edited.
- `my-commitment`'s hashtag gap says when ADR-0038 §C first applied is "not checked here". It is
  checkable: §C sits in the amendment dated 2026-08-16, after the 2026-07-27 thread. Saying so would
  answer the timing half of the gap. It would not answer why the thread carried hashtags.
- The transcriptions also note the impressions LinkedIn showed on the read date. The records leave
  them out. That fits AC 2, which does not ask for them, and it is noted only so their absence reads as
  a choice.

### Terminal

The pair is terminal on this round's `CONTENT-REVIEW-CLEAR` literal: the upper bound is mechanical, not
judged. Nothing was edited, so there is nothing to re-read. The next act is not a held preview: no
article is published or changed. The owner reads the four records on the merge request, and
`quality-assurance` is the gate.

CONTENT-REVIEW-CLEAR
