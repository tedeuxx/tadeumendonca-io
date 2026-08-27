# Content review — `highlights-522`

Rounds against [`published-voice`](https://github.com/tedeuxx/tadeumendonca-skills), the same skill the
draft was written against. A finding is blocking only where a clause of that skill is quoted verbatim
beside it; everything else is advisory and droppable without argument.

## Round 1 — 2026-08-26

draft: `apps/fed/src/data/profile.ts` (the `highlights` arrays, en and pt) @ `fe77bd5`

Scope read: the three new Accenture bullets, the added aerospace bullet on the current role, and pt
against en claim by claim. The five `description` fields were read for context only — they are
byte-pinned and out of scope, and no finding below asks for one to change.

### Citable findings

1. **"plus the performance engineering around it" cannot be pointed at a source** — clause:
   *"if you cannot point to where in the source material (an ADR, a `CLAUDE.md` passage, a transcript, a
   prior published piece, an explicit answer he gave) a claim, a number or a stance comes from, it does
   not go in the draft as his."*

   The clause appears in the Accenture bullet 2, en and pt (*"mais a engenharia de performance em
   volta"*). Every other technical noun in these bullets resolves: Ionic, native Android, React,
   Node/Express, MongoDB, Redis and offline-first are all in the private inventory
   (`.brand/inventario-valor-medido.md`, the 2018–2020 telecom entries); Flutter, the commerce pipeline
   and the AWS/Spring Boot education backend are in Issue #522's own drafted clause and its ratified
   narrative beat 1. **Performance engineering is in none of them** — the word does not occur in the
   Issue at all, and the one occurrence in the private record is an unrelated private note about him.

   What it costs the reader: nothing, if true. What it costs the piece: this is the entry the slice
   exists to strengthen, on a surface whose whole thesis is that its claims survive checking, and it is
   the only claim in the diff a checker could not resolve. The Issue's own standard — a claim proposed,
   checked, and withdrawn by the person it flattered — is what this clause has not been through.

   Smallest change that clears it: cut the clause in both editions, or point at the source and keep it.

2. **"That last one is AWS work three years before the AWS employment entries begin." earns its place
   only by positioning** — clause: *"If a passage only earns its place because it positions him, it does
   not earn its place."*

   The sentence carries no fact about work. Both halves are already on the page: the bullet has just
   said the AWS architecture happened *"in the final Accenture years"*, and the two AWS employment
   entries are directly below with their dates. The sentence's only job is to make the reader perform
   that subtraction and credit him with it — it instructs the reader how to score the preceding fact
   rather than describing anything.

   It is also a sentence about the file's own chronology inside a bullet about engagements, which is
   worse in pt: *"as entradas de emprego na AWS"* is a document-structure noun with no natural referent
   for someone reading the rendered page.

   Corroborating, not substituting for the clause: Issue #522 pre-authorised exactly this cut —
   *"The second clause is a fact about the file's own chronology — if it reads as a nudge rather than as
   description, cut it and keep the first sentence."* It reads as a nudge.

   Smallest change that clears it: delete the sentence in both editions. The date debt it was paying is
   already paid by *"in the final Accenture years"* sitting beside the AWS entries.

3. **Accenture bullet 2 announces itself as an inventory, and its stated organising principle is
   completeness** — clause: *"Every passage has a job in the journey — … — and a detail earns its place
   by what it moves, never by what it proves."*

   The opener is *"The rest of the custom builds in that period, one per sector:"* / *"As demais
   construções custom do período, uma por setor:"*. That frame tells the reader, in the sentence's own
   words, that the passage exists to close a list — *the rest*, *one per* — and the reader arrives at
   the three engagements already reading them as entries rather than as work. The engagements
   themselves are fine and each moves something (Flutter, a pipeline, an AWS backend); the frame is
   what turns them into a manifest.

   Related, and the reason this is not a length complaint: *"past a point more true material makes a
   passage worse, so shaping includes DECLINING what he offers — an interview-sourced draft fails by
   accumulation, not invention."* The `description` two lines above already states *"four custom-build
   engagements across four sectors"*, so the count is carried and the bullet does not owe the reader
   completeness.

   Smallest change that clears it: drop the frame and lead with the work — *"A Flutter app covering iOS
   and Android for a bank; the DevOps and delivery pipeline for a commerce platform; and, in the final
   Accenture years, AWS architecture with a Spring Boot microservices backend for an education
   product."* Splitting the sentence further is advisory, below.

### Advisory and droppable

- The seam bullet's thesis placement is **right**, and this is the answer to the question it was
  dispatched with: three bullets of lived cases followed by the statement is his own form, not the
  failure returning. What is soft is the meta-noun — *"2017 is the seam **in this entry**"* describes
  the document rather than the years. The second half (*"the work was platforms being built rather than
  packages being implemented"*) is the strong sentence and carries 2017 on its own.
- Accenture bullet 1 runs two sentences with six technical nouns in the second; it survives, but it is
  the densest sentence in the file and the offline-first claim — the strongest single thing in it — sits
  last, after the datastores.
- The current role's six bullets end on *"presenting architecture and delivery strategy to C-level"*.
  The new aerospace bullet is well placed at position two; the accumulation risk is at the tail, on an
  untouched bullet whose verb is the one the Issue diagnosed as reading like delivery management.
- If finding 2 is not taken, the pt sentence needs rephrasing independently of the en one.

### Checked, no finding

- **The vocabulary declines.** *cloud-native* correctly declined on the 2021–2023 entry, whose bullet
  already names EKS, ArgoCD and Istio; *custom* / *lean stack* used only inside the post-2017 window the
  owner permitted; nothing added to the 2008–2015 entry. The declines are as defensible as the uses.
- **pt against en, claim by claim.** pt asserts nothing en does not, in either edited entry.
- **The removal of *modern* from the bullet.** Correct on its own terms — see the routing flag below for
  what it did not reach.

### Flags to route — not craft findings, and not mine to judge

- The commit message states *"The word 'modern' leaves this entry with the bullet that carried it."*
  The same entry's `description` still reads *"building modern web and native-mobile products"* and
  *"where the modern-engineering identity was forged"*. The word left the bullet, not the entry. The fix
  would touch a byte-pinned `description` and is out of scope here; routing to `quality-assurance` as an
  accuracy point about the commit record, and to `product-lead` as a live adjective-instead-of-evidence
  instance the slice did not close.
- *lean-stack* now appears on a `/me`-visible surface, while Issue #522's correction 3 says to cut it
  from ATS-facing surfaces. Whether `highlights` counts as ATS-facing is an Issue-requirement and
  machine-read question; `published-voice` carries no ATS rule and this reviewer has no instrument for
  it.
- Nothing in the diff is flagged as factually wrong. Finding 1 is a sourcing finding, not a truth
  finding; whether performance engineering happened is `product-lead`'s to settle at the merge gate.

CONTENT-REVIEW-FINDINGS
