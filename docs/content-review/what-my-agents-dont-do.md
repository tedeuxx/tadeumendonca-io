# Content review — `what-my-agents-dont-do`

Rounds against `published-voice`, at most two. A finding is **citable** only where the clause it
violates is quoted verbatim in it; everything else is **advisory and droppable** and carries no claim
on the writer's time.

## Round 1 — 2026-08-24

draft: `apps/fed/src/content/blog/what-my-agents-dont-do.en.md` @ `b116793`
draft: `apps/fed/src/content/blog/what-my-agents-dont-do.pt.md` @ `b116793`
ruler: `published-voice` · sources read: `-io#259` body + its single comment (2026-08-25),
`tadeumendonca-skills` `docs/blueprint-registry.md` and `docs/adr/README.md` on
`feat/blueprint-registry-313`

### Citable findings

1. **The article's emotional spine is supplied, not sourced.** — clause: *"**What is not craft is the
   feeling itself.** Nobody decides what an experience meant to him, and nobody supplies one he never
   described. If the source says what happened but never how it landed, that is a missing source like
   any other — stop that section and ask, exactly as for a missing number."*

   What the draft does · Three first-person mental states carry the piece, and none appears in the
   Issue, its comment, or any of his files:
   - *"I expected the purpose column to be the valuable one. It was not."* / *"Eu esperava que a coluna
     valiosa fosse a do propósito. Não era."* — the hinge of the whole article.
   - *"the interesting part was not the part I was proud of"* / *"a parte interessante não foi a parte
     de que eu tinha orgulho"*.
   - *"My first objection to 'every company should have a brain' was that I do not have a company."* —
     a reaction to the talk, attributed to him.

   Two lesser ones are the same class: *"it is the one I would tell a peer to steal first"* (a stance
   ranking his own two practices) and *"which is the only reason I trust the current shape at all"*.

   What is sourced is the *fact* the reversal rests on — `blueprint-registry.md` says the limit column
   is *"the most transferable cell in the row"*. What is not sourced is that he **expected otherwise**.

   What it costs the reader · The title's turn (*what paid off was what they don't*) is bought entirely
   by that surprise, so the most quoted line of the piece rests on the one sentence with nothing under
   it. And this is the failure mode he named himself when a draft came back accurate and hollow — a
   piece can be empty for want of feeling, and it can be false for having invented one.

   Smallest change that clears it · Ask him **one** question (*"a coluna do limite te surpreendeu? o
   que você esperava que fosse valer?"*) and use the answer; or, if he is not available, restate the
   three passages without the invented expectation — the registry's own sentence about transferability
   carries the section on its own, at the cost of the reversal.

2. **The excerpt and the section heading arrive superior to the talk; the body does not.** — clause:
   *"**No authority** — *"não quero estabelecer autoridade"*"*.

   What the draft does · The body sentence **lands**, and is the drafter's own flagged uncertainty
   resolved in its favour: *"He does not use it once in twenty minutes, and he does not need it: the
   talk describes the thing perfectly well without it"*, followed by a reason about **him** rather than
   about Tan (*"instead of quietly assuming you invented a filing habit"*). The dissolving clause is
   what makes it work — and it is absent from the two surfaces that travel without the body:
   - excerpt EN: *"Garry Tan's talk describes a company brain without ever using the word the field has
     started using for it — ontology."*
   - excerpt PT: *"A palestra do Garry Tan descreve um cérebro de empresa sem nunca usar a palavra que
     começou a aparecer na área para isso — ontology."*
   - heading, both editions: *"The word he never uses"* / *"A palavra que ele nunca usa"*.

   In the excerpt the only stated relationship between the two men is that Tan lacks a word the author
   has. That is the register the ruler rejects, and the excerpt is exactly where the ruler already
   warns context is stripped — *"the OG card and every social post strip exactly that context."*

   What it costs the reader · The index row and the card are where most readers meet the piece, and
   they meet a gotcha the article then spends a paragraph refusing.

   Smallest change that clears it · Make the excerpt's subject his own registry and the column, with
   the talk as the occasion rather than as the thing found wanting; and head the section on the word
   rather than on his silence (*"The word for it"* / *"A palavra para isso"*).

3. **The title's "everything" is disproved by the piece's own honest half.** — clause: *"the truth test
   tightens here rather than relaxing … carrying that thesis is a **false claim** in the most quoted
   line of the piece."*

   What the draft does · EN *"I wrote down everything my agents do."* / PT *"Registrei tudo o que os
   meus agentes fazem."* The article then declares the registry **incomplete** — six skills with no
   entry, `partial` rather than padded — and makes *"Declare what is incomplete instead of letting it
   look finished"* one of its three closing habits. The title performs the failure the piece names.

   What it costs the reader · A reader who reaches the last third finds the title over-claimed, in a
   piece whose entire argument is that a knowledge base must not over- or under-claim silently.

   Smallest change that clears it · Drop the word. *"I wrote down what my agents do. What paid off was
   what they don't."* / *"Registrei o que os meus agentes fazem. O que valeu foi o que eles não
   fazem."* The setup/stop/turn is intact, the image is still the registry's own last column
   (criterion 4 clean, nothing imported), and it survives uppercasing unchanged.

### Advisory and droppable

- No lead photograph. It works — the video embed occupies the lead slot and placing the talk is the
  piece's first job. Worth knowing it will sit differently in the index beside two articles that both
  open on a captioned photo; that is a repo-consistency call, not a voice one.
- PT *"hooks que recusam certos comandos na marra"* — the informality is right, but *na marra* reads as
  brute force against resistance, which slightly misdescribes a deny hook. *"de saída"* / *"sem
  discussão"* would keep the register.
- PT announces the original-plus-translation convention (*"o repositório é publicado em inglês, então
  vai o original e a tradução"*) at the **fourth** English quote; the first three are translated with no
  announcement. Moving the announcement to the first quote matches the corpus habit more closely.
- PT excerpt carries *ontology* with no gloss; the body glosses it *(ontologia)* on first use.
- *"Tan names this failure mode himself"* — *himself* carries a faint *even he admits*. Dropping the word
  loses nothing.
- The title's *"my agents"* under-describes what the registry covers (personas, hooks, commands,
  skills). It reads as shorthand and the body corrects it immediately.
- The Issue **body** supplies a different honest half — the retrieval failures, with two receipts — and
  the draft uses none of it while echoing its phrase (*"selling the easy half"* → *"sold you the easy
  version"*). **This is explicitly not a finding**: cutting sourced material is craft, the ruler says so
  outright, and the newest comment reset the receipt to the registry. Recorded because the substituted
  honest half should be his choice, not a silent one.

### Rulings requested by the drafter, recorded rather than raised

- **The ontology sentence** — it lands in the body. Its only failure is on the surfaces that strip the
  dissolving clause, which is finding 2.
- **`graph`** — not present in either edition (`grep -in graph` on both files → no match). The talk's
  library vocabulary is attributed to the talk; *ontology* is attributed to the field, never to Tan.
  Clean.
- **"I have two repositories and weekends"** — it **holds**, and is not the self-deprecation the ruler
  fences. It states a real limit plainly and stops, the next section describes the harness at full size
  (*"Seven personas … hooks … a skill library … a set of decision records. All of it running, all of it
  in the open"*), and its job is the scale beat the talk itself answers.
- **The closing section** — it stays at n=1 and makes no organisational recommendation: it addresses an
  individual, disclaims both toolsets, and each of the three habits is traceable to something in his
  own repositories. The one drift is *"the one I would tell a peer to steal first"*, folded into
  finding 1.
- **Every Tan quotation is verbatim against the ASR transcript, not against the audio.** Six short
  quotes carry weight, no transcript is committed to this branch, and nothing on this ruler settles it.
  **Recorded as a publication risk for the owner and for the merge gate, not as a finding.**

### What this round did not check

Provenance is on this ruler; **external correctness is not**. Nothing here verifies a claim against the
code, another surface, or how it will read in a year — that is `product-lead`'s blocking veto on
published claims, and it fires at the merge gate through `quality-assurance`'s criterion 10.
Cross-surface staleness, evidence proximity, the machine read and durability are uncovered by this pair
by construction.

CONTENT-REVIEW-FINDINGS

## Round 2 — 2026-08-24

draft: `apps/fed/src/content/blog/what-my-agents-dont-do.en.md` @ **working tree**, blob
`91b8c6b` (branch head `b116793`; the rewrite is uncommitted)
draft: `apps/fed/src/content/blog/what-my-agents-dont-do.pt.md` @ **working tree**, blob
`385e943` (same head)
ruler: `published-voice` · new source this round: the owner's answer quoted in the dispatch —
*"o mais importante ao compartilhar o blueprint de uma configuracao de customizacao harness é
comunicar o papel de cada componente e seu proposito. isso que acredito. pois llms sao bons de
autocompletar o texto se a ideia central for capturada."*

**The blob hashes stand in for a commit SHA deliberately.** A round that carried only the branch head
would read as clearing a draft that head does not contain. If either hash no longer matches, this round
was written against a draft that has since moved and does not apply to the current one.

### Citable findings

**None.** The three findings of round 1 are cleared, each checked against the same clause that raised it.

1. **The spine is sourced.** All three invented mental states are gone from both editions
   (`grep -iE "expected|esperava|proud|orgulho"` → no match), as are the two lesser ones (`steal`,
   `roubar`, *"the only reason I trust the current shape"*, *"o único motivo pelo qual eu confio"* → no
   match). What replaced them is his own stated belief, in his own order: *"A model is good at
   completing the text once the central idea is captured"* / *"Um modelo é bom em completar o texto
   depois que a ideia central está capturada"* is a near-verbatim rendering of the source sentence, and
   *"The column I care most about"* / *"A coluna com que eu mais me importo"* renders *"o mais
   importante … isso que acredito"*. The remaining first-person stances in that passage — *"the only
   one I would hand to a machine to draft"*, *"how I read Tan's line now"* — are the same claim applied
   to a second object rather than a second claim, so they point at the same source sentence.

   **What was specifically checked, because it is where a swapped-in stance would have hidden: his
   belief is CONDITIONAL** (*"se a ideia central for capturada"*), and the two surfaces that travel
   without the body preserve the condition. The excerpts keep the column before the claim (*"That is
   the column I would keep … and the reason is that a model can fill in the rest"* / *"É a coluna que
   eu manteria … e o motivo é que o modelo completa o resto"*), and both `takeaway` lines carry the
   condition as their second clause. An excerpt reading *"a model fills in the rest"* with the
   condition stripped would have been a citable provenance finding under the *Practical test*; neither
   does.

2. **The travelling surfaces are clear.** Both excerpts now take his own file as the subject and the
   talk as the occasion; neither states any relationship between the two men at all, which is what
   round 1 asked for. Both headings are *"The word for it"* / *"A palavra para isso"*. The body's
   dissolving clause is unchanged and still lands. `himself` / `sozinho` dropped from the Tan
   attribution in both editions — that was advisory and was taken.

3. **The title pair holds on all six, checked in each edition on its own.** EN *"I wrote down what my
   agents do. The half worth writing is the why."* / PT *"Registrei o que os meus agentes fazem. A
   metade que vale escrever é o porquê."*
   - **1 (the gate)** — subject named (a record of what his agents do) and the finding stated; it
     resolves with the title alone, stripped of excerpt and card.
   - **2** — half of his own effort is what is at stake, and he is in the sentence.
   - **3** — setup, full stop, and the second half turns *against* the first rather than completing it:
     what he says he wrote down is named, then displaced. Same shape as the ratified pair.
   - **4** — the image is the registry's own columns, taken from the piece and imported from nothing.
     No locative figure in either edition, so the preposition test has nothing to catch.
   - **5, and this is the one round 1's finding 3 turned on** — the turn now rests on what the piece
     argues: *"Purpose and limit are both reasons. Only the middle column is inventory"*, and *"the
     middle column is the only one I would hand to a machine to draft"*. **The removed surprise is not
     load-bearing anywhere in the new pair.** `everything` / `tudo` is gone, so the title no longer
     performs the over-claim the article's own closing habit forbids.
   - **6** — two clauses, a stop, a reversal; uppercasing removes nothing.

### Advisory and droppable

- **EN and PT, the spine paragraph:** *"What cannot be reconstructed is a decision nobody made"* /
  *"O que não dá para reconstruir é uma decisão que ninguém tomou"* reads literally as a decision that
  does not exist. The intended sense is a decision the machine took no part in. One load-bearing
  sentence, ambiguous in both editions.
- **PT only:** *"Propósito e limite são os dois um motivo"* is ungrammatical — *"são os dois razões"* /
  *"são, os dois, motivos"*. It is the sentence that states the article's thesis.
- **PT only:** *"Que é como eu leio a frase do Tan agora"* is an awkward fragment where the EN
  (*"Which is also how I read Tan's line now"*) is a deliberate one; the PT reads as a dropped word.
- **PT only:** *"organizar o conhecimento de uma companhia"* — *companhia* where the same piece says
  *empresa* three paragraphs earlier and later.
- **Both:** *"Notice what went stale in the first one, though. It was a file path."* names the
  observation and leaves the reader to finish it. It is doing real work — the half that rotted was the
  inventory half — and one clause would land it.
- **Both, carried forward from round 1 and unchanged:** the title's *"my agents"* under-describes what
  the registry covers (personas, hooks, commands, skills); the body corrects it immediately.
- **For the merge gate, not for the writer — a number, not a voice matter.** *"Seven are live. Fourteen
  are gone"* / *"Sete estão vivos. Quatorze sumiram"* was sourced in round 1 against
  `feat/blueprint-registry-313`. The ADR library in `tadeumendonca-skills` now shows **six** live
  records on `feat/adr-fold-verification-capability` (`ls docs/adr/` → 6 records plus `README.md` and
  `template.md`), 0003 having been folded into 0006. **Provenance is intact and this is not a finding**
  — the figure was true where it was read. Whether it is still true is external correctness, which is
  `product-lead`'s blocking veto at the merge gate, not this ruler's.

### Recorded as the owner's calls, not spent on

- **The slug still names the retired turn** — `what-my-agents-dont-do` / `o-que-os-meus-agentes-nao-fazem`
  against a title that no longer argues it. Agreed: the slug is a published URL, this ruler says nothing
  about it, and changing it after publication is a different cost than changing it now.
- **The Tan quotations are verbatim against an ASR transcript, not against the audio.** Unchanged from
  round 1, still a publication risk for the owner and the merge gate, still not something this ruler
  settles.
- **The autocomplete claim is stated as his belief with his reason and kept out of the title.** Agreed
  that this is his call; it is sourced either way, which is all this ruler asks.

### What this round did not check

Unchanged from round 1. Provenance is on this ruler; **external correctness is not** — nothing here
verifies a claim against the code, another surface, or how it will read in a year. Cross-surface
staleness, evidence proximity, the machine read and durability are uncovered by this pair by
construction.

CONTENT-REVIEW-CLEAR
