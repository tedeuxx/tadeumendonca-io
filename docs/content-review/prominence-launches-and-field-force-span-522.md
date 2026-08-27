# Content review — `prominence-launches-and-field-force-span-522`

Rounds against [`published-voice`](https://github.com/tedeuxx/tadeumendonca-skills), the same skill the
draft was written against. A finding is blocking only where a clause of that skill is quoted verbatim
beside it; everything else is advisory and droppable without argument.

**On the slug, because it is not the draft's file stem and the deviation is deliberate.** The brief's rule
is *the draft's own file stem*, which here is `profile` — a file every `content` slice on this Issue edits,
so a per-stem review file would be shared by unrelated slices and its two-round bound would be permanently
spent by the first one. `docs/content-review/highlights-522.md` is a **different, already-terminal pair**
(rounds 1 and 2, 2026-08-26, drafts `fe77bd5` and `df596fb`) covering the earlier `highlights` slice on the
same Issue; appending here would have read as round 3 of a pair that is spent. The slug is the branch's own
stem instead, matching that precedent. **Routed to `agents-lead` as a defect in the brief, not decided
here:** the slug rule assumes one draft per file, which is false for a data file.

## Round 1 — 2026-08-27

draft: `apps/fed/src/data/profile.ts` @ `7fe24ef97d6f32fe877b3e18f0e19496141b662d`

Scope read: the `2023-04` practice line and its reordered `highlights` (en and pt), the two new Accenture
`2015-01` bullets (en and pt), and the byte-pin comment in `apps/fed/src/data/vocabulary.test.ts` for what
it says about the copy. pt was read on its own terms, not against en.

### Citable findings

1. **"native across six platforms" is a number and an adjective that cannot be pointed at a source — and
   the bullet six lines below it says the opposite** — clause: *"if you cannot point to where in the source
   material (an ADR, a `CLAUDE.md` passage, a transcript, a prior published piece, an explicit answer he
   gave) a claim, a number or a stance comes from, it does not go in the draft as his."*

   The practice line reads *"a custom cloud-native replacement for a SaaS streaming platform, **native
   across six platforms**"* / *"nativa em seis plataformas"*. What the source material carries:

   - Issue #522, the prominence comment: *"the custom cloud-native streaming replacement **across six
     platforms**"* — six, with no *native*.
   - Issue #522, the chronological interview: *"following the build of **six apps** (React web,
     TypeScript/Node.js backend, native iOS and Android)"* — the six explicitly **includes a React web
     app**.
   - This entry's own `highlights` bullet, **unchanged by this diff**: *"native apps across **five**
     platforms (iOS, Android, Tizen, webOS, Apple TV) **plus Web**"*.

   Six is sourced. *Native across* six is not: every source that enumerates the six puts a web app inside
   it. The compression moved the adjective across the boundary the sources draw.

   What it costs the reader: this is the **byte-pinned practice line** — the first sentence under the
   current title on `/me` and `/cv.pdf`, the line the whole Issue exists to make scannable, and the one a
   recruiter reads before anything else. A reader who scans it and then reads six lines down finds the
   entry contradicting itself on the one countable fact in it. On a surface whose thesis is that its claims
   survive checking, the self-contradiction costs more than the fact.

   Smallest change that clears it: *"native across five platforms plus Web"* — or drop the count and say
   *"native and web"*. Same fix in pt (*"nativa em cinco plataformas mais Web"*), and the `PRACTICE_LINES_EN`
   literal and `.brand/surfaces.md` move with it.

2. **The chain is printed as a chain — the field-force programme now takes two thirds of a four-engagement
   entry** — clause: *"past a point more true material makes a passage worse, so shaping includes DECLINING
   what he offers — an interview-sourced draft fails by accumulation, not invention."*

   Per-bullet word counts of the `2015-01` entry's `en` highlights at the read SHA:

   ```
   git -C <repo> show 7fe24ef:apps/fed/src/data/profile.ts | python3 -c "import sys,re; s=sys.stdin.read(); b=s[s.index(\"start_date: '2015-01'\"):]; b=b[b.index('en: ['):b.index('pt: [')]; print([len(re.sub(r\"[\\\"']\s*\+?|\s+\",' ',x).split()) for x in re.split(r\",\n {10}(?=[\\\"'])\", b)])"
   → [18, 85, 84, 103, 52, 37, 26]
   ```

   (±2 per bullet: the command counts the source literal's own concatenation punctuation.) Bullets 2, 3
   and 4 are the telecom field-force programme: **272 of 405 words, 67% of the entry, for one of the four
   custom-build engagements the `description` counts.** Bullet 4 at 103 words is the longest in the file,
   and it is a single run of seven chain links — ideation, architecture, API and data model, infrastructure,
   offline-first, event auditing, analytics — which is the shape the Issue's own drafting note asked not to
   print (*"that is a diagram, not a bullet"*).

   The clause is not about length, and this finding is not either: every fact in both bullets is true and
   sourced. It is about what accumulation does to the ones that matter. The engagement's best sentence —
   *MongoDB on the server, SQLite on the device*, six words a reader can picture — arrives 60 words into
   bullet 3 and is then followed by 103 more words that add no comparable object.

   The accumulation also scrambles the chronology, which is the visible symptom rather than a second
   finding: bullet 3 ends on the salesperson app proving the model, bullet 4 opens *"The same delivery
   **then** ran … the field technician's **first**, then the field salesperson's"*. The reader is moved
   forward and then told the first of the two came first.

   Smallest change that clears it: keep bullet 3 and cut bullet 4 to the two things it alone carries — that
   the span ran on **both** native Android apps, technician then salesperson, and that it reached from UX
   ideation to stakeholder analytics. The infrastructure, the offline-first mechanics and the event
   auditing are already in bullet 2 (*"offline-first throughout"*) and bullet 3.

3. **"Running the span twice is what makes it a practice rather than a one-off." earns its place only by
   positioning** — clause: *"If a passage only earns its place because it positions him, it does not earn
   its place."*

   The sentence carries no fact. Both halves are in the same bullet's first clause — *"ran end to end on
   both native Android apps — the field technician's first, then the field salesperson's"* — so the reader
   has already been told it happened twice, in order. The sentence's only job is to tell the reader what to
   conclude about him from the fact he just read. It scores the preceding sentence rather than describing
   anything.

   It is the Issue's own framing (*"delivered twice … it reads as a practice"*), which is correct **as a
   reason to publish the fact** and is not a sentence to publish. pt has the identical shape (*"Rodar isso
   duas vezes é o que faz disso uma prática, e não um caso isolado."*).

   Smallest change that clears it: delete it in both editions. The twice-ness is already on the page and
   the reader does the arithmetic unaided.

4. **Both new bullets have no actor, and this is the second slice running in which that defect landed in
   this entry** — clause: *"Describe what exists at the size it exists — neither inflated nor shrunk."*

   Bullet 3: *"was solved"*, *"were tried"*, *"neither held"*, *"were shaped"*, *"was proven"*. Bullet 4:
   *"The same delivery then ran"*. Across 187 words on the engagement the Issue calls the strongest evidence
   available for the recruiter's stated gap, **he does not appear once** — no verb takes him as subject and
   no role noun names him. pt is identical (*"foi resolvido"*, *"foram tentadas"*, *"foram desenhados"*,
   *"se provou"*, *"correu"*).

   The source is first person and it is where the authorship lives: *"isso que me levou a um desenho de api
   modelagem de dados que nao precisasse de componente adicional"*. The draft renders the decision he made
   as a thing that happened to a programme. Every neighbouring bullet in this entry does the opposite —
   *Architected the integration layers…*, *Responsible application architect on…*, *because **we** traded
   what worked*, *Architected and shipped…*, *Left packaged software behind…*, *Grew into…*.

   Reinforcing the clause rather than replacing it: *"Self-deprecation is not his signature and must not be
   written as one — a draft that has him minimising his own work or hedging something he earned reproduces
   the thing he is working against."* An agentless passive over his own engineering decision describes his
   contribution at zero, which is a size, and it is the wrong one.

   **This is a recurrence, not a first sighting.** `docs/content-review/highlights-522.md`, round 2,
   finding 2 raised the same defect in the same entry against the same clause, and it was fixed there by
   restoring a verb. The two new bullets reintroduced it.

   Smallest change that clears it: give bullet 3 a subject — *"We solved the offline-first problem in the
   design rather than by adding infrastructure"* or *"Designed the API contract and the non-relational data
   model so that synchronising needed no additional backend component"* — and open bullet 4 on a verb. The
   plural is available and is his own register in this entry (*"trocamos sinergias"* / *"we traded what
   worked"*); it does not overclaim a solo authorship the source does not assert.

### Advisory and droppable

- *"The launches:"* introduces two items and the second is *"an oil & gas operator's landing zone with the
  upstream operational-monitoring platform on it"*. The launch is the platform; the landing zone is what it
  sits on. Leading on the landing zone puts the infrastructure noun in the slot the sentence promised to a
  launch.
- pt, `2023-04` practice line: *"com a plataforma upstream de acompanhamento operacional sobre ela"* —
  *sobre ela* reads locative-stacked rather than as *built on it*.
- pt, bullet 3: *"não somando infraestrutura"* — the gerund is thinner than the en *"rather than by adding
  infrastructure"*; *"em vez de somar infraestrutura"* carries the contrast.
- pt, bullet 3: *"nenhuma se sustentou para essa carga"* — *carga* alone is thin for *workload*.
- pt, bullet 4: *"A mesma entrega então correu de ponta a ponta"* — *correu* reads as a calque; and
  *"alimentava a analytics de stakeholders"* mixes an English mass noun into a Portuguese article.
- *"That pairing was the big win of the engagement"* is his phrase (*"o grande acerto"*) and is sourced, so
  it is not a finding — but in en it reads as him scoring his own work, which the pt original does not do to
  the same degree.

### Checked, no finding

- **The hybrid app keeps a bare mention and gains no verdict.** It is named twice — once in the bare
  three-apps list, once as the app the two sync stacks were tried on — and both are approach-level.
  *"Two off-the-shelf sync stacks were tried … and neither held for this workload"* is a statement about the
  stacks, scoped by *for this workload*, with nothing said about the delivery, the team or the vendor. The
  count of three apps and the per-app front-technology argument both survive intact.
- **The two scales sit where the owner put them.** The span is claimed across both native Android apps;
  the MongoDB + SQLite model is named on the salesperson app as where it was proven. Neither is collapsed
  into the other.
- **No client or employer is named**, in either edition, in any new line. RabbitMQ, CouchDB, MongoDB and
  SQLite are stack.
- **The two open owner items were not touched and are not raised.** `"launch"` in the pt practice lines and
  *"levantei a plataforma"* in `2021-01` are pending with him; nothing above asks for either.

### Flags to route — not craft findings, and not mine to judge

- **The `2023-04` practice line dropped the work-built-in-the-open clause.** The old line ended *"and
  building hands-on: … public work at tadeumendonca.io with its agent harness and plugin"*; the new one ends
  at the two launches. Issue #522 records that clause under *A closed decision, recorded with its reasoning*
  — *"that clause **stays**. Decided by the orchestrator on the owner's 'siga', and reversible on one word
  from him."* Whether the Issue's requirement is met is `quality-assurance`'s lens and the decision is the
  owner's; `published-voice` carries no clause on it and this reviewer takes no position on whether the
  removal is right.
- **Nothing above is a truth finding.** Finding 1 is a sourcing finding — whether the platform is native on
  six platforms is `product-lead`'s blocking veto at the merge gate, and this reviewer has no instrument to
  check it against the world.
- **Cross-surface state.** The test comment now records, deliberately, that LinkedIn is behind on the
  `2023-04` line. Cross-surface coherence has no clause in this ruler; routing to `product-lead`.

CONTENT-REVIEW-FINDINGS

## Round 2 — 2026-08-27

draft: `apps/fed/src/data/profile.ts` @ `efd6321`

**Terminal round.** Two `## Round` sections now exist; the pair is spent and the draft goes to the owner
in whatever state this leaves it. Nothing below holds anything.

**Round 1's findings 2, 3 and 4 are resolved. Finding 1 is CARRIED, unresolved, by instruction** — it
sits in the `2023-04` practice line whose fate the owner is deciding, and he may revert that line
entirely, so it was deliberately not worked. **`"native across six platforms"` still contradicts this
entry's own unchanged bullet (`native apps across five platforms … plus Web`), and the two advisories in
that same line are carried with it, undecided rather than dropped.** It is not re-raised below and it is
not re-argued; read the literal at the foot of this section as *this round produced nothing new*, never
as *nothing is outstanding*.

### Citable findings

**None.** Nothing in the rewritten text can be held against a quoted clause of `published-voice`, and no
finding is manufactured to justify the round. What was checked, and what the checks cost me, is below.

### Checked, no finding

- **Finding 2 — re-measured with round 1's own command at the new head, and the three reported figures
  hold.**

  ```
  git -C <repo> show efd6321:apps/fed/src/data/profile.ts | python3 -c "import sys,re; s=sys.stdin.read(); b=s[s.index(\"start_date: '2015-01'\"):]; b=b[b.index('en: ['):b.index('pt: [')]; print([len(re.sub(r\"[\\\"']\s*\+?|\s+\",' ',x).split()) for x in re.split(r\",\n {10}(?=[\\\"'])\", b)])"
  → [18, 85, 60, 47, 52, 37, 26]
  ```

  Field-force bullets 2, 3 and 4: **192 of 325 words, 59%**, down from 272 of 405 and 67%. The longest new
  bullet is 60 words; the longest in the entry is now the **85-word three-apps bullet the slice never
  touched**, which is the right shape — the established fact outweighs the new one. The seven-link chain
  is gone; what replaced it is a three-beat *from / through / to*, which is a reach, not a diagram.

- **The event trail was kept against my smallest change, and the call is right. I was wrong.** Round 1
  said the event auditing was *"already in bullet 2 (`offline-first throughout`) and bullet 3"*. It was
  not: `offline-first throughout` is a different fact, and bullet 3 never carried auditing. Checked
  rather than conceded —

  ```
  git -C <repo> show efd6321:apps/fed/src/data/profile.ts | grep -n -i "audit\|event trail\|trilha de eventos\|operable\|operáve"
  → 279 (en), 309 (pt) — and nothing else in the file
  ```

  The eight words are the **only** place any surface carries the operate-the-app fact. They also discharge
  the Issue's own note on this entry — *"this line should say what was instrumented and why (operating the
  app), not reuse the label"* — by saying `the event trail that made them operable in the field` and
  never saying *observability*, which the 2020–2021 entry owns (`:210–229`). Declining a reviewer's
  smallest change and arguing why is the pair working, not the pair failing.

- **Finding 3 is cut in both editions**, and nothing was left dangling by the cut.

- **Finding 4 — the register is his, and it is the same shape the earlier pair landed, not a second shape
  wearing its clothes.** Verb-first past tense: `Designed…`, `Ran…` / `Desenhei…`, `Fiz…`, matching this
  entry's own `Architected the integration layers…`, `Architected and shipped…`, `Left packaged software
  behind…`, `Grew into…` and pt's `Arquitetei`, `Construí`, `Deixei`, `Amadureci`. **The first-person
  plural is sourced twice over** — this entry already publishes *"because **we** traded what worked"* /
  *"porque **trocamos** sinergias"*, itself transcribed from his *"trocamos sinergias"*. It is also used
  correctly: the singular carries the design he is on record as owning (*"isso que **me** levou a um
  desenho de api"*), the plural carries only the framing move around it. That is a finer split than round
  1 suggested and a better one.

- **`had been tried` stays passive, and that is the correct call rather than a residue of finding 4.** The
  source names no actor for the two sync stacks. Supplying one would be an unsourced claim; the past
  perfect establishes the causal order without a chronology sentence, which is what round 1's chronology
  symptom needed.

- **The chronology symptom is fixed by moving a fact, not a word.** The design bullet no longer ends on
  the salesperson app, so the span bullet no longer opens against it. **Both scales survive intact:** the
  span runs on both apps in order, and `where the model proved out` still attaches to the salesperson app
  alone.

- **Conclusion-first is not a finding, and this is the one place a reviewer would be wrong to block.**
  The design bullet now leads with the answer (`Designed the API contract … MongoDB on the server, SQLite
  on the device`) and gives the cause after. The corpus clause pulls against that — *"He accumulates lived
  cases before stating a thesis … A draft that opens on the thesis and then illustrates it runs his form
  backwards."* — but the interview clause pulls with it: *"**He leads with feeling and conclusion**, not
  chronology or evidence."* **Precedence settles it and the ruler states the precedence outright:** *"it
  overrides the corpus wherever the two disagree."* The higher anchor backs the draft. Recorded because a
  quotable clause pointing the wrong way is exactly how a terminal round manufactures a finding.

- **The hybrid app, re-checked at the new text:** still a bare mention plus an approach-level statement
  scoped by `for this workload`, no verdict on any delivery, team or vendor; the three-apps count and the
  per-app front-technology argument untouched. **No client or employer named.** **The two open owner items
  untouched** — `"launch"` in the pt practice lines and *"levantei a plataforma"* in `2021-01`.

- **Several round-1 pt advisories were taken** where the line was rewritten anyway: `carga` → `carga de
  trabalho`, `correu de ponta a ponta` → `Fiz esse mesmo percurso`, `não somando infraestrutura` →
  `tiramos o offline-first da infraestrutura e o resolvemos no desenho`, and the `a analytics de
  stakeholders` article problem is gone.

### Advisory and droppable

- **`Ran the same span` has no antecedent.** No span has been named on the page — *span* is this Issue's
  and this review's vocabulary, not the reader's, and `the same` points back at a bullet that describes a
  design decision rather than a span. **pt does not have this problem to the same degree**, judged on its
  own: `Fiz esse mesmo percurso` uses a word that explains itself even with nothing to refer back to.
  Smallest change in en, if it is ever worth one: `Ran the full delivery on both native Android apps`.
- **`to the analytics stakeholders read`** garden-paths — *analytics stakeholders* reads as a compound
  noun until `read` arrives and re-parses it. `to the analytics that stakeholders read` costs one word.
- **pt: `até a análise que os stakeholders liam`** translates a term the same sentence keeps in English
  elsewhere (`look and feel`), and which this entry keeps throughout (`offline-first`, `sync`, `private
  cloud`, `hands-on`). *analytics* is the term in his own register. **Stated as advisory deliberately:**
  the corpus gloss clause could be dressed up to make this citable, and doing so in a terminal round would
  be taste wearing a ruler's clothes.
- Round 1's two advisories on the `2023-04` practice line are **carried, not dropped** — *The launches:*
  leading on a landing zone, and pt's *sobre ela* — and travel with finding 1 into the owner's decision.

### Flags to route — not craft findings, and not mine to judge

- **Round 1's carried finding 1 is a sourcing finding, not a truth finding.** Whether the platform is
  native on six platforms is `product-lead`'s blocking veto at the merge gate. What is checkable without
  leaving this file is that the practice line and the bullet below it disagree, and they still do at
  `efd6321`.
- **The byte-pin.** If the owner's decision moves the `2023-04` practice line, `PRACTICE_LINES_EN` in
  `apps/fed/src/data/vocabulary.test.ts` and the `.brand/surfaces.md` block move with it or the suite
  reddens. `quality-assurance`'s, stated here only so it is not discovered late.
- **The work-built-in-the-open clause is still absent** from the `2023-04` practice line, against the
  Issue's recorded *A closed decision*. Unchanged from round 1, unchanged in class: `quality-assurance`'s
  lens and the owner's word, not this ruler's.

CONTENT-REVIEW-CLEAR
