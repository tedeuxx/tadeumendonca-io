# 0046. A video-derived article earns its place by receipt, stands without the video, and never runs in a streak

- **Status:** accepted
- **Date:** 2026-08-08
- **Deciders:** the owner (ratified 2026-08-08; proposed by `product-lead`)
- **Supersedes / superseded by:** —
- **Driven by:** three intakes deferred on this same unmade decision —
  [#259](https://github.com/tedeuxx/tadeumendonca-io/issues/259) (2026-07-29),
  [#378](https://github.com/tedeuxx/tadeumendonca-io/issues/378) (2026-08-07),
  [#405](https://github.com/tedeuxx/tadeumendonca-io/issues/405) (2026-08-08) ·
  constrained by [ADR-0038](./0038-content-distribution-linkedin-and-x.md) (the distribution obligation,
  and the surface test 2 routes to) · reads through
  [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)

## Context & problem

The content backlog accumulated **eight items that are commentary on somebody else's video** — seven filed
(`content`-labelled: [#207](https://github.com/tedeuxx/tadeumendonca-io/issues/207),
[#210](https://github.com/tedeuxx/tadeumendonca-io/issues/210),
[#259](https://github.com/tedeuxx/tadeumendonca-io/issues/259),
[#339](https://github.com/tedeuxx/tadeumendonca-io/issues/339),
[#378](https://github.com/tedeuxx/tadeumendonca-io/issues/378),
[#379](https://github.com/tedeuxx/tadeumendonca-io/issues/379),
[#405](https://github.com/tedeuxx/tadeumendonca-io/issues/405)) plus one never filed, a video on
ontologies — **against one published article.**

Both halves of that ratio are measured, not estimated. `git ls-tree --name-only origin/main
apps/fed/src/content/blog/` at `56c43e0` returns `my-commitment.en.md` and `my-commitment.pt.md` — one
article in two locales, published 2026-07-26. The queue is the `content` label on the issue tracker, read
the same day. The measurement instrument and its three failure modes are ADR-0038's, not restated here.

**Three consecutive intakes deferred the same decision**, which is the fact that makes this worth a record
rather than a preference. #259 deferred it on 2026-07-29, #378 on 2026-08-07, #405 on 2026-08-08 — each
time re-derived from scratch, each time producing no rule, each time leaving the next intake to pay the
same cost.

**They failed for a reason that is diagnosable, and it is not laziness: the question was framed as
scheduling.** *Which of these do we do first, and how do we fit them in a weekends-only cadence?* Framed
that way there is no forcing function — every item is defensible on its own, the order is a matter of
taste, and a taste question deferred three times will be deferred a fourth.

**It is a voice decision.** Restated:

> One reaction reads as engagement. **A run of seven reads as a channel that needs other people's names to
> have something to say.**

That is the failure the posture pillar in the private positioning source already names — a peer, not an
authority-borrower — arrived at from the opposite direction. (Pointer only: that material is gitignored and
lives outside this repo, as ADR-0024 and ADR-0038 both establish for private working material.) ADR-0038's
own decision drivers already lean on the same claim in public, calling automation-shaped presence something
that *"undercuts the 'written by a peer' claim the content makes."*

**Framed as scheduling it had no forcing function; framed as voice it has a rule.**

## Decision drivers

- **The rule must be applicable by the owner, alone, in about a minute, without an intake.** This is the
  primary driver. Three intakes have now been spent re-deriving a judgement; a rule that still needs a
  ceremony has not fixed anything.
- **Membership must be decidable before order.** The three failed attempts all argued order first, over a
  set nobody had filtered.
- **The cap's justification has to be voice, or it will be negotiated away.** A cap stated as a volume
  preference loses the first argument it meets.
- **Nothing here may weaken ADR-0038.** Everything published still fans out to LinkedIn and X in the same
  batch; test 2 *routes into* that obligation rather than around it.
- **Lean (ADR-0001):** no new label, no new workflow, no gate, no tooling. A rule the owner applies in his
  head is the cheapest instrument that can work here, and its weakness is priced below.

## Considered options

1. **Three questions plus a cap** (chosen). Two gates decide membership, one criterion orders the
   survivors, and a cap bounds their density in the published stream. *Trade-off:* it drops items that are
   genuinely interesting, and it is enforced by nothing but the owner's attention.
2. **Order the queue and work it down.** *Why not:* this is what was attempted three times. It answers the
   scheduling question and leaves the voice question — the one that actually blocks — untouched. Seven
   reactions published in a good order are still seven reactions.
3. **Drop video-derived commentary entirely.** *Why not:* it over-corrects. Three of the queued items have
   a first-hand artifact behind them, and one reaction to a piece the field is discussing is exactly the
   peer posture, not a violation of it. A blanket ban would also have discarded the two items that survive
   this rule *by losing their video*, which are the best outcome the rule produces.
4. **A per-item editorial judgement at intake, recorded as a comment.** *Why not:* it is the status quo,
   costs an intake each time, and produces no precedent — which is precisely how the same decision came to
   be deferred three times.
5. **Cap by volume ("no more than N per month").** *Why not:* it states the symptom and hides the cause. A
   reader does not experience a monthly rate; they experience a *streak* in the feed. A volume cap is also
   trivially argued down ("it is only one more"), whereas the streak argument is not — the eighth item is
   more damaging than the first, and only the voice framing says why.

## Decision outcome

**Chosen: three questions and a cap.** The first two are gates; the third only orders. The owner applies
them himself, per item, without an intake.

### 1. The receipts test — a gate

> **Name the artifact in these two repositories that proves the video's claim right or wrong** — a file, a
> count, a gate, a measured failure.

**If naming it takes more than one sentence, there is no article — there is a summary.** The one-sentence
bound is the whole mechanism: it is what makes the test cost a minute instead of an analysis, and a receipt
that needs a paragraph to explain is a receipt the reader will not accept either.

### 2. The standalone test — a gate

> **Delete the video. Is it still an article?**

If no, it is **a LinkedIn post with a link, and it ships there.** This is **not a demotion — it is the
correct surface**, and it costs nothing extra in the batch: ADR-0038 already requires a LinkedIn and X pair
for every publication, and its 2026-08-08 amendment is explicit that the direction is one-way (an article
generates a post; a standalone post is never forbidden).

### 3. Ordering, among survivors

> **By how much of the piece already exists as a published artifact.** Least writing left, first.

### The cap

**At most one video-derived article between two originals.** The reason is voice, not volume: a run reads
as a channel that needs other people's names to have something to say. It is not a rate limit and must not
be re-derived as one — an eighth item that looks tempting is *more* costly than the first, not less, which
is exactly the direction a volume cap gets wrong.

### What the rule does not decide

**It does not decide the angle.** Every surviving item still needs the owner's own thesis; the rule decides
**membership and order**, and nothing else. An item that passes both gates and is written without a take is
a summary that happened to have a receipt.

## What the rule already produced, applied backwards

Run over the queue as it stood, the rule reproduces the ratified set **without anyone's judgement** — which
is the strongest available evidence that it is a rule and not a rationalisation of a decision already made.

| item | verdict | ground |
|---|---|---|
| [#207](https://github.com/tedeuxx/tadeumendonca-io/issues/207) | **dropped** | fails test 1 — a CEO's macro claim about an AI boom is the one subject in this queue with no first-hand artifact behind it |
| the ontologies video | **not filed** | fails test 1 — it comments on the knowledge-layer territory `/ramp-up` publishes a plan to *learn* rather than a claim to have done (`rampup.en.md:73`, *"Phase 3 — RAG + MCP: add a knowledge layer…"*, in a roadmap section titled *"6–12 months"*), and that phase has not been done |
| [#210](https://github.com/tedeuxx/tadeumendonca-io/issues/210) | **kept, video dropped** | fails test 2, survives as an original |
| [#378](https://github.com/tedeuxx/tadeumendonca-io/issues/378) | **kept, video dropped** | fails test 2, survives as an original |
| [#379](https://github.com/tedeuxx/tadeumendonca-io/issues/379) · [#339](https://github.com/tedeuxx/tadeumendonca-io/issues/339) · [#259](https://github.com/tedeuxx/tadeumendonca-io/issues/259) | **pass both** | receipt nameable in one sentence, and each stands with the video deleted |

**Ranked, among survivors (test 3):** #379 · #339 · #210 (reframed, video dropped) · #259 · #378 (reframed).

**That is a rank, not a publication sequence, and the difference is the cap.** #379 and #339 are adjacent
*here* and **cannot be adjacent in publication**: both are video-derived, so an original goes between them
— #210 and #378 are originals once reframed, and the rest of the queue supplies others. Test 3 orders the
survivors; **the cap governs the interleave.** Spelled out because this is the line a reader will check the
rule against, and a record that appears to break its own rule in its own worked example teaches the
exception rather than the rule.

**Deferred: [#405](https://github.com/tedeuxx/tadeumendonca-io/issues/405), on a ground this rule does not
capture** — and that is recorded rather than smoothed over, because a rule presented as covering a case it
did not decide is a false mechanism. It passes both gates and is still held: it carries the **highest
authority-borrowing cost in the queue**, using the field's largest name as a contrast to differentiate a
term this site has published on exactly one surface. **Re-entry after two of the five have shipped**, at
which point the term has articles behind it and the piece defends a term rather than introducing one.

**A correction to that ground, since this record is where someone will check it.** The defer comment cites
the term as published *once*, at `architecture.en.md:278`. Measured at `56c43e0`, "Agent Harness
Engineering" appears **twice** in `architecture.en.md` (lines 5 and 296) and twice in the pt edition. The
defensible statement is **one surface, zero articles** — which is the claim the defer actually rests on,
and it stands. The line number and the count did not.

**State of the tracker as of this record, verified with `gh issue list --label content --state all`:** #207
is CLOSED, #405 is OPEN carrying its defer comment, and #210 · #259 · #339 · #378 · #379 are OPEN. The
ontologies item is deliberately unfiled. **Nothing in this record asks for a tracker change**, and the
verdicts above are the owner's ratified ones — what was re-checked here is issue state and the two
measurements, not the editorial judgements.

## Consequences

**Good**
- A decision that failed three intakes is now applied in about a minute, by one person, with no ceremony.
- The set it produces is reproducible: someone can re-run the three questions over the queue and get the
  same answer, which is what makes a later disagreement about it a *disagreement* rather than a mood.
- Two items get **better** by failing test 2. #210 and #378 stop being reactions and become originals —
  the rule's most valuable output is not what it rejects.
- The published stream stops being able to drift into a reaction channel by accumulation, which is the
  failure mode nobody notices from inside any single item.

**Bad / accepted costs**
- **It drops items that are genuinely interesting.** #207 and the ontologies video are not bad subjects.
  The rule says they are not *this site's* subjects, and that is a real loss taken deliberately.
- **Two queued commentaries become articles that no longer cite their source.** #210 and #378 keep the
  thinking the video provoked and lose the attribution to it. That is a legitimate discomfort and it is the
  price of test 2 — the alternative is citing a source the piece does not need, which is the borrowing the
  cap exists to stop.
- **Nothing enforces any of it.** No label, no gate, no workflow, no script reads this record — the same
  honest limit ADR-0038 records for the fan-out obligation and its cadence, extended here to selection. The
  cap in particular is a claim about a *sequence*, and no instrument in this repo observes the sequence of
  publications at all.
- **The cap is the clause most likely to be argued down**, because its cost is visible per item (a good
  piece waits) and its benefit is only visible in aggregate (the stream does not read as a reaction
  channel). The voice justification above is the defence, and it is why it is stated rather than assumed.
- **Test 1's one-sentence bound is a judgement, not a measurement.** It is deliberately cheap rather than
  rigorous; two people could disagree on whether a receipt fits in a sentence. The bound buys applicability
  in a minute, and that trade is the point.
- **#405's defer ground sits outside the rule.** The rule did not decide it, a second application of the
  rule will not re-derive it, and its re-entry condition — two of five shipped — is held by the same
  attention everything else here is.

**Neutral**
- **Documentation only.** No `iac/`, no application code, no dependency, no gate. The one mechanical
  consequence is the ADR index: this record adds a row to `/architecture`, so
  `apps/fed/src/content/generated/adrs.json` is regenerated in the same MR (ADR-0043's committed-artifact
  shape; a stale artifact is a red build, by design).

## Links
- **Constrained by [ADR-0038](./0038-content-distribution-linkedin-and-x.md)** — test 2 routes a rejected
  item into the LinkedIn/X pair that record already requires; the obligation and its cadence are unchanged
  by this decision, and this record deliberately does **not** amend it. ADR-0038 decides *distribution* and
  *how often* a publication happens; its 2026-08-08 amendment says in terms that it is **not** an editorial
  production quota and that justifying article selection on its own merits *"is a different decision and
  gets its own record"*. This is that record.
- **Reads through [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)** — the instrument chosen is
  the cheapest one that can work: three questions in a document, no machinery.
- **Private material cited by pointer only**, per [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)
  and ADR-0038's 2026-07-27 amendment: the positioning source that carries the posture pillar stays outside
  this repo and is not quoted here.
- **Ratified in two Issue comments**, which is what this record replaces as the home of a standing
  editorial policy: [#207's closing comment](https://github.com/tedeuxx/tadeumendonca-io/issues/207) and
  [#405's defer comment](https://github.com/tedeuxx/tadeumendonca-io/issues/405).
