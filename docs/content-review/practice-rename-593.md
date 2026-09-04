# Content review — the practice rename (#593)

Scope: the one passage that was **rewritten** rather than substituted — the naming paragraph in both
editions of `/architecture`. The mechanical substitutions elsewhere in this PR are not this file's
subject, and the pre-existing false inventory claims on `/architecture` (two retired skill names, a
persona count of seven, a deleted hook) are named in #593 and deliberately out of scope here.

## Round 1 — 2026-09-04
draft: `apps/fed/src/content/architecture.en.md` · `apps/fed/src/content/architecture.pt.md`
@ `817e9317d2e75191e36cef05ee659dfe102c1f4e`

### Citable findings

Both were **repaired in place** in this round, in both editions. The paragraph's spine — the AI-DLC
sentence, the "adopting a methodology costs nothing to say" turn, the agent-led-verification close —
is untouched; the repair is confined to the two sentences that glossed the new name.

1. **The paragraph claimed its two halves came from a drawing that is not made of two halves.** —
   clause: *"if you cannot point to where in the source material (an ADR, a `CLAUDE.md` passage, a
   transcript, a prior published piece, an explicit answer he gave) a claim, a number or a stance
   comes from, it does not go in the draft as his."*

   What the draft did: *"it names the two halves the drawing above is made of."* Neither candidate
   referent supports it. The drawing immediately above (`:190`, the enforcement grid) is made of
   **four** lanes — hooks, personas, skills, commands — crossed with three columns of force; the
   drawing far above (`:34`, the venn) is made of **three** circles. The gloss that followed then
   mapped skills to *context* and personas + hooks to *harness*, which leaves the **commands** lane
   with no home and introduces *records* and *gates*, which are lanes of neither drawing.

   What it cost the reader: the paragraph invites a reader to look up and check, and the check fails.
   On the one page whose entire thesis is that its drawings are mechanically pinned to a live tree,
   a structural claim about a drawing that the drawing does not carry is the most expensive kind of
   sentence to get wrong.

   The smallest change that clears it: stop claiming the halves are the drawing's structure. The two
   words are two things to build; the grid is then cited for what it actually says.

2. **The *harness* half put the personas on the deciding side, which the page argues against two
   paragraphs earlier.** — clause: *"A draft shapes, cuts, structures and translates an experience, an
   opinion, or a result the owner already has. It never originates one."*

   What the draft did: *"The **harness** is what decides what it may then do: the personas, the hooks,
   the gates."* The page's own preceding paragraph reads *"the personas **advise** — their judgement
   is checked by nothing"*, and the grid it describes places every persona in `ADVISES` and states
   that *"of everything the plugin exports, exactly one kind — a hook on `PreToolUse` — can refuse."*
   The gloss originated a stance the source contradicts, in the paragraph that comes immediately
   after the source states it.

   What it cost the reader: a reader who has just been given the page's most carefully earned
   distinction — refuses versus advises — is handed a sentence that collapses it, and the honest
   accounting the page spent two screens building reads as decoration.

   The smallest change that clears it: name what the harness half *contains* rather than what it
   *decides*, and point at the grid as the accounting of which of those can actually stop the agent.

**What now stands, EN:**

> **Context & Harness Engineering** is the claim I am making, and the two words are two different
> things to build. The **context** is what an agent reads before it acts: the skills, the records, the
> briefs that tell it what was already decided, so it does not decide it again differently. The
> **harness** is what stands between it and the act: the hooks, the gates, the personas that read what
> it produced — and the grid above is the inventory of which of those can actually stop it.

**PT**, written rather than translated, same two repairs:

> **Context & Harness Engineering** é a afirmação que eu faço, e as duas palavras são duas coisas
> diferentes de construir. O **contexto** é o que um agente lê antes de agir: as skills, os registros,
> os briefs que dizem a ele o que já foi decidido, para que ele não decida de novo e diferente. O
> **harness** é o que fica entre ele e o ato: os hooks, os gates, as personas que leem o que ele
> produziu — e a grade acima é o inventário de quais deles conseguem de fato barrá-lo.

`vocabulary.test.ts` stays green after the repair (30/30): both editions keep the pinned claim clause
(`is the claim I am making` / `é a afirmação que eu faço`) with the current rendering adjacent to it.

### Checked and clear — no finding

- **The argument now argues for the name it carries.** With the repair, the reasoning runs from
  *context* and *harness* as two objects the page has already shown, not from *agent*. No clause of
  the old argument survives with the noun swapped.
- **The bracketed form is gone from published prose.** The `(Agent)` affordance, the sentence that
  justified it (*"`Agent` is in brackets on purpose…"*) and the `accDescr` clause describing the
  parentheses in words are all removed in both editions. Grep over `src/content/`, `src/data/` and
  the generator scripts finds no surviving prose explaining a convention a reader cannot see; the
  remaining occurrences are comments in `vocabulary.test.ts`, which is a test file and not a surface.

### Advisory and droppable

- The AI-DLC relation is rendered as *"it runs inside this rather than beside it"*, against his
  *«filho»* / *«subproduto»*. It is a fair rendering and it earns the *"not beside"* by pointing at
  the ampersand that just left the headline. His *«o termo tem a ver mais com sales»* is not carried
  — reading it as a choice, not a gap; a public page is not where he needs to explain which of his
  own terms is sales-facing.
- *"the drawing above"* was ambiguous between the venn at `:34` and the grid at `:190` before the
  repair removed it. If a later edit reintroduces a reference to a drawing from this paragraph, name
  which one — the page carries two and they make different claims.
- EN *"the personas that read what it produced"* and PT *"as personas que leem o que ele produziu"*
  are deliberately narrower than "review": the page has just said their judgement is checked by
  nothing, and *review* would quietly promise more than that.

CONTENT-REVIEW-FINDINGS
