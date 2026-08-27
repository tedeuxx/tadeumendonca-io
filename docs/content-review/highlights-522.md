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

## Round 2 — 2026-08-26

draft: `apps/fed/src/data/profile.ts` (the `highlights` arrays, en and pt) @ `df596fb`

**Terminal round.** Two `## Round` sections now exist; the pair is spent and the draft goes to the
owner in whatever state this leaves it. Nothing below holds anything.

Round 1's three blocking findings are resolved. Finding 2 is cut in both editions. Finding 3's
inventory frame is gone. **Finding 1 was answered by fixing the record rather than the copy, and it was
re-checked here rather than accepted:** `grep -in performance` against Issue #522 at head now returns
his own sentence (*"…performance arquitetura aws microservicos backend springboot…"*) plus a second
naming it (*"esse projeto de performance"*). The clause is sourced. **I was right about the record and
wrong about the claim, and that is the more useful half to record.**

The two rewritten bullets are new text, and this round reads them as new text.

### Citable findings

1. **The seam sentence's scope was judged where the record already decided it, and the record decides
   it the other way** — clause: *"if you cannot point to where in the source material (an ADR, a
   `CLAUDE.md` passage, a transcript, a prior published piece, an explicit answer he gave) a claim, a
   number or a stance comes from, it does not go in the draft as his."*

   The draft now reads *"2017 is the seam, and from there to the end of the Accenture years the work was
   platforms being built rather than packages being implemented."* The terminal bound was added to avoid
   a false universal, on the grounds that the entry directly below is the DevOps one where the function
   was instrumenting rather than building.

   **That premise is contradicted by a ratified owner correction in the Issue itself** (#522, *The two
   spans*): *"the **Globo period is a role variation inside it, not an exception to it** — the owner
   corrected the intake on this: it was lean implementation like the rest, on a D2C launch, with the
   function varying to observability/DevOps. The function stays named; the span stays unbroken."* The
   universal is not false by his own account, so the scope narrowing is a stance with no source behind
   it and a source against it.

   What it costs the reader: this is the one bullet the slice built to make 2017 scannable, and it now
   ends the claim at 2020-06 — the seam reads as a turn inside one employer rather than the career
   boundary the whole Issue is about (*"2017 → present"*, *"nine years building software under four
   titles"*). It shrinks the slice's central sentence to a quarter of its span.

   Smallest change that clears it: drop the terminal bound — *"2017 is the seam: after it, the work was
   platforms being built rather than packages being implemented."* The Globo entry's own `description`
   already names its function inside a launch programme, which is exactly the owner's resolution and the
   reason the unscoped sentence is not a universal that overreaches.

   **The instinct to ask about this sentence was right; the answer was already in the record.**

2. **The replacement bullet has no actor, and the wording that caused it was mine** — clause:
   *"Describe what exists at the size it exists — neither inflated nor shrunk."*

   *"A Flutter app covering iOS and Android for a bank; the DevOps and delivery pipeline for a commerce
   platform; and, in the final Accenture years, AWS architecture with a Spring Boot microservices
   backend for an education product…"* is three noun phrases with no verb and no subject. Every other
   bullet in both Accenture entries opens with a verb or a role noun — *Architected…*, *Responsible
   application architect on…*, *Left packaged software behind…*, *Grew into…*. This one lists artifacts
   with him absent from all three.

   On the entry whose whole defect was under-recording what he did, a bullet that names the work and not
   the worker describes his contribution at zero. The inventory frame is gone and the agency went with
   it. **Round 1's suggested wording is what produced this shape; the finding is against the ruler, not
   against the drafter, and it is raised here rather than left because this is the last round.**

   Smallest change that clears it: restore a verb, sourced to the copy this entry published in his voice
   before the slice — *"Architected and shipped a Flutter app covering iOS and Android for a bank; the
   DevOps and delivery pipeline for a commerce platform; and, in the final Accenture years, …"*. One
   verb pair, no frame, no remainder noun.

3. **The performance clause is sourced now, and the shaping inverts what the source makes primary** —
   clause: *"Describe what exists at the size it exists — neither inflated nor shrunk."*

   His record names that engagement twice, and the naming instance is unambiguous: *"esse projeto de
   performance"* — performance is the project's identity, and the enumeration that precedes it puts
   *performance* at the head (*"performance arquitetura aws microservicos backend springboot"*). The
   draft renders it *"AWS architecture with a Spring Boot microservices backend for an education
   product, plus the performance engineering around it"* — an adjunct trailing an architecture claim,
   *around* the thing rather than the thing.

   Smallest change that clears it: *"performance engineering on an AWS architecture with a Spring Boot
   microservices backend for an education product"*. Shorter, and the head noun sits where he put it.
   Same reorder in pt.

   Not a truth finding — whether the work happened is settled; this is fidelity to the source's own
   emphasis.

### Advisory and droppable

- *"the end of the Accenture years"* trades one document noun for another in a file carrying **two**
  Accenture entries. If finding 1 is taken the phrase goes with it and this costs nothing.
- The same bullet now carries *"at that point"* and *"2017 is the seam"* in consecutive sentences — two
  markers for one boundary.
- The seam bullet's **placement** is still right, unchanged from round 1: three bullets of lived cases
  then the statement is his own form.

### Checked, no finding

- **The performance sourcing**, re-run here rather than taken on report.
- **pt against en** on both rewritten bullets: parallel, and pt claims nothing en does not. The
  actorless construction in finding 2 is present identically in pt.
- **The cut of finding 2** is clean in both editions; nothing was left dangling by it.

### Flags to route — not craft findings

- The two round-1 flags stand unchanged: the word *modern* still appears twice in this entry's
  `description`, and *lean-stack* now sits on a `/me`-visible surface against the Issue's ATS guidance.
- The commit message names a new cross-surface delta — LinkedIn still carries the sentence cut here, so
  the site now says less than LinkedIn on the three-year AWS lead. Correctly named by the drafter;
  routing it to `product-lead` and the owner, since cross-surface coherence has no clause in this
  ruler.

CONTENT-REVIEW-FINDINGS
