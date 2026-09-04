# Content review — the social pair for "I ran three agent loops for a month"

Reviewed against `published-voice`, the same skill the draft was written against. This file is the
record of the rounds; the repairs are in the draft itself.

## Round 1 — 2026-09-03

draft: `docs/social/three-agent-loops-one-month.md` @ **uncommitted at review time** — the file is
untracked on `content/release-three-agent-loops-577`, branch head `93dc1a983c9c1706b09a85061d2defab4d7c04ce`.
Content read: sha256 `0db6b90dbadd47b09fb65968ec313035306ca4a1910ca0e92e637fa836ce671a`.
Recorded this way deliberately: a review must fail loudly against a draft that has since moved, and an
untracked file cannot carry a commit SHA to fail against — the hash is what a later reader can check.

Also read: `apps/fed/src/content/blog/three-agent-loops-one-month.{en,pt}.md` at that head, and the
nine rounds of the owner's own words on Issue #577.

### Citable findings

1. **The CTA hands the reader the turn one sentence after refusing it — repaired in place, both halves.**
   clause: *"**Never state the turn** — «não eh legal no teaser chegar e falar que o desafio acabou ou
   ficou moroso»."* and, in the same rule: *"**Softer restatements fail the same way**, so this is not a
   dose rule. **The turn is what the click buys.**"*

   *What the draft did.* The withhold was built correctly — *"Tem uma outra coisa que agosto me custou,
   e eu levei quase o mês inteiro para enxergar o que era"* names the hole and refuses its content,
   which is rule 4's *withheld ≠ omitted* done properly. The very next sentence then said: *"Conte
   quantas delas acharam a mesma coisa duas vezes."* / *"Count how many of them found the same thing
   twice."*

   *What it cost the reader.* The article's turn, in its own excerpt, is *"what August actually cost was
   deciding the same thing over and over without noticing."* Read in sequence — *something else cost me
   this month* immediately followed by *count how many of your rounds found the same thing twice* — the
   reader reconstructs that answer without clicking. It is not a softened restatement; it is the same
   content transposed into the second person, which the clause covers explicitly. In the article the
   sentence works, because the turn has already been earned by two thousand words; the teaser is judged
   as a separate artifact, not as a compression of the article, and in three lines it is the answer.

   *Repair applied — the smallest change that clears it.* The second sentence is cut from both halves;
   the first is kept verbatim. The CTA remains his own closing instruction from the article
   (*"Vá olhar o que os seus loops fizeram no mês passado — não a saída, as rodadas."* / *"Go and look
   at what your loops actually did last month — not the output, the rounds."*), it still points at
   where the withheld thing lives, and it does not say what is there. Nothing else in either half was
   touched.

### What was checked and is clear — stated so a clear check is not confused with an unrun one

- **The hole is still a hole.** After the repair, no sentence in either half, and none in the X post,
  lets a reader name what August cost beyond the money. The X close (*"The money wasn't the expensive
  part."*) is the same withhold shape and stays.
- **Confidentiality.** The client loop is absent from both posts; nothing names or implies a client, a
  domain or a stack, including by inference — the internal platform is absent too, so the only
  employer reference is `AWS` / `Agentic August`, which the article already carries and which is public
  on his profile.
- **The numbers.** `USD 4.207,13` / `USD 4,207.13`, correct decimal convention per edition, covering
  **two** of the three loops in both halves and in the X post. *"Eu gastei. Foi decisão minha."* /
  *"I spent it. It was my decision."* is carried in all three, adjacent to the figure, and nothing
  anywhere implies the employer funded it — which is the owner's own correction on #577
  (*«nao interessa se meu empregador financiou. eu gastei, foi minha decisao.»*) surviving the
  compression intact.
- **Register.** No name for the habit, no coined term, no numbered framework, no templated sign-off.
  The industry line uses *conversa* / *conversation* and is bound to him in the next clause
  (*"Eu inclusive."* / *"Me included."*), per the teaser's rule 5.
- **The "it worked" beat** is present in both halves and in the X post (*"e os três rodaram"* /
  *"all three ran"* / *"All three ran."*).
- **Provenance.** Every claim in both halves traces to the article or to #577: the three parallel
  loops, the full project calendar, the programme's goals and hackathon rules, the three-week
  escalation, the bill and its scope, the cave, the good-work question, and the CTA. Nothing is
  asserted that the source does not carry.
- **Bilingual parity.** The English half makes no claim the Portuguese does not, and none is missing in
  the other direction; the paragraph-for-paragraph claim set is identical.

### Advisory and droppable

- The «Agentic August» sentence keeps the programme's *goals and rules* and drops its stated purpose
  (the article: *"promoting the use of AI and experimentation with it"*). Four words would restore it
  and remove a faintly available reading in which the compression is a verdict on the programme he
  opted out of.
- `*rounds*` carries Markdown emphasis that LinkedIn and X render as literal asterisks; the Portuguese
  half does not mark *rodadas* at all, so the asymmetry only exists on the surface that cannot show it.
- The X post carries no industry line at all, where the LinkedIn half does — the teaser's rule 1 asks
  for the arc *with the industry's moment beside it*. Left advisory rather than raised: at 280
  characters with no tags, the arc and the number are already the whole post, and the rule's elicited
  object was the longer narrative.
- Worth one human look before posting: that `https://tadeumendonca.io/en/blog/three-agent-loops-one-month`
  resolves. A social post is a permanent surface and a dead link on it is not editable later.

CONTENT-REVIEW-FINDINGS
