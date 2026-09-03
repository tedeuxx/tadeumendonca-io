# Content review — `three-agent-loops-one-month`

Reviewed against `published-voice`, the same skill the draft was written against. Source of record for
provenance: Issue #577's sixteen-comment interview of 2026-09-01 (`gh issue view 577 --repo
tedeuxx/tadeumendonca-io --json comments --jq '.comments|length'` → 16).

Since 2026-09-03 this reviewer **applies** what it can cite rather than handing it back — the owner's
ruling, *«o objetivo do content-reviewer é que ele ja faca alteracoes»*. The bar is unchanged: an edit
requires a quoted clause. Everything uncitable is listed as advisory and the prose was left alone.

## Round 1 — 2026-09-03

draft: `apps/fed/src/content/blog/three-agent-loops-one-month.en.md` ·
`apps/fed/src/content/blog/three-agent-loops-one-month.pt.md` @ `8963e4e`

### Citable findings — all four applied, both editions

1. **The bill was allocated to a cause the source says he cannot attribute** — EN:68–70, PT:68–70.
   clause: *"if you cannot point to where in the source material … a claim, a number or a stance comes
   from, it does not go in the draft as his."*

   The draft asked *"what did the four thousand dollars go on?"* and answered *"Not on building. It went
   on deciding."* That is an allocation of the invoice. His recorded stance is narrower — *«decisoes
   exaustivas … que fizeram torrar e jogar fora muitos desses tokens»* — and he states the opposite of
   an allocation twice: *«nao sei qual gastou mais»*, which the draft itself carries four paragraphs
   earlier ("I cannot tell you which of the three projects spent the most"). The interview also required
   a ratio *"re-derived, not estimated"* before drafting; none was supplied. Cost to the reader: the
   piece contradicts itself within one screen, on the one number somebody will screenshot, and the
   article's own next beat says the cost instrument was wrong about five of seven profiles.

   **Applied:** the question became *"where did it go?"*, the answer states the split is unavailable and
   points at what he did watch — *"what kept getting burned and thrown away … deciding, over and over,
   about the same thing"*. His verbs, his claim, no allocation. PT carries *«torrado e jogado fora»*,
   which is his own wording. The title is downstream of this and now sits on a claim the piece makes.

2. **A number that contradicts its source** — EN:143, PT:143.
   clause: *"if you cannot point to where in the source material … a claim, a number or a stance comes
   from, it does not go in the draft as his."*

   The draft read *"nineteen profiles … collapsed to seven"*. The source says **six**: *"Nineteen
   personas, one per concern, collapsed to six"* (#577, comment 2026-09-01T13:55:38Z). The paragraph is
   the setup for the piece's one explicitly testable takeaway, so a wrong denominator there is a wrong
   number in the sentence the reader is invited to check.

   **Applied:** seven → six, both editions.

3. **A verdict on why Scrum fails, and an example that is not in the record** — EN:165, PT:165.
   clause: *"if you cannot point to where in the source material … a claim, a number or a stance comes
   from, it does not go in the draft as his."*

   The draft asserted *"it was never the framework's fault. It was that people are busy, people anchor,
   people are diplomatic, and people let the gate slide at 6pm on a Friday."* What he said is that this
   is the Scrum *«que sempre gostariamos de ter implementado na vida real em empresas e nunca conseguimos
   alcancar tamanha eficacia/eficiencia»* — that he never reached it, not a diagnosis of why the industry
   does not. The three mechanisms are pointable (the interview's own bullets); the causal verdict and the
   6pm-Friday scene are not, and the scene is an invented specific in first person about colleagues.

   **Applied:** rewritten as his experience — *"exactly what I had never managed to hold in place with
   people"* — keeping the three pointable mechanisms and dropping the verdict and the invented scene.

4. **The September paragraph and the discouragement line have no source** — EN:206–208, PT:206–208 (now
   removed). clause: *"if you cannot point to where in the source material … a claim, a number or a
   stance comes from, it does not go in the draft as his. Cut it, flag it as a question back to him."*

   The draft closed on *"one thing I already know about September: no structural change to the loop in
   more than one project at the same time"* and *"That is what most produces the feeling of
   discouragement: things starting to go wrong at the same time."* **Neither is anywhere in the sixteen
   comments.** Searched for the concepts, not the words — `grep -in
   "setembro\|desanim\|desânim\|discourag\|mudanca estrutural"` over the full fetched interview returns
   nothing, and `gh search issues "desanimo" --owner tedeuxx` returns `[]`. The interview records the
   question as unanswered **three separate times** and instructs the drafter explicitly: *"asks once more
   and accepts a `not-supplied` rather than inventing one."* The PR body claims this content as
   *"the September answer"* sourced to #577; that attribution is falsifiable against the Issue and is
   false.

   **Applied:** both paragraphs cut, both editions. The close still lands — three takeaways, the
   instruction to go count the rounds, the sign-off.

   **This is the one edit that is restorable rather than settled.** If he gave that answer in a session
   the tracker never received, it is his and it belongs in the piece — the clause is satisfied by
   pointing at a transcript. **The unblock is one comment on #577 carrying his words**, after which the
   two paragraphs go back verbatim.

### Advisory and droppable

- Clare's video is not summarised, but *"A frontier is territory with no map, where the only evidence is
  what you walked yourself"* sits close enough to a definition that a reader may take it as her framing
  rather than the dictionary sense. Uncitable — nothing in `published-voice` governs it. *Horizon:* only
  if he wants visible distance from her argument; the word is his to take either way.
- *"It was designed two days ago"* (EN:177 / PT:177) is anchored to the draft date. *Horizon:* at
  `draft: false`, when the real date is set.
- The PR body's `channel` column carries `David Ondrej` and `Greg` — first-name and channel-of-record
  rather than author. Not a voice question and not mine. *Horizon:* before publication.
- My dispatch brief cited a `published-voice` clause about the four constraints of *"poesia para
  developers"* and the destroying edit of *naming the habit*. **The skill I preload contains no such
  section**, so I held no ruler for it and raised nothing on it. Recorded so the absence is visible
  rather than read as a clean result: a piece about method was **not** checked against that rule by
  anyone in this round.

### Checked and clean, stated so a silent pass is not read as an unrun one

- **The client engagement.** Named nowhere, inferable nowhere: no client, no domain, no stack, no
  sector, no team size, no dates beyond the month. The second project appears by function only ("another
  harness, on a different runtime"), which is the boundary the interview held.
- **The money.** *"I spent it. It was my decision."* — his ruling, unhedged, not handed to anyone, and
  not over-claimed either; *"whoever the money belonged to is not the interesting part"* is his
  *«nao interessa se meu empregador financiou»*.
- **The unit.** Credits throughout, with the plan/overage split, the rate and the arithmetic. No
  screenshot, per *«apenas os numeros»*.
- **The four references are landmarks, not subjects.** Mollick is one borrowed premise with attribution
  and no book summary; Matt is what it did for him; Clare is one word; Greg is one line of his own.
  Delete all four and the article stands.
- **Job dissatisfaction stays out of bounds.** The piece is about the shape of work he chose. The one
  passage that edged toward a mood claim was the unsourced ending, now cut on provenance rather than on
  bounds.
- **The title**, both editions, against the ranked six: subject named (1), he is in it and something is
  risked (2), a real turn against the setup (3), no imported image (4), and it survives uppercasing (6).
  Rule 5 was the live risk and finding 1 discharged it — the body now claims what the title carries.
- **PT against EN.** Section for section, argument for argument, same close. The register reads as
  written rather than translated (*«do jeito que a gente acompanha uma coisa no fogo»*, *«trabalho de
  cartório»*, *«seja chato onde não é»*), and the sign-off is the corpus form.

CONTENT-REVIEW-FINDINGS

## Round 2 — 2026-09-03

draft: `apps/fed/src/content/blog/three-agent-loops-one-month.en.md` ·
`apps/fed/src/content/blog/three-agent-loops-one-month.pt.md` @ `8963e4e` plus round 1's edits

### The round-1 cut is RESTORED, and this is a restoration rather than a reversal

**Round 1's finding 4 was correct and the material was genuine — both, and the order matters.** The
words were his, given in session on 2026-09-02 and drafted into the close **before reaching #577**. So
at the moment round 1 read the draft, the piece asserted an attribution its own stated source could not
carry, and the clause applied exactly as written: *"if you cannot point to where in the source material
… a claim, a number or a stance comes from, it does not go in the draft as his."* **A reviewer that
keeps unsourceable text because it reads well is not a ruler**, and the cut is what made the gap
visible enough to close.

**What discharged it is a new source, not a new judgement.** Recorded verbatim on #577, `createdAt`
2026-09-03T10:48:31Z, with the sign disambiguated — the first line alone did not say whether the
structural change was the thing to do or the thing to avoid:

> «fazer mudanças estruturais de loop ao mesmo tempo em mais de um projeto.»
> «isso é o que mais causa sensacao de desanimo quando as coisas começam a dar errado ao mesmo tempo.»
> «ao fazer uma mudanca de loop vc deveria ser mto pontual e observar com toda atençao e foco a mudanca
> de comportamento do loop»

**Restored as one movement rather than two beats** — the avoidance and the discipline are one thought,
since a behaviour change you cannot isolate is one you cannot watch. His register is kept plain and
slightly insistent (*«mto pontual»*, *«toda atenção e foco»*) rather than translated into method
vocabulary, and PT carries his own wording almost verbatim. **The connection to the article's own
instances is deliberately NOT drawn** — a reader who has just read them makes it themselves, and
pointing at it flattens the close.

**The bound is checked and clean:** the discouragement is about loops going wrong at once, not about
the work he has. That is the shape of the work he chose, which is the near side of *The subject is
bounded*'s line.

### Citable findings

**None.** The only text new since round 1 is the restoration, and it is sourced verbatim to a comment
that now exists. The three findings round 1 applied are unchanged and were not re-opened.

### Advisory and droppable

- Round 1's advisories stand as written and are not restated here. None acquired a clause.
- The *"poesia para developers"* constraints and the *naming the habit* edit are confirmed **not** to be
  in `published-voice` — they were supplied to this dispatch from memory of a conversation. **They were
  not treated as binding in either round**, and a piece about method therefore went unchecked against
  them by anyone. Recorded so the absence stays visible; closing it is not this reviewer's work.

**The draft is clean.** No citable finding remains against `published-voice`.

CONTENT-REVIEW-CLEAR

## Round 3 — 2026-09-03 — a truth repair after the pair had closed

draft: `apps/fed/src/content/blog/three-agent-loops-one-month.en.md` ·
`apps/fed/src/content/blog/three-agent-loops-one-month.pt.md`, at `main` after the article merged and
deployed.

### What this round is, and it is not a third drafting round

**The two-round bound was spent and terminal.** Round 2 closed at `CONTENT-REVIEW-CLEAR` and nothing
here reopens it. This section exists because the **owner** read the live article and found a false
claim, and because he ruled the same day that `content-reviewer` holds truth-of-published-claims on the
content stream and **repairs in place** rather than blocking. The repair is applied under that mandate's
ground 2 — *the claim is false against the source* — not under `published-voice`.

### The defect he reported, verbatim

> «a conta "A conta de agosto foi de USD 4.207,13." foi somente os dois loops (cliente e interno) nao
> conta o loop do site pessoal, isso nao ficou claro.»

**The figure covers two of the three loops.** The article never said so, and its structure implied the
opposite: it opens on three projects in parallel and then states the bill as August's with nothing
separating them.

### Swept by content, not by the sentence he quoted — four sites per edition, and one of them he did not name

1. **The bill sentence** (EN:20 / PT:20) — the one he quoted. Now scoped: *"it covers two of those
   three loops. This platform's is not on it."*
2. **The attribution sentence** (EN:24 / PT:24) — **its denominator was wrong too, and he did not name
   it.** It read *"I cannot tell you which of the three projects spent the most. One bill, three loops,
   no attribution."* If the bill covers two, the sentence is false as written. Now: *"which of the two
   on it spent more. One bill, two loops, no split."*
3. **The excerpt** (EN:10 / PT:10) — juxtaposed three projects and the bill in one breath, so the index
   row and every card carried the same implication. Now *"a bill of USD 4,207 covering two of them."*
4. **The arithmetic paragraph** (EN:22 / PT:22) — *"Total consumed for the month"* became *"Total on
   that bill for the month"*. The credits block is otherwise untouched and still closes:
   105,178.21 × $0.04 = $4,207.128 → **$4,207.13**, plan 10,000, total ≈ 115,000. **Credits, not
   tokens.**

**No figure was invented.** He has not said what the personal-site loop cost or on what meter, so the
repair scopes the claim to what he did say and stops there. **The reader is not told the real total is
higher** — that would require assuming the third loop consumed something billable, which is not in the
source.

### Three further pieces of source arrived in the same round, and all three are in the same commit

- **«Agentic August»** — an internal AWS programme promoting AI use and experimentation, with training
  goals and a hackathon with rules, *«eu preferi fazer diferente, do meu jeito. dai os 3 loops»*. Placed
  early, as two short paragraphs, because it is the **cause** of the three loops and the piece never
  said why three or why then. **The programme and his deviation are the whole claim** — nothing
  characterises the employer, evaluates the programme, or says what it achieved.
- **The three loops are not equally protected**, *«a ferramenta interna … nao é um segredo, diferentemente
  do que to faznedo pro cliente»*. The opening now runs open → nameable → sealed, and closes on *"three
  different amounts I am allowed to tell you."* **The sealed one is last on purpose**, so nothing
  follows it to make it legible by contrast — a comparison that narrows the client engagement by
  negation is the same leak with better manners. **Only the object is named**: a knowledge platform he
  is building. Not its architecture, users, stage or purpose.
- **Building it was his decision too**, *«pois foi minha decisao construi-la tbm»*. One clause, and it is
  left un-glossed: it echoes *"I spent it. It was my decision."* later in the same piece, and that
  repetition is the spine rather than something to trim. **No lesson is drawn from it.**

**One link is deliberately NOT drawn.** The bill covers the two work loops and the programme was
internal; whether the split falls on that boundary is his to confirm, not this reviewer's to assert. The
two facts sit side by side.

### What the four arrivals measure, and it is the point of recording them here

**The pair closed at `CLEAR`. The owner then supplied four corrections:** a false attribution (the
September close, round 1/2), missing context (the programme), a flattened distinction (the three
disclosure levels), and an authorship fact (the internal platform was his call).

**None of the four was reachable from the artifact.** All four are things only he knows — not omissions
in the draft, not oversights in the rounds, and not findings any amount of re-reading would have
produced. **That is not a failure of the review; it is the boundary of what a reviewer holding the piece
and no access to the author can reach.**

**What it does say about the pair's reach, plainly:** two rounds against `published-voice` can establish
that every claim is *traceable to the recorded source*. They cannot establish that the recorded source is
*complete*. On this piece the gap between those two was four corrections wide, and every one of them
arrived after the terminal literal.

### The bill correction BROKE a downstream section, and that is the finding worth keeping

**It made *"what was actually burning the money"* false by structure, and nobody caught it until the
owner read the page.** The section asked where the money went and answered **entirely with the loop that
is not on the bill**: PR #387 is named in #577 as being in `tadeumendonca-skills`, the dispatch-cost
record is #382 in that same workspace, and the failed-open falsifier is from the same day's work there.
**All four examples are this platform's own loop — the one the corrected paragraph four sections earlier
now explicitly excludes.**

**This is the class this session has paid for repeatedly:** a correction lands where a claim is STATED
and leaves untouched everything that RESTS on it. The bill sentence was scoped without re-reading what
the article did with the bill further down.

### What replaced it — the owner's war story, which answers the money question better

> «eh melhor falar sobre a parte de muitos conflitos, menos conflitos, como modelar subagents de forma
> intencional. isso aprendi a dura pena onde quando coloquei muitos atores num mesmo nivel para
> concordarem nada mais era entregue no loop scrum agil que estava tentando implementar.»

The section is now **the cause rather than the ledger**: he cannot show the split, and what he can give
is the design that made deciding expensive — too many actors at one level, all having to agree, nothing
shipping. **Conflict is not uniformly good**; some layers want it and some must not have it, which the
piece already says of ideation versus the gate and now carries the failure mode on the other side.

**Three constraints held.** No number invented — he said *"many actors"*. **The nineteen-to-six collapse
was NOT joined to it:** #577 diagnoses that one as *handoffs, profiles generating no disagreement, which
is why they never ran* — the opposite mechanism to *peers who all had to converge*. Nothing in the source
says they are one event. And no coined term, no named pattern, no numbered rule.

### The examples STAYED, and a wholesale delete would have broken the payoff

**Verified before deciding rather than assumed:** the *"how do you notice"* section's three signals cite
the three examples by content — members-versus-set, the empty check, the instrument against memory — and
the `takeaway` frontmatter promises *"three signals"*. **Deleting them would have orphaned the reader's
payoff and left a dangling promise in the metadata**, the same defect class one layer up. So the war
story replaced the **framing**, which was the false part, and the evidence stayed under a claim it can
carry. One further leak fixed in the same pass: *"what this month cost"* → *"what my own loop cost me"*,
since that instrument measures the unbilled loop.

### Matt Pocock — four learnings, three checked against the tree

The section carried only *"it made me see I was on the right track"* — a feeling where this piece's
register wants an artifact. **Three of his four were verified before being asserted:** six typed commands
all carrying `argument-hint`, a MADR template whose shape demands the rejected option and its trade-off,
and eight profiles each with a `skills:` preload list. **The fourth was deliberately weakened** — this
loop has no PRD, so the draft says the movement is his and names where it lands here instead of claiming
a practice the harness does not run.

### Both reference defects are ONE class

**A reference described by what it was near rather than by what it contained.** Matt's was treated as
corroboration when it was four things he took and applied. The closing video was credited to **Greg**,
who hosts it, when the reflection is **Ryan Carson's** — his correction. Both editions now name Carson
with Greg as the channel, and `videos.json` gains `"caption": "Ryan Carson"`.

**The caption stops at the speaker on purpose.** The existing rows read *speaker, then title*, and no
citable source here gives that video's title — the owner's own framing is a description, not a title, and
`"channel": "Greg"` remains under the open advisory and was left untouched rather than upgraded. **A
guess must not become a caption.** Regenerated with `npm run gen-video-thumbs`: exactly one PNG changed,
the other ten byte-identical.

### A rendering defect this reviewer cannot fix — reported, not repaired

**Clare's video (`pqlWNihgdjI`) has embedding disabled by its owner and the site has no preview mode.**
Established by reading: `VideoEmbed` renders a local poster and swaps in an `<iframe>` **on click**, and
`videos.json` carries only `channel` and `caption` — **no per-video flag, no link-preview form**. That is
a component change and it is `developer`'s.

**The failure shape is the bad one:** the facade looks correct and fails only *after* the reader clicks,
which is how it reached publication.

**The other three are UNVERIFIED, not fine.** The site consults no embeddability signal anywhere — a fact
about the schema, not an inference — so **nothing in this repository has ever checked whether any of the
four plays.** Reading an API's `embeddable` field would not close it either, since the site never reads
that field; the check has to be against the rendered player.

CONTENT-REVIEW-FINDINGS

## Round 4 — 2026-09-03 — the fifth arrival, and one widening of the boundary

draft: `apps/fed/src/content/blog/three-agent-loops-one-month.{en,pt}.md`, at `main` after the article
merged and deployed.

### What the owner granted, as one thought rather than two

> «fala que a plataforma de conhecimento interna é da pratica de modernizacao dentro de aws
> professional services em latam para acelerar troca de conhecimento de IA entre os colaboradores»
> «(minha tese)»

**The middle rung now carries its context and its authorship in one clause**, because it arrived as one
thought: the practice, the organisation, the region, the purpose — **and that the platform is his
thesis.**

**«Agentic August» set training goals and a hackathon with rules; he opted out and argued a thesis
instead.** That is materially stronger than *"he built something different"*, and it is what he actually
said.

### The clause is un-glossed on purpose, and that is a rule rather than a preference

**This is the third instance of one shape in the article** — *"I spent it. It was my decision."* ·
*"building it was my decision too."* · *"my thesis."* **None of the three is explained**, and the piece
works because **the reader assembles them**. Naming the pattern would be the edit that kills it, which
is the same rule the register already applies to habits: state the instance, never the habit.

### What "thesis" is NOT allowed to imply, checked in the wording

**It is his argument for accelerating AI knowledge exchange in that practice — nothing more.** The
source contains no claim that it was **accepted, adopted, funded, validated or proven**, and *thesis* is
precisely the word that slides into *"and it worked"* without anyone deciding to say so.

**The wording holds the line grammatically:** the purpose is written as an infinitive — *"to speed up how
AI knowledge moves between colleagues"* — which states an aim. **A relative clause (*"which speeds up
…"*) would have asserted an outcome**, and that is the one-word difference between a purpose and a
result.

### The sealed rung — checked AFTER writing, and the finding is a narrowing rather than a leak

**The client engagement is still last, still sealed, and still carries no client, no domain, no stack, no
sector and no dates.** Nothing was added to it.

**But the contrast did move, and pretending otherwise would be the wrong answer.** Naming *AWS
Professional Services* and *LATAM* on the middle rung means a reader can now infer the client engagement
was an AWS Professional Services client, plausibly in that region. **That is a real narrowing of the
population the sealed rung is drawn from.**

**Judged as holding**, and the reason is stated rather than assumed: the employer was already public and
already in this piece (the «Agentic August» passage names AWS), the narrowed population is large, and
**no attribute of the engagement itself was added** — the reader learns more about where he works and
nothing more about whom he worked for. **The order still does the protective work**: the sealed rung is
last, so nothing follows it to define it by contrast.

**This is the edit class that erodes that boundary**, and the check is recorded here so the next widening
is measured against a stated position rather than re-derived.

### The tally, which is the finding this round exists to keep

**Five pieces of source have now arrived from the owner after the pair closed at `CLEAR`:** a false
attribution, missing context (the programme), a flattened distinction (the three disclosure levels), an
authorship fact, and now the platform's context and thesis.

**All five are things only he knows.** Not omissions in the draft, not oversights in the rounds, and not
findings any amount of re-reading the artifact would have produced. **Two rounds can establish that every
claim is traceable to the recorded source; they cannot establish that the recorded source is complete** —
and on this piece the gap between those two is now five corrections wide.

### The third loop's cost — the hole the bill correction left, closed by him

> «voce pode considerar o custo desse loop no mes minha assinatura claude max 10x»

**The round-3 repair was true and incomplete.** It said this platform's loop *"is not on that invoice"*
and stopped, which left the reader with an absence. The real shape is **two cost models in one month**:
two loops metered in credits, one on a flat subscription.

**And it is what makes the two-versus-three distinction mean something.** It stops being an accounting
caveat and becomes the fact underneath the no-attribution beat: **they are not the same kind of number.**

**Three things deliberately NOT done.** No price is attached — he named the tier, not a figure, and none
was looked up or inferred from public pricing. **Nothing is totalled**: a sum across a credit meter and a
subscription is not in the source and would be the exact defect this round exists to fix. And it is not
written as *"so the real cost was higher"* — **a different meter, not a hidden line item.** The credits
block is untouched and still closes to the cent.

**Two checks run after writing rather than assumed.** The attribution sentence — *"I cannot tell you
which of the two on it spent more"* — is **still exactly true** (the bill covers two, with no split
between them) and **still necessary**: two later passages call back to it, the *"I cannot give you the
split"* line and the third of the three signals. It was re-read and left unchanged rather than presumed
to survive. And the disclosure passage and the bill paragraph were compared for drift: one is about
**what he may say**, the other about **which meter paid**. Different axes, neither restating the other.

CONTENT-REVIEW-FINDINGS

## Round 5 — 2026-09-03 — the article's new ending

draft: `apps/fed/src/content/blog/three-agent-loops-one-month.{en,pt}.md`, at `main`.

**Round 4 is not in this file yet** — it is in PR #585, blocked — so this section follows round 3 on
disk and the two will collide in this file's tail when both land. Sequencing is the orchestrator's.

### The source was NOT on the Issue when this was written — third consecutive round

**Round 4's own comment recorded this defect and called itself the second instance. This is the third.**
Searched before drafting:

```
gh issue view 577 --repo tedeuxx/tadeumendonca-io --json comments \
  --jq '[.comments[] | select(.body | test("S-sYlFiGFv8"))] | .[].body'   -> (empty)
```

**The verbatim quote reached this round through the dispatch brief, not through the artifact.** So the
diff that publishes the claim is again the only thing vouching for it — the exact condition
`quality-assurance` blocked PR #585 on. **Written up rather than smoothed over, and it is this round's
ask: one comment on #577 carrying his words closes it.**

### What was added, and where

**The ceiling passage stays untouched.** It is where the work is; this is why the work happens. The new
beat sits after the September paragraph and before the closing instruction, so **the last substantive
thing a reader meets is his recognition rather than a limitation** — and the corpus close (instruct,
then wish) stays intact around it.

**Three sentences: the link, the engineer's beat, his sentence.** No summary of the video, no name for
the engineer — the source gives neither — and **no gloss on the parallel.** *"That is how I feel making
this site"* does the work; explaining it is the edit that kills it, exactly as with the three un-glossed
*"my decision"* instances.

**Tested against the register rather than assumed:** nothing here exists in order to encourage. It is
one person's reported experience and one sentence of recognition — **it states, it does not uplift**,
which is what keeps it off a motivational carousel.

### The embeddability check — run with a CONTROL, and it corrects round 3

**Round 3 said an API field could not settle this and the check had to be against the rendered player.
That was over-strict, and here is the measurement:**

```
curl -s -o /dev/null -w "%{http_code}" ".../oembed?url=...v=S-sYlFiGFv8&format=json"  -> 200
curl -s -o /dev/null -w "%{http_code}" ".../oembed?url=...v=pqlWNihgdjI&format=json"  -> 401
```

**The control is the point.** Clare's video — the one known to fail in the live player — returns **401**
where the new one returns **200**. So oEmbed **discriminates on the case this repository actually got
wrong**, which makes it a usable pre-flight rather than an assumption.

**Bounded honestly: one true positive and one true negative is a control, not a validation suite**, and
the endpoint tests YouTube's embed permission rather than this site's player. **It is a cheap falsifier
the repo did not have, and it does not replace the component fix in flight with `developer`.**

**So this ending does not ship a second dead player**, and Clare's remains dead by the same instrument.

### The caption has a citable source, which the previous row did not

Round 3 stopped `vJEy3nP2_C8`'s caption at the speaker because no source here gave a title. **The same
oEmbed call returns both fields**, so this row is filled from YouTube's own response rather than guessed:
`"channel": "Claude"` is the returned `author_name` and matches the file's existing convention
(`fl1DSmwQKKY` already carries it). **The open advisory on the other rows is untouched** — one row
resolved from a source, not a sweep.

**Poster art regenerated:** exactly one new file, `apps/fed/public/video/S-sYlFiGFv8.png`, the existing
eleven **byte-identical** (none shows as modified in `git status`).

### The tally

**Six pieces of source have now arrived from the owner after the pair closed at `CLEAR`** — a false
attribution, missing context, a flattened distinction, an authorship fact, the platform's context and
thesis, and the article's ending. **All six are things only he knows.**

**And three of the six reached the draft before reaching the Issue.** That is no longer a property of one
round; it is the shape in which this piece is being finished, and the record says so rather than treating
each instance as isolated.

CONTENT-REVIEW-FINDINGS

## Round 6 — 2026-09-03 — a name and a cut, both craft

draft: `apps/fed/src/content/blog/three-agent-loops-one-month.{en,pt}.md`, at `main`.

**The source was on #577 before this diff existed** (comment `createdAt` 2026-09-03T19:44:40Z), which
is the sequence rounds 3, 4 and 5 each failed. It is recorded here as the one that held.

### 1 · The organisation's name

> «AWS Professional Services - LATAM»

Both editions rendered it as a prose phrase — *"inside AWS Professional Services **in** LATAM"* and
*"dentro da AWS Professional Services **na** LATAM"*. **`in LATAM` is a location; `- LATAM` is part of
the name**, and an organisational unit's name is not translated, so the Portuguese takes the same
string.

**The grammar was checked rather than assumed**, because the sentence was built around a preposition
that is now gone. In both editions the preposition doing the structural work is the *first* one —
*inside* / *dentro da* — and only the second was removed, so both clauses read as before.

### 2 · The announcing opener, cut

> «"Teve um motivo para ser agosto. " remover»

**The English equivalent was found rather than assumed to be a literal translation:** *"There was a
reason it was August."* Both are gone, and **neither was replaced** — the instruction was *remover*, and
a softer opener doing the same job is the same defect. Each paragraph now opens on the programme
itself (*"Inside AWS it was **Agentic August** —"* / *"Dentro da AWS era o **Agentic August** —"*),
which is what already carried the reason.

**Nothing else moved.** The round-4 grant is exactly what it was: the practice was not renamed, the
clause was not reordered, and the description was not expanded.

### What round 6 is, and why it is a different kind of arrival

**The sixth piece of source after the pair closed at `CLEAR`** — and **the first two that are craft
rather than substance.** The other five changed what the piece claims; these two change how it says
something it already claimed correctly.

**The naming one carries a limit worth separating from the rest.** The other five are things only he
knows *because he lived them* — what he spent, what he decided, what he felt. **This one is something
only he knows because he works there**, and no amount of reading the artifact, the interview or the
repositories would have produced it. A reviewer outside that organisation cannot catch a unit's name
being written as a location.

**The tally is six, and the honest reading of it is unchanged:** two rounds can establish that every
claim traces to the recorded source; they cannot establish that the source is complete.

CONTENT-REVIEW-FINDINGS

## Round 7 — 2026-09-03 — a reframe, not a correction

draft: `apps/fed/src/content/blog/three-agent-loops-one-month.{en,pt}.md`, at `main`.

**The source was on #577 before this diff existed** (comment `createdAt` 2026-09-03T19:48:06Z), the
second consecutive round where that held.

### What he said, and what it changes

> «essa parte na verdade voce percebe como voce perceberia numa equipe humana, algo nessa linha»

**The section's opening promised something smaller and true:** that the three signals need none of his
setup, tools or repository. **His claim is stronger — you read them the way you would read a human
team, and the team being agents changes nothing about the reading.**

**It answers a question the piece raises and leaves open.** The premise is frontier territory with no
expectation anchor and no benchmark — *"cavemen discovering the world for the first time"* — and then
the piece produces three signals needing none of that. The frame says why: they transfer, because they
were never about the machine. **That is a claim an experienced reader can check against their own
history rather than take on his authority.**

### The promise was NOT removed, and that was checked rather than assumed

**The brief allowed the frame to replace the opening promise. It does not, because the promise is
load-bearing two places away:**

- the frontmatter `takeaway`, which literally describes the signals — *"three signals that need none of
  my tools"* / *"três sinais que não dependem de nenhuma ferramenta minha"*;
- the closing takeaways, *"none of them needs my setup"*, a different list carrying the same shape.

**Dropping it from the section would have left the metadata asserting something the section no longer
said** — a removed premise with a reader still leaning on it, which is the defect class this piece has
paid for repeatedly. **So both clauses now sit in one sentence: the frame first, the independence as
its consequence.** One changed line per edition, nothing else touched.

### Three constraints, held

- **The parallel is stated, not argued.** No list mapping agent behaviour to human behaviour, no
  *"just like a team where…"*, no second paragraph developing it. One clause of orientation.
- **The signals were not weakened to fit the frame.** All three are byte-identical — a widened search,
  an empty check, an instrument against memory — and each is still concrete and mechanical. Had any
  read less sharp afterwards, the reframe would have been wrong, not the signal.
- **The closing instruction is untouched.** *Stop the round and change the ruler*, and the note that
  his different reader was literal. That sentence is already the parallel's payoff and it still does
  that work without being told to.

### The signature — a CONVENTION adopted, and #271 does not close

> «assina o artigo tbm com aquele jargao "Isso é o que eu penso" que tinha notado em algum issue para
> tornarmos uma marca dos artigos»

**Applied: piece 1 of #271 only.** *"Isso é o que eu penso."* / *"This is what I think."* — **present
tense in English**, per that Issue's own argument that `penso` is present.

**«para tornarmos uma marca dos artigos» is the operative half**, so the placement had to be a slot
every article has rather than one this article happens to offer.

**Where it went, worked from the corpus rather than instinct.** The corpus close is *instruct, then
wish*, and this piece already follows it — *"Go and look at what your loops actually did last month"*,
then *"A hug, and see you next time."* **The signature is neither**, so three placements were
available and two of them break something:

- **after the sign-off** — displaces the corpus terminator and reads as a postscript appended after
  goodbye;
- **between the instruction and the wish** — splits the one pair the corpus keeps intact across
  roughly seventeen of twenty-two pieces;
- **before the instruction** — chosen. It closes his own account and hands the piece to the reader,
  and the instruct-then-wish pair survives untouched behind it.

**It is repeatable because the slot is structural, not local:** *after the piece's own material ends,
before the closing instruction.* That exists in every article he writes in this form — it does not
depend on this one ending on a video.

**It does not read as a hedge, and the placement is why.** *"This is what I think"* sitting after a
specific claim would soften that claim; sitting at the pivot from his account to the reader's action,
it marks the whole piece as his take and hands over. **It is not a disclaimer on the artifacts — it is
what makes the handover reciprocal.**

**Plain sentence, own paragraph, no emphasis.** The corpus does not mark its sign-off either, and a
signature set in bold is a flourish rather than a convention.

### What was deliberately NOT applied

**Piece 2 of #271 — the reader-take loop — and #271 stays open on it.** The conflict that Issue exists
to settle is unruled: **how much of the sharer's post may the site write?** His own pitch was a
composer pre-populated with an opinion scaffold; what shipped sends title and canonical URL only, on
the ground that putting his framing into a reader's post borrows their account.

**Nothing in this diff implies that loop exists** — no invitation to reply, no prompt, no call to
share. **A signature with no loop is half the mechanism**, and that is the honest state rather than
something to paper over with a call to action nobody has ruled on.

### What round 7 is

**The seventh arrival after the pair closed at `CLEAR`, and the first that REFRAMES rather than
corrects.** The other six changed what the piece claims or how it says it. **This changes what the
reader is being invited to check the piece against** — their own history with human teams, rather than
his account of agents.

**The tally is seven, and the reading is unchanged:** two rounds can establish that every claim traces
to the recorded source; they cannot establish that the source is complete.

CONTENT-REVIEW-FINDINGS
