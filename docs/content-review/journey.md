# Content review — the journey frame captions (`apps/fed/src/data/journey.ts`)

Rounds against [`published-voice`](https://github.com/tedeuxx/tadeumendonca-skills), the same skill
`content-writer` drafted against. A round is blocking only where a clause of that skill can be quoted
verbatim; everything else is advisory and droppable without argument.

## Round 1 — 2026-08-27

draft: `apps/fed/src/data/journey.ts` @ `645ad56`
issues: #545 (corridor) · #546 (sticker lid)
scope: the two captions changed on this branch, in both editions.

### Citable findings

None. No clause of `published-voice` is violated by either caption in either edition, and this round
does not manufacture one to justify itself.

### What was checked and cleared

Recorded so that a clear round is a record of what was read rather than an assertion that someone
judged. Each item is the finding this round expected to raise and the reason it did not survive.

1. **The corridor's second sentence — `Aqui o teto estava aberto` / `Here the ceiling was open` —
   was checked against the sourcing constraint and it holds.** The *Practical test* is *"if you
   cannot point to where in the source material (an ADR, a `CLAUDE.md` passage, a transcript, a
   prior published piece, an explicit answer he gave) a claim, a number or a stance comes from, it
   does not go in the draft as his."* The figurative payload is pointable, twice over, and **a prior
   published piece is named source material by that clause**:

   - the figure itself is his, published five days ago —
     `content/blog/the-problem-stopped-changing.pt.md:72`, *"o que eu tenho, enquanto isso, é **um
     teto que eu consigo descrever com precisão**"*, and the EN edition at the same line, *"a
     **ceiling I can describe precisely**"*;
   - the state it asserts for 2021 is that article's own account of 2021 — *"Funcionou … Tudo ali
     era verdade, e continuou sendo verdade por anos. **O que mudou veio depois.**"* The article
     places the closing **after** the arrival, so a caption saying the ceiling was open at the
     arrival is reading his published arc, not inventing one.

   **This was the finding this round most expected to raise, and the second bullet is what killed
   it.** The structural half of that article — cloud-enablement engagements repeat because of where
   the client is — can be read as *the ceiling was always there and he only saw it later*, which
   would make `estava aberto` a state he never occupied. The article refuses that reading in its own
   words (*"o que mudou veio depois"*), so the caption is inside the source rather than ahead of it.

2. **The corridor's first clause, and the drafter's decision to use the second of his two sentences
   and not the first.** He gave two reasons for the move — «trabalhar na amazon, era um sonho, pela
   cultura e a marca» and «alem de ser uma tecnologia que eu admirava e queria usar todos os dias» —
   and the draft carries only the second. **Judged, and it is the right cut, on the ruler rather than
   on preference.** The journey rule says *"Cut the good parts he supplied too"* and *"a detail earns
   its place by what it moves, never by what it proves"*; culture and brand are about the employer
   and move nothing in his arc. The kept clause is additionally the one his own published article
   already leads with: *"What I wanted to be doing every day was AWS cloud and Terraform"*
   (`the-problem-stopped-changing.en.md:22`). The cut clause would also have been the passage that
   *"only earns its place because it positions him"* — the ruler's own test for what does not earn
   its place.

3. **The ironic reading — *the dream turned out to be ducts* — was tested and does not land.** Two
   things close it off: `aberto` / `open` is positively valenced in both editions, and the first
   sentence is closed with a full stop before the frame's pipework is ever invoked, so the second
   sentence reads as a turn *upward*, not as a deflation. **A deflationary caption about his own
   employer on a hiring surface would be worse than a weak one, so this was checked rather than
   assumed**; it is clear, but see advisory 1 for what remains.

4. **The previously blocked shape does not recur.** `Entrei para escrever infraestrutura` was blocked
   as a claim about his intent on entering that nothing supported. Neither new caption asserts an
   intent, a role or a scope of work: the corridor asserts an attraction (his words) and a state (his
   article), the sticker lid asserts a preference (his direction, «meus stacks favoritos na epoca»).
   **No sentence in this diff makes a claim about what he was hired to do.**

5. **Both editions assert the same thing, checked independently rather than one derived from the
   other.** `admirava/queria` (imperfect) against `admired/wanted` carries the same ongoing past
   state; `estava aberto` against `was open` the same; `na época` against `at the time` anchors the
   preference claim in time in both, which is what keeps the sticker-lid caption from ageing.

6. **`favourite` is house convention, not a slip.** The EN surface is consistently British
   (`colour`, `behaviour`, `recognise`, including in the published EN article), so the spelling was
   checked and needs no change.

7. **Both survive being uppercased in position.** No acronym, no proper noun and no tonal-only effect
   in either caption; the corridor's structure is two clauses and a stop, which is exactly what
   uppercasing leaves intact.

8. **The sticker lid, including its cleared decision not to name a subset of the thirteen stickers.**
   Re-read for a citable finding as an explicitly permitted second look at a prior clearance, and
   **there is none** — so this round does not go against that clearance. The caption is his direction
   near-verbatim, and it does quiet journey work rather than merely describing: the lid carries AWS
   and Terraform at Globo, which is the reason for the move the next frame is about.

### Advisory and droppable

- The corridor's figurative reading is a bonus for a reader who has met the article, not a load the
  caption carries alone; a first-time visitor gets the literal reading and two sentences sharing a
  full stop. Harmless as it stands — noted because it is the thing that would show if the caption
  ever had to work without the article behind it.
- The corridor is now the only one of the four captions carrying a figure; the other three name what
  the frame shows. That asymmetry is only visible if the four are read as a set, which the file's own
  comment says they no longer are.
- The corridor `alt` already says the ceiling is opened up; the caption says it again in different
  words. A sighted reader gains the turn, a screen-reader user hears the fact twice.

CONTENT-REVIEW-CLEAR
