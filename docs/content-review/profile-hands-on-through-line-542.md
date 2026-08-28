# Content review — `profile-hands-on-through-line-542`

Rounds against [`published-voice`](https://github.com/tedeuxx/tadeumendonca-skills), the same skill the
draft was written against. A finding is blocking only where a clause of that skill is quoted verbatim
beside it; everything else is advisory and droppable without argument.

## Round 1 — 2026-08-27

draft: `apps/fed/src/data/profile.ts` @ `5dac200`

Scope read: the `summary` (both editions), the `2023-04` entry's `description` and all six `highlights`
in both editions, the `2021-01` practice line, and the Accenture `description` and closing bullet in
both editions — the eight asks of #536–#542 and #544. The `print_highlight_index` comment was read for
context; it is a record decision and carries no copy.

**Provenance was checked first and is clean.** Every claim added by this diff points at source material:
the owner's verbatim asks in the eight Issues, the LinkedIn About published 2026-08-27 (`Node.js and
TypeScript`), the entry's own bullets (`Tizen, webOS, Apple TV` → `smart TVs`; `BFF + microservices`),
the role title (`Senior Delivery Consultant — App Modernization`), and the record's account of the
streaming engagement (`internalization`). One exception, finding 3 below.

`product-lead`'s twelve advisories and its ruling on `ágil` and on `Arquitetei` are not re-derived here.

### Citable findings

1. **The one clause in the current role whose job is to prove he builds states no size for either
   artifact.** — clause: "**Describe what exists at the size it exists — neither inflated nor shrunk.**
   He calls his own harness *"jornada de aprendizado de IA"*, which undersells a running system with
   gates, hooks, personas and an ADR library; copying that phrasing is not humility, it is a wrong
   measurement."

   The draft (`en`): *"And building hands-on: an internal knowledge platform still in progress, and
   public work at tadeumendonca.io with its agent harness and plugin."* (`pt`: *"e o trabalho público em
   tadeumendonca.io, com seu agent harness e plugin"*.) The sentence exists because #542 found the entry
   read as «somente papel», and it is the entry's whole answer. It names two objects and sizes neither:
   the first is qualified as unfinished (*"still in progress"* / *"ainda em andamento"*), and the second
   is *"public work"* — a noun that says nothing — with the harness and the plugin demoted to a
   possessive accessory of a website (*"with its"* / *"com seu"*).

   What it costs the reader: at the exact line where a recruiter is looking for evidence that he builds,
   the entry offers one thing not finished and one thing not measured. That is the clause's named failure
   — the harness described smaller than it is — reached by omission rather than by a diminutive.

   Smallest change that clears it: give each object one sized fact the record already carries — the
   knowledge platform's MVP scope (bidirectional MCP server, semantic search on Bedrock + S3 Vectors) is
   already in bullet 5, so the practice line can carry the *live* one instead: a running public platform
   whose delivery goes through an enforced agent harness, and a plugin published and consumed by it.
   No new claim is needed; the sizes are in the file.

2. **The slice reintroduces, in four places, the exact redundancy #536 was opened to remove.** — clause:
   "**Cut the good parts he supplied too:** past a point more true material makes a passage worse, so
   **shaping includes DECLINING what he offers** — an interview-sourced draft fails by accumulation, not
   invention."

   Eight verbatim asks were accepted and every one of them added; nothing was declined. The result is
   word-level repetition inside single sentences, which is the same defect the owner himself named on
   the summary's opening («esta redundante Ai e desenvolvimento ai-native»):

   - `en` summary — *"moved into modern product engineering **building** web and native-mobile apps, and
     spent the last years **building** modern applications on AWS"*, twelve words apart.
   - `pt` summary — *"construindo apps web e mobile nativo, e nos últimos anos venho **construindo**
     aplicações modernas na AWS"*, same sentence.
   - `en` bullet 6 — *"developing **architectures**, applications and delivery **strategy** — and
     presenting **architecture** and **strategy** to C-level…"*: two nouns, each twice, inside 25 words.
   - `pt` bullet 6 — *"desenvolvendo **arquiteturas**, aplicações e **estratégia** de entrega — e
     apresentando **arquitetura** e **estratégia** para stakeholders…"*, identically.

   What it costs the reader: bullet 6 now carries #544's building verb *and* the original presenting
   verb with both of its complements intact, so the sentence reads as one fact said twice rather than as
   two facts. #544 predicted the split; the draft kept both halves and joined them with a dash instead.

   Smallest change that clears it: on bullet 6, let each verb keep only what belongs to it — the
   building clause takes the objects, the presenting clause takes the audience and the three languages —
   which is a split, not a rewrite. On the summaries, one of the two `building`/`construindo` gives way
   to the verb the earlier period actually names (`shipped`/`entreguei`, or the original `moved into
   modern product engineering` without a gerund).

3. **The `en` edition says the building is finished; no source says that, and the `pt` says the
   opposite.** — clause: "**Practical test for "is this his, or am I inventing it":** if you cannot point
   to where in the source material (an ADR, a `CLAUDE.md` passage, a transcript, a prior published piece,
   an explicit answer he gave) a claim, a number or a stance comes from, it does not go in the draft as
   his."

   `en`: *"**spent** the last years building modern applications on AWS"* — a closed span. `pt`: *"nos
   últimos anos **venho construindo** aplicações modernas na AWS"* — ongoing. The `pt` verb was changed
   in this diff (`atuei` → `venho construindo`); the `en` verb was not (`spent` survived the rewrite
   around it).

   The stance the `en` now carries — that the modern-application building belongs to a period that
   ended — has no source. Every source says the reverse: #537's direction is *"the through-line I carry
   today"*, #542 exists because the current role does not read as building, and #540 records that past
   tense on a standing capability *"reads as **he used to do this***". The draft states in his name, on
   the surface a recruiter's parser reads, something no source supports — which is the practical test,
   not a parity preference.

   Smallest change that clears it: carry `venho construindo`'s aspect into `en` — *"and have spent the
   last years building"*, or *"and the last years have been modern applications on AWS"*. The `en`
   through-line clauses in the Accenture entry already say *"the through-line I carry today"*, so this is
   the summary catching up to the edition's own other strings.

### Advisory and droppable

- `en` bullet 6 introduces an explicit `I lead` into a six-item list where the other five elide the subject; `Lead engagements across LATAM` carries the present tense without the pronoun, and `pt` needs nothing because `Conduzo` conjugates it.
- `substituição` (pt `description`) now sits ten lines above `internalização` (pt bullet 2) for the same engagement — and `replacement`/`internalization` likewise in `en`; #541 replaced the noun in one field only.
- Two consecutive colon-list sentences in the `description` — *"The launches: …"* then *"And building hands-on: …"* — and the second opens with a conjunction after a full stop, so the parallel is announced and then broken.
- pt bullet 2's agreement change (`desenhada` → `desenhados`) moves *designed for future B2B enablement* from the platform onto the microservices; `en` leaves it attached to the backend. The editions now modify different objects.
- The `en` summary's opening runs *"AI Engineering applied to agile software development — … — **to** design, build and ship"*: two `to`s of different function inside eight words, and the subject of the sentence is now a discipline rather than him, so he first appears in the sentence after. `pt`'s `para` does not have this problem.

CONTENT-REVIEW-FINDINGS

## Round 2 — 2026-08-27

draft: `apps/fed/src/data/profile.ts` @ `8481e62`

**This is the last round.** The bound is two and this section is the second; the pair is terminal on it
whatever it says. Scope read: the diff `5dac200..8481e62` against round 1's three findings, and the
replacement hands-on sentence read fresh in both editions as a sentence on a hiring surface — the three
claims it introduced (the live platform, the harness's components, the plugin published and consumed)
were never in front of round 1.

### Round 1's three findings are answered

- **Finding 1 discharged.** Both objects are now sized: *"tadeumendonca.io, the live platform this CV is
  served from, and the agent harness that delivers it — personas, hooks and permission gates, published
  as a Claude Code plugin and consumed by the repository itself."* The possessive that made the harness
  an accessory is gone, `"public work"` is gone, and the self-reference — the artifact the reader is
  holding, named as evidence — is the strongest move in the entry: it is the text being an instance of
  the thing rather than describing it. **Dropping the knowledge platform from the practice line is the
  right half of the trade**, and it is what finding 1 asked for: bullet 5 already sizes it, and the
  practice line now carries the one that is live.
- **Finding 2 discharged.** `shipping`/`entregando` for the earlier period leaves `building`/`construindo`
  once per summary; the LATAM bullet pronominalises (`presenting **them**` / `e **as** apresento`) so
  neither `architecture`/`arquitetura` nor `strategy`/`estratégia` occurs twice.
- **Finding 3 discharged.** `spent` → `have spent` carries `venho construindo`'s aspect, and the editions
  now agree that the building has not closed.
- The two advisories taken (`I lead` → `Lead`, `desenhados` → `desenhado`) both hold. `Lead engagements
  across LATAM` reads present without the pronoun and without breaking the list's elided subject.

### Citable findings

**None.** No clause of `published-voice` is violated by the three new claims or by anything else in
`5dac200..8481e62`.

Stated plainly rather than filled: the new sentence is denser than what it replaced, and every one of
its added words was added in answer to round 1. Density is not a rule in the ruler — there is no clause
about subordination depth or sentence length to quote — and the nearest thing to one, the corpus's
plain-language habit, is admissible for **mechanics only** under *Precedence* and is overridden by the
interview's *"precise description is 'I built this, it runs like this, here is what broke'"*, which is
what this sentence now does. Blocking a fix this round asked for, on a rule this round cannot cite,
is the failure mode the second round exists inside a bound to prevent.

**What this round did NOT check, said so it is not read as coverage:** whether the three new claims are
true, and whether the practice line still fits the printed budget now that ADR-0034's ceiling has moved.
Neither is mine.

### Advisory and droppable

- `en` has nothing pinning *"published as a Claude Code plugin and consumed by the repository itself"* to its host — grammatically it can attach to the harness, to the permission gates, or to `tadeumendonca.io`. `pt` pins it with agreement (`publicado`, `consumido`, masculine singular → `o agent harness`), so the ambiguity exists in one edition only.
- *"the repository itself"* / *"o próprio repositório"* is the sentence's only unnamed referent — a reader of `/cv.pdf` has met a platform and a harness by this point, never a repository, and the self-consumption is the most interesting fact in the clause.
- **The colon parallel, ruled on since it was asked.** The device is not two sentences but **three** — *"Leading the implementation:"*, *"The launches:"*, *"And building hands-on:"* — which correct's round 1's own advisory, where I counted two. A shape used three times in one paragraph is the paragraph's default sentence, so it cannot mark a contrast between the last two; and the one thing that differentiates the third is a leading conjunction, which reads as an append rather than as a turn. **I disagree with the reason the advisory was declined, and the advisory stays droppable anyway** — there is no clause to quote for it, and it was droppable in round 1 for the same reason.

CONTENT-REVIEW-CLEAR
