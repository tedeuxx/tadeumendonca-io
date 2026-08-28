import { describe, it, expect } from 'vitest';
import { STACK } from '../components/Marquee';
// `?raw` rather than `node:fs`, and the first version got this wrong in a way vitest could not see:
// the app's tsconfig carries no Node types, so `readFileSync`/`__dirname` typecheck-fail while the
// suite passes — vitest does not run tsc. Green tests, red build, pushed. `?raw` is Vite's own way to
// import a file as text, it is already the idiom here (`content/architecture-links.test.ts`), and it
// needs no types the app does not have.
import profileSrc from './profile.ts?raw';
import architectureEn from '../content/architecture.en.md?raw';
import architecturePt from '../content/architecture.pt.md?raw';
// The practice-line block at the foot of this file reads the RESOLVED profile rather than the source
// text above, and the reason is written out beside the assertions — same import pair
// `resolveProfile.test.ts` opens with, so there is one way to read this data in tests, not two.
import { resolveProfile } from './resolveProfile';
import { profileSource } from './profile';
import type { Profile } from '../types/profile';

// THE PRACTICE'S NAME, PINNED ON EVERY SURFACE THAT CARRIES IT — not just the OG card.
//
// This file exists because of an asymmetry that was the MECHANISM of a real miss rather than a
// symptom of one. The term has been renamed twice in three days, and both times the only assertion
// guarding it in this repo was on `META_LINE` — so `profile.ts`, the landing strip and both editions
// of `/architecture` carried the term with nothing watching. An edit reverting the CV to a superseded
// name would ship with a fully green build.
//
// The sibling repo learned this first: `-skills` was left on a retired term for a day in July because
// it was outside the batch, and its answer was a suite looping the same both-directions check over
// every document that names the practice. This is that shape, here, over the surfaces this repo owns.
//
// WHY BOTH DIRECTIONS. Presence alone passes on a document that gains the new name and keeps the old
// one three paragraphs down — which is exactly what "supersede, never rewrite" makes easy to do by
// accident in prose files that legitimately discuss their own history.
//
// WHY A LOOKBEHIND AND A STEM. Two lessons paid for in full elsewhere in this batch:
//   · the term GREW (`Harness` → `Agent Harness`), so `toContain('Harness Engineering')` is satisfied
//     by the qualified form and stops discriminating — silently, on the day of the rename;
//   · the term also INFLECTED (`Loop Engineering` → the role noun `Loop Engineer`), so a fixed-string
//     check for the retired term missed a heading that still named its practitioner.
// A fixed-string comparison guarding a NAME breaks the day the name changes shape. Both are patterns.
const CURRENT = 'Agent Harness Engineering';
const BARE_UNPREFIXED = /(?<!Agent )Harness Engineering/;
const RETIRED_STEM = /Loop Engineer/;

// THE PARENTHESISED FORM IS A PROSE AFFORDANCE, AND IT IS SCOPED TO THE SURFACES THAT EARNED IT.
// `/architecture` opens by naming the practice as `(Agent) Harness Engineering` — the parentheses are
// doing work there: the essay is about what the word `Agent` adds, so the sentence has to be able to
// show the term with and without it. That is an argument about the essay, not about the vocabulary.
//
// WHY THIS IS NOT A RELAXATION OF `BARE_UNPREFIXED`. Widening the shared pattern would silently permit
// `(Agent) Harness Engineering` in the CV headline (`profile.ts`) and on the landing strip — the very
// surfaces #328 paid to pin to exactly ONE rendering, because a recruiter reading the headline meets
// the term once and a parenthetical there reads as hedging. An allowlist that covers every surface
// stops guarding the string it was built to guard. So the exception is DATA on the surface that gets
// it, and a surface not listed with it keeps the strict form by construction.
const BARE_ALLOWING_PARENTHESISED = /(?<!Agent |\(Agent\) )Harness Engineering/;

// THE TWO GLOBAL OPTIONS THAT WERE WEIGHED AND REJECTED — recorded here, beside the table, because a
// rejected option nobody can find comes back as a tidy-up. The rule the table encodes: the
// parenthesised form where the term is ARGUED (today exactly `/architecture`'s prose), the strict form
// where it is a KEYWORD — scanned, matched, or rendered in a slot measured in characters.
//
// 1. BRACKETS EVERYWHERE. Rejected on what it costs the keyword surfaces, where the term can least
//    defend itself: `og-copy.mjs`'s META_LINE renders ~320px wide and is where a pt reader meets the
//    term first (og-copy.mjs:20-22); the CV headline (`profile.ts` :32/:35) is SCANNED rather than
//    read, so a bracket on the one line a recruiter meets the term in reads as a hedge; and a bracket
//    on `profile.ts`'s levelled skills entry (`{ name: 'Agent Harness Engineering', level: 2 }` — cited
//    by its literal rather than by a line, because the line moved twice while this comment said `:347`)
//    reads as an optional qualifier on a levelled competence claim. LinkedIn's
//    220-character headline limit is real but is NOT one of those reasons, and the margin is recorded
//    here so the external fact stays checkable: the en headline with `{{years}}` → 18 is 164
//    characters, and `(Agent) ` over `Agent ` adds 2 — the parenthesised form would fit at 166.
//    THE FIGURE MOVED, and the reason is the point: the 202/204 pair published here until #451 (PR
//    #457) was correct only for the longer headline that PR deleted. A measured number
//    that outlives the string it measured is exactly what this block exists to prevent, so it now
//    ships with the command that re-derives it from the source — run from the repo root, and it
//    prints both figures:
//      node -e "const s=require('fs').readFileSync('apps/fed/src/data/profile.ts','utf8');const b=s.split('headline: {')[1].split('},')[0].split('pt:')[0];const en=[...b.matchAll(/'([^']*)'/g)].map(m=>m[1]).join('').replace('{{years}}','18');console.log(en.length, en.length+2)"
//    Nothing pins these two numbers — the command is the falsifier, not a test. The constraint binds
//    even LESS at 164 than it did at 202, so this rejection is strengthened rather than weakened; the
//    two reasons above are still what carry it, and never the limit. Brackets
//    everywhere would also have forced a republication of all four OG cards (og-copy.mjs:29 — every
//    edit to that line republishes them), which scrapers have pinned, for no gain to any reader.
//
// 2. STRICT EVERYWHERE — drop the brackets from the figure too. This was `product-lead`'s position and
//    it is OVERRULED, not absent. Its case was strong: it converges every surface at zero test cost,
//    and in its sharpest form — a term that changes shape a fourth time inside two weeks reads as a
//    term that has not settled. The owner chose to propagate instead; the figure's brackets predate the
//    decision and are already glossed on the page.
//
// `:402` STAYS UNQUALIFIED, and `CLAIM_CLAUSE` below is why that is a rule rather than a wish: it is
// the sentence declaring the term to be his, and a parenthesis makes optional the very word the claim
// asserts.
//
// ONE ARGUMENT FOR THE BRACKETS WAS DROPPED RATHER THAN SOFTENED, and no test refuses its return
// because it was never about the rendering rule. `architecture.*.md:43`'s gloss argued the brackets from
// MARKET USAGE — that `harness engineering` is commonly said today for the practice alone. There is
// no source for that in this repo or in the owner's private positioning source, and none was
// invented, so the clause was removed from the published page rather than hedged. What remains is the
// page's own use of the two forms, which a reader can check on the page itself. Restoring the market
// premise needs the owner's own grounding and is a SEPARATE change — restoring it as a tidy-up, on the
// grounds that the sentence reads thin without it, is exactly the failure this block exists to prevent.
//
// ONE ROUTE USED TO CARRY THE PARENTHESISED FORM OUT OF `/architecture` — an ADR title naming its own
// subject, rendered on `/library`. That record was removed on the owner's decision (a typesetting rule
// a test refuses is not re-decided, so it was never an ADR — tadeumendonca-io#456), so THE ROUTE NO
// LONGER EXISTS. Stated so nobody re-derives the exception from a record that is gone.
//
// TWO THINGS ABOUT THE FIGURE THAT LIVE NOWHERE ELSE:
//   · `architecture.*.md:23`, the `accDescr`, carries the STRICT form and describes the brackets in
//     words, because parentheses are ambiguous when spoken. So a non-sighted reader meets the strict
//     form exactly where a sighted reader meets the bracketed one. Deliberate, and a real asymmetry —
//     and, like `:24` below, NOTHING PINS IT: bracketing the `accDescr` tomorrow stays green, so the
//     choice is disclosed here on the same terms rather than presented as if it were guarded.
//   · `architecture.*.md:24`, the figure's `centre:`, is pinned by NOTHING. It reads
//     `centre: (Agent) Harness | Engineering`, and the pipe means no bare-form pattern here can ever
//     match that line in either rendering — so stripping its brackets tomorrow stays green. An honest
//     gap, stated rather than implied.

// Surfaces are read as SOURCE rather than imported as values, because what is asserted is the
// authored TEXT — including the comments around it, which is where a superseded term most often
// survives a find-and-replace. `profile.ts` is read the same way for the same reason: its comments
// carry the vocabulary history and are exactly where the bare form would linger.
//
// The third element is the surface's OWN bare-form pattern. It is a tuple rather than a flag so that
// reading the list answers "which rendering is legal here" per row, with no default to look up.
const SURFACES: ReadonlyArray<[string, string, RegExp]> = [
  ['profile.ts', profileSrc, BARE_UNPREFIXED],
  ['architecture.en.md', architectureEn, BARE_ALLOWING_PARENTHESISED],
  ['architecture.pt.md', architecturePt, BARE_ALLOWING_PARENTHESISED],
];

// THE ONE SENTENCE ON THOSE TWO SURFACES THAT STILL MAY NOT PARENTHESISE, AND WHY IT IS PINNED APART.
// The affordance above is granted per FILE, so it necessarily covers the closing paragraph too — and
// that paragraph is where the essay stops describing the term and CLAIMS it: "Agent Harness
// Engineering is the claim I am making". A parenthesis there makes optional the very word the sentence
// is claiming, so the unqualified rendering is not a stylistic leftover; it is the point of the
// sentence. The `toContain(CURRENT)` assertion does not cover this — `accDescr` further up carries a
// plain occurrence, so a drift confined to the claim sentence would ship green.
//
// ANCHORED ON THE CLAUSE, NOT ON A LINE NUMBER: this page is being restructured (#448), and a
// positional anchor would silently start guarding a different sentence. The clause is distinctive per
// edition, and its own presence is asserted first — an anchor that stops matching must redden as a
// missing anchor rather than pass as a satisfied one.
const CLAIM_CLAUSE: ReadonlyArray<[string, string, RegExp]> = [
  ['architecture.en.md', architectureEn, /is the claim I am making/],
  ['architecture.pt.md', architecturePt, /é a afirmação que eu faço/],
];

// AND THE SENTENCE THAT MUST PARENTHESISE — the same defect class as `CLAIM_CLAUSE`, from the other side.
// `SURFACES` only forbids a BARE form on these two files, and `toContain(CURRENT)` is satisfied by the
// `accDescr` further down, so the opening sentence — the one occurrence this page's whole rendering rule
// is ABOUT — was guarded by nothing: reverting it to the strict form, or deleting the term from it, or
// changing it in one edition only, all shipped green. The third is the one that matters most, since a
// suite whose purpose is cross-surface consistency was reporting consistency while the editions diverged.
//
// SAME ANCHOR DISCIPLINE AS ABOVE, for the same #448 reason, and stated once here rather than twice:
// the anchor's presence and uniqueness are asserted FIRST, so a reworded opening fails as a moved anchor
// rather than passing as a satisfied one; emphasis markers are stripped rather than matched; and the
// assertion is on the text ADJACENT to the anchor, not on a line number.
//
// THE ANCHOR IS PER EDITION, not a shared phrase. The two editions are written, not translated — they
// share no clause — and assuming they did has already cost this page one round.
const PARENTHESISED = '(Agent) Harness Engineering';
const OPENING_CLAUSE: ReadonlyArray<[string, string, RegExp]> = [
  ['architecture.en.md', architectureEn, /a loop built on AI-DLC & /],
  ['architecture.pt.md', architecturePt, /um loop construído sobre AI-DLC & /],
];

describe('the practice is named consistently across every surface', () => {
  it.each(SURFACES)('%s names the current term', (_name, src) => {
    expect(src).toContain(CURRENT);
  });

  it.each(SURFACES)('%s carries no un-prefixed form of it', (_name, src, bare) => {
    // Historical notes are allowed to NAME the supersession — what is forbidden is the bare form
    // standing as the practice's name. The lookbehind draws exactly that line: `Agent Harness
    // Engineering` passes, a lone `Harness Engineering` does not, wherever it sits. The pattern comes
    // from the surface's own row, so a prose surface's parenthesised affordance never reaches the CV.
    expect(src).not.toMatch(bare);
  });

  it.each(SURFACES)('%s is clear of the retired term in every inflection', (_name, src) => {
    expect(src).not.toMatch(RETIRED_STEM);
  });

  // THE EXCEPTION HAS TO STILL DISCRIMINATE, and reading it never proves that. A pattern that accepted
  // every rendering would make the assertion above a tautology and stay green on the day the term is
  // reverted — the exact failure this file was written to stop, arriving through the allowlist instead
  // of through the term. So both patterns are exercised against literals here, in both directions.
  it('the parenthesised affordance is scoped, not a blanket allowance', () => {
    // The prose pattern still catches a genuinely bare occurrence…
    expect('a loop built on Harness Engineering').toMatch(BARE_ALLOWING_PARENTHESISED);
    // …and accepts only the two renderings the essay is allowed to use.
    expect('a loop built on Agent Harness Engineering').not.toMatch(BARE_ALLOWING_PARENTHESISED);
    expect('a loop built on (Agent) Harness Engineering').not.toMatch(BARE_ALLOWING_PARENTHESISED);
    // The strict pattern is unchanged: the parenthesised form is still a failure on a CV surface.
    expect('AI-DLC & (Agent) Harness Engineering').toMatch(BARE_UNPREFIXED);
  });

  it.each(CLAIM_CLAUSE)('%s claims the term unqualified in the sentence that claims it', (_name, src, clause) => {
    // The anchor first, and exactly once. If #448's restructuring reworded or duplicated the clause,
    // this fails as "the anchor moved" instead of quietly guarding nothing or guarding the wrong one.
    expect(src.match(new RegExp(clause.source, 'g')) ?? []).toHaveLength(1);

    // Then the rendering immediately before it. Emphasis markers are stripped rather than matched, so
    // the assertion survives the term losing its bold and still fails on the parenthesised form —
    // `(Agent) Harness Engineering` does not end with `Agent Harness Engineering`.
    const preceding = src.slice(0, src.search(clause)).replace(/\*/g, '').trimEnd();
    expect(preceding.endsWith(CURRENT)).toBe(true);
  });

  it.each(OPENING_CLAUSE)('%s parenthesises the term in the sentence that introduces it', (_name, src, clause) => {
    // The anchor first, and exactly once — a reworded or duplicated opening reddens here, as an anchor
    // that moved, before anything is asserted about the term itself.
    const hits = src.match(new RegExp(clause.source, 'g')) ?? [];
    expect(hits).toHaveLength(1);

    // Then the rendering immediately after it. `Agent Harness Engineering` and a deleted term both fail:
    // neither STARTS with the parenthesised form. Asterisks are stripped so the assertion survives the
    // term gaining or losing its bold, exactly as `CLAIM_CLAUSE` does on the other side of its anchor.
    // The `?? ''` is unreachable: the length assertion above aborts the test when the anchor is
    // missing. It is written rather than a `!` because this app's tsconfig checks indexed access, and
    // the first version of this line typechecked-failed while the suite passed — the exact asymmetry
    // the header of this file was written about.
    const start = src.search(clause) + (hits[0] ?? '').length;
    const following = src.slice(start, start + 80).replace(/\*/g, '').trimStart();
    expect(following.startsWith(PARENTHESISED)).toBe(true);
  });

  // The strip is asserted through the exported list rather than the file, because here the DATA is
  // the surface — a reader sees the array's contents, not its source.
  it('the landing strip carries the current term and no superseded form', () => {
    expect(STACK).toContain(CURRENT);
    expect(STACK.filter((s) => BARE_UNPREFIXED.test(s))).toEqual([]);
    expect(STACK.filter((s) => RETIRED_STEM.test(s))).toEqual([]);
  });
});

// THE PRACTICE LINE, PINNED ON THE ONE SURFACE A TEST CAN REACH (#522).
//
// WHAT IT GUARDS. Every `experience` entry's `description` opens with a fixed-shape practice line —
// the arc noun, then his function in it — in both editions (criterion 1); and the 2008–2015 entry
// names enterprise-integration SDLC while claiming neither software engineering nor a platform launch
// (criterion 2). The device only works if a reader scanning the first line under each title meets one
// continuous practice; a single entry losing its opener puts four unrelated roles back on the page,
// and nothing else in this repo would say so.
//
// ── THE LIMIT, AND IT IS WHY CRITERION 7 ASKS FOR IT IN THE TEST'S OWN BODY ──
// THIS COVERS THE REPO HALF ONLY. IT CANNOT REACH LINKEDIN. A green run says `profile.ts` still
// matches the copy recorded in the private, gitignored `.brand/surfaces.md`. It does NOT say that
// record still matches what is live on LinkedIn. LinkedIn is hand-edited, external, and unreachable
// from any test in this repo, so the third surface of criterion 6 is verified by a human opening the
// page and by nothing else. Read a green here as "the site has not drifted from the record", never as
// "the three surfaces agree" — and when the record itself is re-synced, that is a manual step this
// suite is blind to.
//
// AND SINCE 2026-08-27 THE THREE SURFACES ARE KNOWN NOT TO AGREE, DELIBERATELY. The `2023-04` line
// below is transcribed from `.brand/surfaces.md`'s **2026-08-27** block, which records copy the site
// publishes and LinkedIn does NOT yet carry — #522's surface-parity pass is a separate, owner-
// authorised step after the repo half merges. The other four lines still come from the 2026-08-26
// block and are unchanged. So a green run means exactly what it always meant — site matches record —
// and the record now says, in writing, which of its lines LinkedIn is behind on. The date in a comment
// is not the anchor; the literal is.
//
// WHY THE RESOLVED PROFILE RATHER THAN `profile.ts?raw`. The idiom the rest of this file uses cannot
// work for this: each practice line is authored as five or six concatenated string literals, so no
// regex over the raw source ever meets the assembled sentence — a `?raw` assertion here would be
// green because it matched nothing, which is the worst available failure. `resolveProfile` is how the
// components read this data, so the assertions run against the sentence a reader actually gets.
//
// WHY THE EXPECTED LINES ARE INLINE LITERALS, AND WHERE THEY COME FROM. They are transcribed from
// `.brand/surfaces.md` — the other side of the sync, the 2026-08-26 block for four of them and the
// 2026-08-27 block for `2023-04` — and NOT derived from `profile.ts`. An expectation built from the file it guards passes unconditionally and reading it
// never reveals that. Because these came from the record, editing the site copy alone reddens here,
// which is exactly the drift criterion 6 exists to stop. The private file is READ, never quoted into
// a public surface; the practice lines themselves are published copy, so they are safe in this file.
//
// SELECTED BY `start_date`, NOT BY ARRAY POSITION. Reordering the entries must fail as a missing
// entry, not silently move an assertion onto a different role.
const enProfile = resolveProfile(profileSource, 'en');
const ptProfile = resolveProfile(profileSource, 'pt');

const descriptionOf = (profile: Profile, start: string): string => {
  const matches = profile.experience.filter((e) => e.start_date === start);
  // Exactly one, asserted before anything is read off it: a duplicated or missing start date must
  // redden as a broken anchor rather than pass on whichever entry happened to be first.
  expect(matches).toHaveLength(1);
  return matches[0]?.description ?? '';
};

// The recorded English practice lines, keyed by the entry each one opens.
const PRACTICE_LINES_EN: ReadonlyArray<[string, string]> = [
  [
    '2023-04',
    "Application-modernization and new digital-platform launch programs — microservices, full-stack web, smart TVs and native mobile. Leading the implementation: solution architecture, AWS infrastructure and the technical direction of the build. The launches: a custom cloud-native replacement for a SaaS streaming platform, native across five platforms plus Web, and — as tech lead — an upstream operational-monitoring platform on an oil & gas operator's AWS landing zone. And building hands-on: an internal knowledge platform still in progress, and public work at tadeumendonca.io with its agent harness and plugin.",
  ],
  [
    '2021-01',
    'Application-modernization programs — full-stack web on a cloud-native stack. Hands-on individual contributor into tech lead: I set the platform up and wrote application and infrastructure code.',
  ],
  [
    '2020-06',
    'New-platform launch program — a direct-to-consumer sales and subscription platform. Function: observability and DevOps engineering, instrumenting the web revenue path end to end.',
  ],
  [
    '2015-01',
    'New-platform launch projects — full-stack web and native mobile — from 2017 at Accenture Digital; enterprise integration architecture before that. Application architect, hands-on across every tier: mobile clients, web front ends, the backends under them and the delivery pipeline — four custom-build engagements across four sectors.',
  ],
  [
    '2008-03',
    'Enterprise-integration SDLC — packaged implementations, ETL and SOA. Hands-on build and integration of large-scale distributed systems.',
  ],
];

// THE SHAPE, PER LOCALE — the weaker assertion, and it carries the Portuguese edition alone.
// There is no `.brand/` record to transcribe for pt (LinkedIn publishes English), so pt has no
// byte-exact anchor and this is the only thing guarding it. What it pins is the part the device is
// made of: the arc noun, and the em-dash that separates it from the function.
//
// THE PT ARC NOUN IS NOT ONE WORD. The Accenture Digital entry opens `Projetos de …` where the other
// three open `Programas? de …` — the en side already spelled all three (`programs|program|projects`)
// and the pt side must too, or this arm reddens on correct copy.
const ARC_NOUN: ReadonlyArray<[string, RegExp, RegExp]> = [
  // THE TWO AWS ENTRIES MOVED OFF `launch` ON 2026-08-27 (#539), AND ON `2021-01` IT WAS A TRUTH
  // FINDING RATHER THAN A PREFERENCE — that entry's own bullet says the bank's mortgage-credit domain
  // was MIGRATED OFF MAINFRAME, which is modernization and not the launch of a new platform. Same
  // instrument #522 used to cut `lean stack`: the arc noun has to survive every role it covers. The
  // `2020-06` and `2015-01` rows are untouched — a D2C platform genuinely launched, and the Accenture
  // Digital entry's evidence is custom builds — so this is not a file-wide replacement.
  [
    '2023-04',
    /^Application-modernization and new digital-platform launch programs — /,
    /^Programas de modernização de aplicações e launch de novas plataformas digitais — /,
  ],
  ['2021-01', /^Application-modernization programs — /, /^Programas de modernização de aplicações — /],
  ['2020-06', /^New-platform launch program — /, /^Programa de launch de nova plataforma — /],
  ['2015-01', /^New-platform launch projects — /, /^Projetos de launch de novas plataformas — /],
  ['2008-03', /^Enterprise-integration SDLC — /, /^SDLC de integração corporativa — /],
];

describe('every role opens with the practice line (#522)', () => {
  // "EVERY entry" is criterion 1's word, so the count is asserted rather than assumed: a sixth role
  // appended with no practice line would otherwise ship green past a table that never mentions it.
  it('covers every experience entry, in both editions', () => {
    expect(enProfile.experience).toHaveLength(PRACTICE_LINES_EN.length);
    expect(ptProfile.experience).toHaveLength(ARC_NOUN.length);
  });

  it.each(PRACTICE_LINES_EN)('%s opens with the recorded line, byte for byte (en)', (start, line) => {
    // Compared as a prefix rather than with `startsWith`, so a drift prints the two strings side by
    // side instead of `expected false to be true`.
    expect(descriptionOf(enProfile, start).slice(0, line.length)).toBe(line);
  });

  it.each(ARC_NOUN)('%s states the arc noun in both editions', (start, enPattern, ptPattern) => {
    expect(descriptionOf(enProfile, start)).toMatch(enPattern);
    expect(descriptionOf(ptProfile, start)).toMatch(ptPattern);
  });

  // CRITERION 2 — SCOPED TO THE 2008–2015 ENTRY AND TO NOWHERE ELSE. Software engineering is a
  // legitimate, load-bearing claim on the four later entries; what the Issue forbids is dating it
  // before 2017. So this is a negative on ONE entry, selected by its start date, and it would be
  // wrong as a file-wide grep.
  it('the 2008–2015 entry claims enterprise-integration SDLC, and neither engineering nor a launch', () => {
    const enEarly = descriptionOf(enProfile, '2008-03');
    const ptEarly = descriptionOf(ptProfile, '2008-03');

    expect(enEarly).toContain('Enterprise-integration SDLC');
    expect(ptEarly).toContain('SDLC de integração corporativa');

    expect(enEarly).not.toMatch(/software engineer/i);
    expect(enEarly).not.toMatch(/launch/i);
    expect(ptEarly).not.toMatch(/engenharia de software/i);
    expect(ptEarly).not.toMatch(/launch/i);
  });
});
