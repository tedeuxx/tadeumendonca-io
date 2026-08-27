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
