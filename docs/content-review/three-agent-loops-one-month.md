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

CONTENT-REVIEW-FINDINGS
