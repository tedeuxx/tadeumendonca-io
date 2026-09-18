# Content review — `what-my-agents-do`

Rounds against `published-voice`, at most two. A finding is **citable** only where the clause it
violates is quoted verbatim in it; everything else is **advisory and droppable** and carries no claim
on the writer's time.

**This file was `what-my-agents-dont-do.md` until 2026-09-12** and was renamed with the draft it
records, when `-io#259` was split. **The two rounds below are untouched** — they read the blobs they
name, under the filenames those blobs actually had, and re-labelling them would falsify a record of
what was reviewed. ~~**The round count is the terminal condition and it is spent:**
`grep -c '^## Round'` → **2**, closing `CONTENT-REVIEW-CLEAR`. Nothing below adds a third.~~

**STRUCK 2026-09-16 — the count is THREE and the third round is real.** Struck rather than edited
because this sentence is what told every reader the pair was closed, and a reader who trusts it would
skip the only round written against the re-spined article. **The bound was not lifted; the counter was
RESET by the orchestrator's ruling**, on the ground that rounds 1 and 2 read a draft five of the
owner's 2026-09-16 rulings replaced — spine, title, all three body sections and close. Round 3 states
the ruling and its reason in its own opening; read it there rather than here.

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
  `feat/blueprint-registry-313`. ~~The ADR library in `tadeumendonca-skills` now shows **six** live
  records on `feat/adr-fold-verification-capability` (`ls docs/adr/` → 6 records plus `README.md` and
  `template.md`), 0003 having been folded into 0006.~~ **Corrected 2026-08-25: the round published a
  number its own command does not return, against a branch that was never the article's base.** At
  `feat/adr-fold-verification-capability` (`448c506`, that branch's head when this round ran) the
  library held **19** live records, not six — `git ls-tree --name-only 448c506 docs/adr/ | grep -c
  '^docs/adr/[0-9]'` → `19`, and the `ls docs/adr/` the round shipped returns **21** entries there, 19
  records plus `README.md` and `template.md`. The fold of 0003 into 0006 is real and is that branch's
  head commit; what it left was 19, and the six was measured against nothing. **The figure the article
  publishes stands on `origin/main`**, which is where it was re-derived at `004d157`: the same command
  against `origin/main` returns **7**, and
  `git show origin/main:docs/adr/README.md | grep -cE '^\| 00[0-9][0-9] \|'` returns **14** — so
  *twenty-one issued · seven live · fourteen gone* holds. **Provenance is intact and this is not a
  finding** — the figure was true where it was read. Whether it is still true is external correctness,
  which is `product-lead`'s blocking veto at the merge gate, not this ruler's.

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

---

## Truth fix — 2026-09-12 (`-io#259`), and it is deliberately NOT a round

**This is not `## Round 3` and must not be counted as one.** The pair's bound is two rounds and it is
spent; the heading is spelled differently on purpose so `grep -c '^## Round'` still returns **2**.

**Why the two clear rounds did not catch any of this.** Both returned `CONTENT-REVIEW-CLEAR` over six
false numbers, and that is the pair working as specified rather than failing: `published-voice` carries
a **provenance** gate — *is this claim sourced* — and no verification against the code. Round 2's own
closing section says so in its own words (*"external correctness is not"*). **So the finding here is
about the ruler's coverage, not the reviewer's attention**, and it is the residual `content-publishing`
already records for this lane: since the copy veto left it on 2026-09-03, nothing here checks a claim
against the world except the owner at the held preview.

### The split — the ruling, not a craft call

Rule 9's ceiling is **1,500**; the draft ran **1,809** (EN) and **1,946** (PT), and rule 10 forbids the
repair that first suggests itself: *"A piece over the ceiling becomes a SERIES. It is not trimmed to
fit."* The owner ruled SPLIT. This file now records the **first** piece — *what the agents do*. The
second — what none of it can check, the two retrieval failures, the declared-incomplete coverage — is
**`-io#638`** and is out of scope here.

**The slug and the title stopped disagreeing, because the disagreement WAS the seam.** The slug named
the second piece and the title named the first. Resolved in the title's favour, since the title is what
the retained argument proves:

| | before | after |
|---|---|---|
| EN slug | `what-my-agents-dont-do` | `what-my-agents-do` |
| PT slug | `o-que-os-meus-agentes-nao-fazem` | `o-que-os-meus-agentes-fazem` |
| filename key | `what-my-agents-dont-do` | `what-my-agents-do` |

**Both retired strings are left free for `-io#638`**, which is the piece they were always describing.
Nothing was published under either, so no URL breaks — round 2 recorded that changing the slug is cheap
now and expensive later, and this is the *now*.

### Post-split measurements, each with the command that produced it

```
for f in apps/fed/src/content/blog/what-my-agents-do.en.md apps/fed/src/content/blog/what-my-agents-do.pt.md; do
  printf '%s\t%s\n' "$f" "$(awk 'BEGIN{n=0} /^---$/{n++; next} n>=2' "$f" | wc -w)"; done
#   .en.md  1388
#   .pt.md  1479      ceiling 1500 — both under
```

**Calibrated against the figures the ruling published**, so the instrument is the ruling's own rather
than a second one: the same command over `HEAD`'s pre-split blobs returns **1809** and **1946**,
reproducing the Issue exactly.

**Recorded rather than smoothed over: the PT margin is 21 words**, and **neither edition is inside rule
9's 900–1,300 band** — both are under the ceiling, which is the acceptance criterion, and no more.
Portuguese runs long here because the article declares a gloss device — original *and* translation for
every quoted English source — which is PT-only surplus with no EN counterpart. Any later edit to the PT
edition has to re-measure rather than assume headroom.

**Section count: 4 H2 sections in each edition** (`grep -c '^## '`), against rule 11's ceiling of six.

### The six false claims — re-derived at head, not inherited

Every figure below was re-measured in `tadeumendonca-skills` at `cb6e605b`. **One came back different
from the ruling's own table**, which is why the dispatch required re-derivation.

| # | site | published | ruling said | at head | command |
|---|---|---|---|---|---|
| 1 | `:45` | Seven personas / Sete personas | 8 | **8** | `ls agents/*.md \| wc -l` |
| 2 | `:69` | Nineteen personas became seven | 8 | **8** | same, plus `docs/adr/0002-*.md:594` for the 19→6 cut |
| 3 | `:69` | Sixty-nine skills became fourteen | 15 | **15** | `jq -r '.skills[]' .claude-plugin/plugin.json \| wc -l` |
| 4 | `:47` | 34 entries / 34 entradas | 54 | **55** | `grep -cE '^### [0-9]{4} ' docs/blueprint-registry.md` |
| 5 | `:9` excerpt | 34 behaviours | 54 | **55** | same as #4 |
| 6 | `:87` | Six skills still have no entry | five | **five** | set difference, below |

**#4 and #5 moved under the ruling.** The registry held 54 entries when `content-reviewer` measured it
and holds **55** now — `### 0055` landed in `9114ef83` (*wire the fourth rite into every surface that
enumerates the set*, `-skills#401`), after that measurement and before this slice. Ids run **0001–0055
with no gaps**, and the five `tipo` values sum to the same total (14 + 13 + 12 + 4 + 12 = 55), so the
count is cross-checked rather than resting on one grep.

**#6 left this piece with the section that carried it.** The coverage paragraph is `-io#638`'s
material, so the claim no longer appears in this edition at all. It is **not corrected here and must
not be read as fixed** — it is `-io#638`'s to carry. The re-derivation is recorded so that piece does
not start from the ruling's figure:

```
comm -23 <(jq -r '.skills[]' .claude-plugin/plugin.json | sed 's|^\./||' | sort) \
         <(grep -A2 '^- \*\*tipo:\*\* knowledge' docs/blueprint-registry.md \
           | grep -oE 'skills/[a-z-]+' | sort -u)
# -> skills/backend, skills/cloud-infrastructure, skills/definition-of-done,
#    skills/frontend, skills/planning-poker        = FIVE
```

**`:69` was rewritten rather than re-digited, as the ruling required.** *"Sixty-nine skills became
fourteen"* is a consolidation narrative and the library grew back to fifteen, so a substituted digit
would have produced a true sentence making a false point. The replacement states both numbers and turns
the growth into the argument — a count that falls and then climbs is the shape that stops being
readable when nobody wrote the reason, which is this piece's own thesis arriving on its own evidence.

### What was checked and deliberately NOT swept

- **`:47` "one of five types from a closed list"** — still true. `docs/blueprint-registry.md:24` names
  exactly five and the arm reddens on a sixth.
- **`:65` "twenty-one numbers, seven live, fourteen gone"** — re-derives.
  `ls docs/adr/[0-9]*.md | wc -l` → **7**; the `## History` rows count **14**; 7 + 14 = 21.
- **The bidirectional disposition test** — still exists, both directions, in
  `hooks/scripts/inventory-counts.test.sh` (a retired number with no file and no row, ~`:3820`; a
  History row for a live record, ~`:3857`).
- **All four verbatim quotations still match their sources exactly.** Checked against
  emphasis-stripped, whitespace-collapsed sources, because two of the four are wrapped or bolded in the
  original and a naive line grep returns a false negative on them. Three are retained here; the fourth
  (*"No instrument in this repository can tell a true purpose from a plausible one…"*) leaves with
  `-io#638`'s section and was verified anyway, so that piece inherits a checked quotation.

### One claim NOT on the ruling's list, reported rather than fixed silently

**`:45` read "Seven personas that argue with each other".** The count was on the list; **the verb was
not**, and at eight it is no longer true of the whole set — `scrum-master` holds `tools: []` and argues
with nobody, and `content-writer` exists because a lane had no builder rather than because anyone
wanted a disagreement. Corrected to *"several of them there specifically to disagree with another one"*,
which is what `agents-configuration`'s four-reason rule actually licenses.

### What this pass did not do

**It did not re-run the ruler over the rewritten prose.** The bound is spent, so the tightening the
split required — roughly 420 EN words cut to land under the ceiling — was read against
`published-voice` by the writer and by nobody else. **The register, the arc, the *it worked* beat, the
warm close and the three habits are the reviewed draft's**, and the cuts were compression rather than
re-argument — but that is the writer's own account of his own edit, which is exactly the bias the pair
exists to absorb. The owner reads the held preview.

---

## Round 3 — 2026-09-16

draft: `apps/fed/src/content/blog/what-my-agents-do.en.md` @ `4238b55` (read), repaired in the
working tree, blob `7d87bee`
draft: `apps/fed/src/content/blog/what-my-agents-do.pt.md` @ `4238b55` (read), repaired in the
working tree, blob `052e629`
ruler: `published-voice` · sources re-derived in `tadeumendonca-skills` at `d240d6f7` ·
`-io#259` body and all six comments read at head

**THE COUNTER WAS RESET BY THE ORCHESTRATOR'S RULING, AND THIS ROUND EXISTS BECAUSE OF IT.** The two
rounds above are spent and remain spent *against the draft they read*. Five of the owner's rulings on
2026-09-16 replaced the spine, the title, all three body sections and the close — the piece at
`4238b55` is closer to a new article than an edited one, and `content-writer`'s own report says so.
**Carrying a bound across a substantially different artifact caps scrutiny rather than raising it**,
which inverts what the bound is for: it exists to stop a pair grinding ONE draft forever, not to ship
a rewrite unread. The ruling is recorded here rather than left in a dispatch so the next reader of
this file finds the decision instead of an unexplained third section.

**I agree with the reset and say so as the persona whose bound it is** — with one boundary stated, so
it is not read as the bound dissolving: the reset is keyed on *the artifact changed under the
rounds*, never on *more scrutiny would be useful*. The second reading is unbounded and is the thing
the cap protects against. `grep -c '^## Round'` now returns **3**, and this pair is terminal here.

### Repaired — ground 2, false against the source

1. **`:46`, both editions — the ADR rule is attributed to the LIBRARY's title.** source: the library's
   index is `docs/adr/README.md`, titled `# Methodology ADRs`; the quoted rule is the title of one
   record, `docs/adr/0020-an-adr-earns-its-place-by-explaining-the-current-codebase.md:1`
   (`# 0020. An ADR earns its place by explaining the **current** codebase`).

   What it claimed · EN *"the rule that library runs on is **its own title**"* · PT *"a regra em que
   aquela biblioteca funciona é **o próprio título dela**"*. **In PT the false reading is the only
   reading** — `dela` is feminine and resolves to `biblioteca` with nothing else available — which is
   what decides this rather than the EN ambiguity.

   What it claims now · EN *"the rule that library runs on is the title of one of its own records"* ·
   PT *"…é o título de um dos registros dela"*. Nine words changed in total; the quotation, the
   rhythm and the PT gloss device are untouched.

2. **`:62`, both editions — "both of those files" has no two files.** source: every fact and both
   quotations in *The word for it* come from **one** file — `docs/blueprint-registry.md`, the `tipo`
   row at `:24` (ids, *"one of five, closed and gated"*, *"A name outside the set reddens the
   suite."*) and the enforcement-join paragraph at `:37` (*"re-decided on every invocation…"*). The
   draft's own preceding sentence says so: *"Elsewhere in the **same file**"* / *"Em outro ponto do
   **mesmo arquivo**"*.

   What it claimed · EN *"Both of those files sit in the other repository"* · PT *"Os dois arquivos
   moram no outro repositório"* — contradicting the sentence two lines above it, in both editions, at
   the same line number.

   What it claims now · EN *"Every file I have quoted here sits in the other repository"* · PT
   *"Todos os arquivos que eu citei aqui moram no outro repositório"*. **This keeps the paragraph's
   wider scope rather than narrowing to one file** — the section-2 quotations come from
   `docs/adr/0020-*.md` and `docs/adr/README.md`, and all four source files sit in
   `tadeumendonca-skills`, so the replacement is true of the set the next clause (*"I wrote the
   reasons for myself"*) actually means.

**Post-repair measurement, with the command:** EN **1391**, PT **1471**, both under rule 9's 1,500
ceiling; **3** H2 sections each against rule 11's ceiling of six.

```
for f in apps/fed/src/content/blog/what-my-agents-do.en.md apps/fed/src/content/blog/what-my-agents-do.pt.md; do
  printf '%s\t%s\t%s\n' "$f" "$(awk 'BEGIN{n=0} /^---$/{n++; next} n>=2' "$f" | wc -w)" "$(grep -c '^## ' "$f")"; done
```

### The five verbatim quotations — all five HOLD, re-derived at `-skills d240d6f7`

Checked whitespace-collapsed against the source files, because two are bolded and one wraps, so a
naive line grep returns a false negative. **The selector is calibrated**: a one-letter mutation
(*"reddens the suites"*) returns 0 against the same source, so the hits are real hits.

| quote | source | result |
|---|---|---|
| *"An ADR earns its place by explaining the **current** codebase"* | `docs/adr/0020-…md:1` | **exact** |
| *"A record leaves this library only as a disposition, never as an absence."* | `docs/adr/README.md:331` | **exact** |
| *"one of five, closed and gated"* | `docs/blueprint-registry.md:24` | **exact** |
| *"A name outside the set reddens the suite."* | `docs/blueprint-registry.md:24` | **exact** |
| *"re-decided on every invocation would look exactly like a derived one and be neither."* | `docs/blueprint-registry.md:37` | **exact** |

**One editorial difference, recorded so nobody reads it as drift:** the draft closes quotation 1 with
a terminal period the ADR's heading does not carry. The **words** are byte-identical; the period is
the ordinary punctuation of a title quoted as a sentence, and no clause of this ruler speaks to it.

**Every figure in the re-spined prose also re-derives at `d240d6f7`**, and none needed repair:
8 personas (`ls agents/*.md | wc -l`) · 15 skills (`jq -r '.skills[]' .claude-plugin/plugin.json | wc -l`)
· 21 issued / 7 live / 14 disposed (`ls docs/adr/[0-9]*.md | wc -l` → 7;
`grep -cE '^\| 00[0-9][0-9] \|' docs/adr/README.md` → 14) · nineteen-to-six
(`docs/adr/0002-roster-and-dev-loop.md:594`) · sixty-nine-to-fourteen and *twenty-two findings on a
documentation PR* (`CLAUDE.md:464`) · the per-behaviour row rule and the `id`/`propósito`/`o que não
faz` fields (`docs/blueprint-registry.md:9–29`). `/architecture` exists in the consuming repo,
carries tiers, gates and diagrams, and publishes **8 personas** at `:192` — so the pointer at `:36`
does not send a reader to a page that contradicts the piece.

### The four things the dispatch asked for hardest — judged, and three needed no edit

1. **The teaching posture holds, and `content-writer`'s account of it is FALSE.** Its report says the
   only surviving second person is *"You cannot use my hook. You can absolutely use the sentence…"*,
   kept as a contrast. **That sentence is in neither edition and appears nowhere in the branch's
   history of this file.** What actually survives is three sites, and I judge all three clean:
   `:11` the `takeaway`; `:22` an impersonal *"if you took the products away"*; `:64` the close, four
   generic uses inside the corpus's own warm sign-off. **Ruling 9's cut is genuinely applied** — the
   *"## If you want to start one"* section, its three imperative habits and its *"go and look at
   whatever you have been writing down"* are all gone from both editions. The one drift is advisory
   below; it is in the `takeaway` and it is not repairable on either ground.
2. **Journey first, export second — CLEAN, and it is the strongest thing the re-spine did.** The
   plugin is named once, at `:62`, in the last section, and the sentence that names it *demotes*
   portability explicitly: *"That it can be is not why I wrote it: I wrote the reasons for myself, and
   only afterwards found out the reasons were the part that could leave."* No sentence anywhere makes
   portability the first claim — the excerpt leads on *"a written model of my own loop"*, the opening
   on the talk and the scale collision, and `:28` says the products are *"the part I can swap"*.
3. **The close CLOSES.** Corpus clause: *"The close is a warm sign-off that instructs or wishes; it
   does not summarise."* `:64` names the act (*"naming it late, and naming it anyway"*), gives its
   reason, and **wishes** — *"Good luck, and I hope you find yours in better shape than I found
   mine."* Nothing in it restates the piece. **It does not merely stop**: the late-naming beat is the
   section's own argument arriving at the reader, which is what the three habits were doing badly.
4. **The two editions are one piece in two voices — CLEAN at the structural grain.** Identical H2 text
   positions (`:24`, `:38`, `:54`), 26 paragraphs each, every repairable claim at the same line number
   in both, and the PT gloss device declared at the first English quotation (`:46`, *"daqui em
   diante"*), which takes round 1's advisory. Two PT-only rhythm defects are advisory below; neither
   is a mirror break.

### Advisory and droppable

- **`:11`, the `takeaway`, both editions — the one place the teaching posture survives.** It reads
  *"what has to be written down is the model of **your own** loop … when **you** threw it out"*, where
  the excerpt one line above says the same thing in the first person (*"a written model of **my** own
  loop"*). The pre-respine `takeaway` was impersonal (*"what has to exist in writing is the central
  idea"*), so the second person arrived in the same commit that cut the teaching close. **Deliberately
  not repaired**: the site's own published `takeaway` fields already include a second-person
  prescriptive one, and the close rule explicitly permits a sign-off that *instructs* — so I cannot
  quote a clause this violates, and editing it would be taste. Flagged because it is the exact thing
  ruling 9 was about.
- **`:34`, both — *"What those two decisions eventually produced is a file"*** asserts a causal origin
  the source assigns elsewhere: ADR-0021 records the registry as occasioned by `/blueprint`'s
  portable-export requirement (`#313`), not by the persona criterion or the grinding rule. **Left
  alone** because the ruler's own carve-out covers it — a transition *"that carries no claim of its
  own … is craft"* — and because the substance is sourced: the disagreement principle is a registry
  `propósito` at `docs/blueprint-registry.md:691`. One clause (*"eventually led me to"*) would remove
  the causal reading at no cost.
- **`:20` PT — *"e para para testar o próprio pitch"*** reads as a doubled word on the page. *"e
  interrompe para testar"* keeps the beat. PT-only; EN's *"stops to stress-test it"* is clean.
- **`:62` EN — *"Every file I have quoted here"*, my own repair, is longer than what it replaced.**
  Recorded so the next hand knows it is mine and is free to shorten it, provided the count stays true.
- **`:10` excerpt EN/PT — *"I run the same architecture"* is a stronger claim than the body makes**;
  the body says the products are swappable and the model is what holds it up, and `:22` is careful
  that he is *"one person with two repositories and weekends"* against Tan's companies. It is
  consistent with the working title's *"AI-native company of one"*, **so it must be re-read once the
  title is picked** — if a candidate drops that identification, the excerpt asserts it alone on the
  surface that travels without the body.
- **`date: '2026-08-25'`** is three weeks behind today on a piece not yet released. The lane's release
  step sets the real date; nothing in this ruler speaks to it.

### Carried forward from rounds 1 and 2, unchanged and still not this ruler's to settle

- **Every Tan attribution is reported speech against an ASR transcript nobody retained**, including
  `:20`'s *"he says so himself, halfway through, and stops to stress-test it"* and `:48`'s landfill and
  librarian. The draft declares this outright at `:18`, which is the structural remedy `5f2dfac`
  landed, and both earlier rounds recorded it as a **publication risk for the owner**. I did not
  repair it: the only Tan source in `-io#259` is the owner's own *«eh um pitch de ai-native company na
  realidade»*, which supports the characterisation and not *"he says so himself"*, and the transcript
  that would settle it existed in a session I cannot reach. **Cutting a sentence two rounds ratified,
  on a source I cannot see, would be authorship rather than repair.**
- **`:52` promises a second article** (*"is the next article"*). `-io#638` carries it; nothing
  guarantees sequencing. Durability, not provenance.

### What this round did not check — and on this lane NOBODY else does either

Provenance is on this ruler and so is falsity against the source; **external correctness is not**.
Since the copy veto left this lane on 2026-09-03, **four classes reach the owner unread**:
cross-surface staleness, evidence proximity, the machine/ATS read, and durability. Nothing replaced
that lens here. And **nobody re-reads the two repairs above** — they are mine, and the authorship
bias the pair exists to absorb now sits on them. The owner reading the held preview and the merge
gate reading the diff are what absorb it; neither is an instrument.

CONTENT-REVIEW-FINDINGS

---

## Round 4 — 2026-09-18

draft: `apps/fed/src/content/blog/what-my-agents-do.en.md` @ `a50e7fb` (read), repaired in the
working tree
draft: `apps/fed/src/content/blog/what-my-agents-do.pt.md` @ `a50e7fb` (read), repaired in the
working tree
ruler: `published-voice` · Tan quotations re-derived against `https://ai.engineer/talks/eBUyTS7SzV4`
(fetched 2026-09-18) · own-file quotations and every figure re-derived in `tadeumendonca-skills` at
`origin/main` = `cb72abc2`

**THE COUNTER WAS RESET A SECOND TIME, BY THE ORCHESTRATOR, ON THE SAME GROUND AS THE FIRST.** Round 3
read blob `7d87bee`; between that blob and `a50e7fb` the piece gained **two H2 sections and 417
words** (1391 → 1808, EN) when the transcript was found, and then had the timestamp apparatus stripped
out of it — 16 inline minutes to 0, 17 quoted spans to 5. **I agree with the reset**, on exactly the
key round 3 stated: *the artifact changed under the rounds*, never *more scrutiny would be useful*.

**And I record a boundary, because this is the second reset on one Issue and the pattern is what the
cap exists to stop.** Two resets keyed on *the artifact changed* are still two correct applications of
the key; three would be indistinguishable from the unbounded reading. **The observable version of the
key, so the next reader is not asked to take it on trust** — per commit, body words and H2 count:

```
git log --format='%h %ad' --date=short -8 -- apps/fed/src/content/blog/what-my-agents-do.en.md
#   a50e7fb  1808  h2=5   <- this round
#   8705571  1746  h2=5
#   86fbc9e  1742  h2=5   <- the transcript commit: +307 words, +2 sections
#   b204833  1435  h2=3
#   25958f4  1387  h2=3   <- the neighbourhood round 3 read
```

**If a fifth round is ever proposed, derive those two columns first.** A reset is honest only where the
numbers move like the two middle rows; where they do not, the bound is spent and the piece goes to the
owner as it stands.

### Repaired — ground 2, false against the source

1. **`:10`, the `excerpt`, both editions — "four pieces that are all markdown" is contradicted by the
   talk.** source: the transcript, in the run-up to the very quotation the piece uses at `:30` —
   *"They're markdown files and other types of markdown files, **and maybe there's some TypeScript in
   there too**."* The fourth piece is the one he hedges for: his own trigger-eval example is a test
   (*"going in and actually having a test that says, 'When I need to alter a test file, does test.md
   actually get loaded?'"*), and the conference's own summary of that beat reads *"A small TypeScript
   example makes that contract explicit."*

   What it claimed · EN *"four pieces that are all **markdown**"* · PT *"quatro peças que são todas
   **markdown**"*.

   What it claims now · EN *"four pieces that are all **files**"* · PT *"quatro peças que são todas
   **arquivos**"*. **The replacement is the piece's own word, twice over** — the body at `:26` (*"each
   one turns out to be a file"* / *"cada uma delas acaba sendo um arquivo"*) and the `takeaway` one
   line below the excerpt (*"the four pieces of his company are **files**"*). So the repair also
   removes a disagreement between two frontmatter fields of the same piece.

   **Why a repair rather than an advisory:** the excerpt is a surface that travels alone.
   `published-voice` says so about the title and the reason is identical here — *"the OG card and every
   social post strip exactly that context"* — so a rhetorical shorthand the body earns at `:30` is read
   as a literal enumeration wherever the excerpt appears without the body.

2. **`:39`, both editions — "not on his list" puts Tan's own fifth piece outside Tan's list.** source:
   the brain is the talk's title (*Every company should have a Brain*, the page's own `<title>`), its
   closing beat, and one of the portable parts he enumerates at 18:15 — *"Use skill files as employees.
   The library and the librarian. Never do one-off work. Those travel with you to any stack."* **The
   piece reports that same list itself at `:89`**, and its own excerpt at `:10` attributes the fifth
   piece to Tan outright (*"and a fifth one underneath: the brain"*).

   What it claimed · EN *"a fifth piece underneath these four that is not on **his** list"* · PT
   *"…que não está na lista **dele**"*.

   What it claims now · EN *"…that is not on **that** list"* · PT *"…que não está **naquela** lista"*.
   One word each; the sentence's beat, its dash and its second clause are untouched.

   **In PT the false reading is again the only reading** — *"a lista dele"* resolves to Tan and to
   nothing else — which is what decides this, exactly as it decided round 3's first repair. In EN a
   charitable reading exists (*his list* = the four bullets ten lines above) and I would have left the
   EN alone on its own; the two editions are one piece, and a repair landing in one and not the other
   manufactures a divergence.

### Cited and deliberately NOT acted on — rule 9's ceiling

**I can quote the clause and I am not repairing it, and both halves of that need saying.** The clause:
*"**the site piece**: **900–1,300 words; ceiling 1,500. At most 6 sections.**"* Post-repair, measured:

```
for f in apps/fed/src/content/blog/what-my-agents-do.en.md apps/fed/src/content/blog/what-my-agents-do.pt.md; do
  printf '%s\t%s\t%s\n' "$f" "$(awk 'BEGIN{n=0} /^---$/{n++; next} n>=2' "$f" | wc -w)" "$(grep -c '^## ' "$f")"; done
#   .en.md  1808  5      ceiling 1500 — 21% over
#   .pt.md  1912  5      ceiling 1500 — 27% over
```

**Rule 11 is clean** (5 sections against a ceiling of six). **Rule 9's word ceiling is not, in either
edition, and the draft round 3 cleared was inside it** — 1391 / 1471 then, 1808 / 1912 now. The overage
arrived whole at `86fbc9e`, the commit that found the transcript.

**Three reasons it is not repaired, and only the first is a ruling:**

- **The owner ruled on 2026-09-18 that the count is a target and not a limit**, relayed in the
  dispatch. `published-voice`'s own *Precedence* puts his live words above everything else in the file,
  and rules 9–11 are carried there as *"a RATIFIED BENCHMARK, not a finding"* — his ratification, which
  his later ruling supersedes.
- **The ruler's own prescribed repair is not available to me.** Rule 10: *"A piece over the ceiling
  becomes a SERIES. It is not trimmed to fit."* Splitting a piece is authorship, not repair.
- **The dispatch forbids the cut outright**, and it is right to: trimming 300 words to reach a number is
  the exact move rule 10 names.

**What this leaves behind is drift in the RULER rather than in the draft, and it is not mine.**
`published-voice` still publishes 900–1,300 / ceiling 1,500 as ratified, and the owner has now ruled the
ceiling advisory. A reviewer arriving at that file next week will quote a number he has retired. That is
`agents-lead`'s to reconcile in the skill; recorded here so it is not rediscovered as a finding against
a fourth draft.

### The five verbatim quotations — all five HOLD, and the selector is calibrated

The three Tan quotations were checked against the published transcript, tag-stripped and
whitespace-collapsed; the two own-file quotations against `tadeumendonca-skills` at `cb72abc2`, which
**has moved since round 3** (`d240d6f7` → `cb72abc2`).

| quote | source | result |
|---|---|---|
| *"When you sit down with Claude Code or Codex, you're not writing software, you're hiring, training, and managing a workforce made of markdown."* | transcript, 5:52 | **exact** |
| *"a brain nobody curates becomes a garbage dump with great search."* | transcript, 14:27 | **exact** |
| *"if you have to ask for something twice, you failed."* | transcript, 16:05 | **exact** |
| *"An ADR earns its place by explaining the **current** codebase"* | `docs/adr/0020-…md:1` | **exact** |
| *"A record leaves this library only as a disposition, never as an absence."* | `docs/adr/README.md` | **exact** |

**Calibration, because a search that only ever hits is not a search:** one-letter and one-word mutations
of three of the five — *"a garbage dumps with great search"*, *"a brain nobody curates becomes a
landfill"*, *"never an absence"* — return **zero** against the same sources. The hits are hits.

### The reported speech — every Tan paraphrase checked, all supported

Not a quotation check. The piece now carries in the owner's voice what it used to quote, so the
paraphrases are where a false attribution would live now.

- `:20` *"he says so on stage, in the room he expects to tear the numbers apart"* — *"So let me stress
  test my own pitch because you would anyway."* ✓
- `:20` the refusal of the revenue and headcount figures — the talk is indeed the only source for the
  400×, the 95%-AI-generated batch and the 94 companies past $100M. ✓ The sourcing constraint working.
- `:16` *"No slides, no deck, just him talking"* — he says *"no slides"* five times in one minute. ✓
- `:45` *"The bugs, he says, are **usually** work sitting on the wrong side of that line"* — *"all of
  the bugs … it's **usually** because something is happening in one side of the equation that should be
  in the other."* ✓ **The softening the dispatch flagged is correct and it is load-bearing** — without
  *usually* it is a stronger claim than he makes.
- `:47` the eight hundred — *"seating 800 at a time"* out of a population of 6,000. ✓
- `:53` *"retrieval is the easy half — being worth retrieving from is the product"* — *"Retrieval is
  easy. Being worth retrieving from is the product."* ✓
- `:55` *"provenance on every fact, a check for when a new one contradicts an old one, and a librarian
  whose actual job is pruning"* — *"provenance on every fact, contradiction checks when new information
  collides with the old, and a librarian, human plus agent, whose actual job is pruning."* ✓ (advisory
  below).
- `:65` rented / amnesia — *"Model quality is rented, but if you build your brain, you own that brain"*
  and *"wakes up every morning with amnesia, no matter how good the model is."* ✓
- `:89` the portable list — *"Use skill files as employees. The library and the librarian. Never do
  one-off work. Those travel with you to any stack."* ✓
- `:28` the four-row mapping — the conference publishes it as a table with the same four rows (*Skill
  file / Resolver table / Filing rules / Trigger evaluation*). ✓ The talk says `tests.md` in the routing
  example and `test.md` in the evaluation example; the piece uses `test.md` and does not reproduce the
  inconsistency, which is a defensible pick and not a defect.

### Every figure re-derived at `cb72abc2`, and none needed repair

```
git show origin/main:.claude-plugin/plugin.json | jq -r '.skills[]' | wc -l            # -> 15
git ls-tree --name-only origin/main agents/ | grep -c '\.md$'                          # ->  8
git ls-tree --name-only origin/main docs/adr/ | grep -cE 'docs/adr/[0-9]+.*\.md$'      # ->  7
git show origin/main:docs/adr/README.md | grep -cE '^\| 00[0-9][0-9] \|'               # -> 14   (7+14 = 21)
```

`:75`'s *nineteen → six → eight* and *sixty-nine → fourteen → fifteen* both hold (`CLAUDE.md:440`,
`CLAUDE.md:342`). `:37`'s bidirectional skill arm exists in both directions
(`hooks/scripts/inventory-counts.test.sh`, `FORWARD` / `REVERSE`), and so does `:61`'s disposition arm —
the reverse limb is there in its own words: *"a row for a number that is still live."* `:91`'s
`/architecture` publishes **8 personas** and **15 skills**, so the pointer does not send a reader into a
contradiction.

### The four defect shapes — swept, two live instances, both advisory

**Neither is repairable on either ground and I have left the prose alone.** They are the two places the
piece still names a thing one beat away from delivering it.

- **`:32` asserts a collision of vocabularies and shows one side of it.** *"The interesting part is not
  that they matched — it is that I had chosen none of those names"* — and the four bullets that follow
  are labelled in **Tan's** vocabulary on both sides of the equals sign (*Skill file = employee*). The
  owner's own names arrive later and elsewhere: `loop`/`product`/`content` at `:35`, persona and hook
  and verdict at `:49`. **Shape C — an equivalence asserted and never shown**, at the point of
  assertion. Not repairable: the claim is true, and choosing which of his names to display is
  authorship.
- **`:75` ends the section on "each entry", and the piece never introduces an entry of anything.**
  *"Which is why each entry has to say what that behaviour is for, and what it does not do"* has no
  antecedent anywhere in either edition — the registry that carries those fields is named nowhere,
  quoted nowhere and linked nowhere; it left with the section the split removed. **Shape A — a claim
  named and never delivered**, and it is the payoff sentence of the one section the piece tells the
  reader to act on (`:71`, *"take this one, and you can do it this week"*). **The claim is TRUE** — the
  fields exist and are gated — **so ground 2 does not fire**, and no clause of this ruler speaks to a
  dangling referent, so ground 1 does not either. **This is the single worst reading defect in the piece
  and it costs one clause to fix**: name the file once, the way `:59` names the decision library before
  quoting it. That edit is his or the writer's, not mine.

The other two shapes are clean. Every distinction the piece announces is drawn (`:41`'s heading → `:45`;
`:79` → `:81`; `:18`'s receipt-versus-recollection → the warranty sentence around it), and every
principle it states is consequenced (`:83` → the limit at `:85`; `:63` on the evidence at `:61`; `:71` →
the procedure at `:73`).

### The close — judged against the dispatch's three tests, and it passes one of three

- **Warm sign-off that wishes rather than summarises: CLEAN.** `:93` *"Good luck, and I hope you find
  yours in better shape than I found mine."* The corpus clause is satisfied exactly, and the PT mirrors
  it.
- **Last among substantive beats: NO.** The final run is `:87` (the deliberate omission, pointing at the
  next article) → `:89` (Tan's portable list, and his plugin) → `:91` (the architecture page) → `:93`
  (sign-off). **`:91` is a navigational note, and it is the last thing the reader is asked to do before
  goodbye** — the weakest beat in the run, in the strongest position but one.
- **Exactly one act: NO — three destinations in five paragraphs.** The next article, the plugin in the
  other repository, the architecture page. **Advisory and droppable**: no clause of this ruler caps the
  number of pointers before a sign-off, and rule 9's *"the terminal event is contact, not
  comprehension"* is about the ladder rather than about paragraph order, so I will not repair on it.
  **If one moves, `:91` is the one** — `:87` and `:89` are arguments and `:91` is a signpost, and the
  close reads stronger with `:89`'s last clause (*"the reasons were the part that could leave"*) landing
  straight into the wish.

### Advisory and droppable

- **`:75`'s dangling "each entry"** — the item above, restated here because it is the one I would most
  want him to see. One clause naming the file closes it.
- **`:32`'s one-sided vocabulary collision** — the item above.
- **`:91` as the last substantive beat** — the item above.
- **PT `:59`'s gloss device is declared AFTER two glosses have already run.** The declaration reads
  *"como o repositório é em inglês, vem o original e a tradução"* — scoped to that one quotation, in the
  third place the device is used (`:30`, `:55`, then `:59`). Round 3 recorded the device as declared at
  the first English quotation, which was true of the draft it read; the re-spine moved the declaration
  without moving it back to first use. PT-only; EN has no device to declare.
- **`:55`'s Tan paraphrase is near-verbatim and is not quoted.** *"a librarian whose actual job is
  pruning"* is six of his own words in a row, reported as the owner's summary; so is `:89`'s *"travel
  with you to any stack"*. Both are accurate, no clause speaks to paraphrase distance, and quoting them
  would put two more quotation marks into a piece the owner has just had stripped of apparatus — which
  is why this is flagged and not repaired.
- **`:39`'s second clause, *"that is the one that did not match"*, is stated at full strength three
  paragraphs before the piece shows the fifth piece matching.** `:57` says *"That is the claim I have a
  receipt for"* and `:59`–`:63` show the mechanism matching in detail; what does not match arrives only
  at `:67`, and it is the **scale**, not the piece. The reading survives — *did not match* means *the
  analogy broke there* — but the reader carries a flat contradiction for three paragraphs before it
  resolves. **Not repaired:** not false, and no clause caps how long a piece may hold a tension. One
  word (*"the one that did not hold"*) would remove it at no cost to the beat.
- **`:37` and `:61` state the same bidirectional-test move twice, in the same shape, 24 lines apart.**
  *"a declared skill that does not exist turns it red, and one that exists and was never declared does
  too"* and *"a number with no file and no row turns the suite red, and so does a row for a number that
  is still alive."* Both are true and both earn their place; what repeats is the **construction**, and
  it is the strongest remaining trace of the written-to-be-audited register. See the register read
  below.
- **`date: '2026-08-25'`** is 24 days behind today on an unreleased piece. The lane's release step sets
  the real date; carried forward from round 3, unchanged, and nothing in this ruler speaks to it.

### The register — the dispatch's first question, answered plainly

**It reads as an article, and it is worth his time.** The apparatus is gone and what it left behind is
mostly voice rather than report. The evidence, by his own constraints:

- **Constraint 4 (short declarative after long technical) is working and it is the piece's spine** —
  `:49` *"I got there by putting things on the wrong side of that line and paying for it."* · `:57`
  *"That is the claim I have a receipt for."* · `:63` *"Pruning is not the part that feels like
  progress."* Each lands directly after a paragraph of mechanism, which is exactly the rhythm.
- **Constraint 3 (limits stated before the reader reaches them) is the best thing in the piece** —
  `:18`'s warranty, `:22`'s *"one person, two repositories and weekends"*, `:67`'s scale honesty,
  `:85`'s *"I do not have the measurement"*, `:87`'s *"Saying that costs me a sentence; letting this one
  look finished would have cost more."* Five, unprompted, and not one of them is a hedge about his own
  work — they are limits with a fact in each, which is the filter this ruler sets between an admission
  and self-deprecation.
- **The *sacana* is present and it is dry** — `:18`'s *"an awkward thing to learn in a piece about
  memory"* is the register's own move: the gap between what was claimed and what was there, landing on
  the writer, with no exclamation mark anywhere in either edition.

**Where it still reads as a report, and it is one block rather than a tone:**

> **`:32`–`:37`, the four bullets, are a conformance matrix in prose clothing.** Four labelled rows,
> each closing on its verification. It is the one place the piece stops narrating and starts tabulating,
> and it is the block a reader who disliked the audited version would recognise first. **It is also the
> piece's load-bearing evidence**, so the finding is not *cut it* — it is that the four-for-four beat at
> `:39` is doing the narrative work while the bullets are doing none of it.

**`:37` and `:61`'s repeated verification construction is the second trace** — by the second occurrence
the reader recognises the sentence shape before its content, which is what makes prose read as
specification.

**That is the whole of it: two report-shaped spots in a piece with five paragraphs of earned honesty and
a close that lands. It is not the version he refused.**

### The Kiro gap — judged, not repaired, and I agree with the builder with one narrowing

**I agree: it is a gap and not a falsehood, and it must not be repaired by anyone but him.** No sentence
in either body claims Kiro, claims multi-harness operation, or claims the loop runs anywhere but here —
the vocabulary throughout is Claude Code's (`CLAUDE.md` at `:28`, hooks and personas and verdicts at
`:49`), and the only harness names in the body are Tan's, inside his own quotation at `:30`.

**The narrowing: the gap is not symmetric across the three names, and it is rule-1 shaped rather than
rule-5 shaped.** Codex is at least *in a sentence* — the one quotation the piece leans on hardest.
**Kiro appears in the title and in no sentence of either edition.** So the clause that bites is title
rule 1 — *"The reader knows from the title what they will find"* — and it bites mildly: a reader who
came for Kiro gets no contact with the word after the title. **Rule 5 does not fire**, and I checked it
specifically: *"carrying that thesis is a false claim in the most quoted line of the piece"* would
require the title to assert something the article does not prove, and *how to run yours* asserts nothing
about how many he runs.

**On the sentence the dispatch named — `:89`, *"Mine travels as a plugin … the one thing here built to
be carried off by somebody else"* — I judge it TRUE as written and I have not touched it.** It claims
that the plugin is the portable artifact; it does not claim the loop travels. **What carries the risk is
one word's company rather than the word itself:** *travels* is also Tan's verb, in the same sentence,
one clause earlier (*"Those, he says, travel with you to any stack"*). The piece therefore puts his
plugin in the same grammatical slot as a claim about any stack, and that adjacency is what lets a Kiro
reader take *travels* as *the whole loop travels* — which the measured record contradicts in its
enforcement half.

**If he wants it closed, it is one clause and it would be a repair rather than authorship**, because the
true statement is in the record: what travels is the knowledge layer, and the enforcement layer does
not. **I did not write it**, because the dispatch reserved the judgement to him and because the clause
changes what the piece claims about its own portability, which is a positioning call.

### What this round did not check — and on this lane NOBODY else does either

Provenance is on this ruler and so is falsity against the source; **external correctness is not.** Since
the copy veto left this lane on 2026-09-03, **four classes reach the owner unread**: cross-surface
staleness, evidence proximity, the machine/ATS read, and durability. Nothing replaced that lens here.

**And nobody re-reads the two repairs above** — they are mine, four words across two editions, and the
authorship bias the pair exists to absorb now sits on them. The owner reading the held preview and the
merge gate reading the diff are what absorb it; neither is an instrument.

**One thing this round could check that earlier ones could not, and it is worth recording:** the Tan
transcript was reachable from this session, so every attribution to him is now verified against a
published page rather than against an ASR transcript nobody retained. **Rounds 1 and 2's standing
carry-forward — *every Tan attribution is reported speech against a transcript nobody kept* — is
DISCHARGED at this head.** That was the piece's largest publication risk for the owner and it is gone.

CONTENT-REVIEW-FINDINGS
