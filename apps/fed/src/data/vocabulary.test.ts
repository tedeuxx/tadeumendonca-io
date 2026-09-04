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
// #558. The profile banners' copy module. It is registered here IN THE COMMIT THAT CREATES IT, and the
// reason is the shape of this guard rather than anything about banners: `SURFACES` is an ALLOWLIST, so a
// new surface that names the practice is not "unguarded" — it is invisible, and invisible reads as green
// to the next person who opens this file. The private positioning record licenses a short form of the
// practice name ON LINKEDIN, which is exactly the surface a banner is uploaded to, so this is the one new
// module where the short form would have looked correct while breaking the repo-side rule.
import bannersSrc from '../../scripts/banners.mjs?raw';
// The practice-line block at the foot of this file reads the RESOLVED profile rather than the source
// text above, and the reason is written out beside the assertions — same import pair
// `resolveProfile.test.ts` opens with, so there is one way to read this data in tests, not two.
import { resolveProfile } from './resolveProfile';
import { profileSource } from './profile';
import type { Profile } from '../types/profile';

// THE PRACTICE'S NAME, PINNED ON EVERY SURFACE THAT CARRIES IT — not just the OG card.
//
// This file exists because of an asymmetry that was the MECHANISM of a real miss rather than a
// symptom of one. The term had been renamed twice in three days when this was written, and both times
// the only assertion guarding it in this repo was on `META_LINE` — so `profile.ts`, the landing strip
// and both editions of `/architecture` carried the term with nothing watching. An edit reverting the CV
// to a superseded name would ship with a fully green build.
//
// IT HAS NOW BEEN RENAMED A THIRD TIME (`Agent Harness Engineering` → `Context & Harness Engineering`,
// 2026-09-04, #593), AND THIS FILE IS WHY THAT ONE WAS NOT A MISS: the rename reddened the build before
// a line of copy had been reviewed, on the surfaces `META_LINE` alone would have said nothing about.
// The count is kept current rather than left at "twice", because the sentence is evidence for the
// guard and evidence that stopped being true is evidence for nothing.
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
const CURRENT = 'Context & Harness Engineering';

// THE PATTERN NAMES WHICHEVER QUALIFIER IS CURRENT, AND #593 REPOINTED IT RATHER THAN WIDENING IT.
// This read `(?<!Agent )` until 2026-09-04. The distinction is the whole of the review question, so it
// is stated in the terms that settle it: the old pattern admitted EXACTLY ONE rendering
// (`Agent Harness Engineering`) and this one admits EXACTLY ONE (`Context & Harness Engineering`).
// Same width. And strictly more discrimination in one direction — the superseded term is now caught by
// this pattern on every surface, which the old pattern could not express at all, since the thing it was
// built to permit is the thing that was retired.
//
// WHY THERE IS NO SURFACE-SCOPED EXCEPTION, since #593 asked for one and this is the deviation. A
// scoped exception is the right shape when ONE surface earns a rendering the others must not have —
// which is exactly what the retired affordance below was. It is the wrong shape here, because the new
// name is carried by EVERY guarded surface: an exception scoped to the CV would have left the other
// three red against a name they correctly carry, and the only way to make them green would have been
// to grant the same exception four times, which is a shared pattern spelled four times. The per-surface
// tuple is untouched AS A MECHANISM (see `SURFACES`); what moved is the qualifier the pattern spells.
const BARE_UNPREFIXED = /(?<!Context & )Harness Engineering/;
const RETIRED_STEM = /Loop Engineer/;

// THE PARENTHESISED PROSE AFFORDANCE IS RETIRED (#593), AND WHY IT EXISTED IS KEPT RATHER THAN DELETED.
// Until 2026-09-04 `/architecture` alone was allowed a second rendering — `(Agent) Harness Engineering`
// — because the essay's subject was what the word `Agent` ADDED to the term, so its sentences had to be
// able to show the term with the word and without it. The rename deleted that word from the name: there
// is no qualifier left to make optional, and `(Context &) Harness Engineering` would put brackets round
// an ampersand. So the affordance went with the word rather than being re-pointed at a new one.
//
// READ THIS AS A TIGHTENING, NOT A THINNING. The allowlist that used to cover two files now covers
// none, and all four surfaces carry the strict pattern. What was LOST is the ability of the essay to
// render the term two ways, and nothing on the page needs it any more — the page's own bracket-
// justifying clause ("`Agent` is in brackets on purpose…") was removed in the same slice, because a
// justification for a rendering that no longer exists is a paragraph arguing for nothing.
//
// THE TWO GLOBAL OPTIONS WEIGHED WHEN THE AFFORDANCE WAS GRANTED ARE MOOT WITH IT, and neither was
// re-argued in #593: brackets on every surface (rejected on what it cost the surfaces where the term is
// SCANNED rather than read), and strict everywhere (`product-lead`'s position, overruled at the time).
// The tree now does the second for an unrelated reason — the word they argued about is gone.
//
// THE HEADLINE FIGURE SURVIVES THE AFFORDANCE, because it was never about brackets: it is about
// LinkedIn's 220-character headline limit, which is an external fact the CV surface still lives under.
// IT WAS WRONG WHEN THIS RENAME FOUND IT — the published value was 164 and the command beside it
// returned 180, because PR #457 shortened a different part of the same string and the figure was not
// re-run. That is the exact defect the "publish the number with its command" rule exists to make
// visible, arriving through the number rather than through the command. Re-derived at head, the
// headline is 175 characters: the rename cut five, and `Node.js / TypeScript` → `Node.js · TypeScript`
// cut none. Run from the repo root:
//   node -e "const s=require('fs').readFileSync('apps/fed/src/data/profile.ts','utf8');const b=s.split('headline: {')[1].split('},')[0].split('pt:')[0];const en=[...b.matchAll(/'([^']*)'/g)].map(m=>m[1]).join('').replace('{{years}}','18');console.log(en.length)"
// Nothing pins it — the command is the falsifier, not a test — so re-run it on any edit that touches
// the headline. A figure beside its own refuting command is worse than no figure: it reads as checked.
//
// TWO THINGS ABOUT THE FIGURE THAT LIVE NOWHERE ELSE. The first CHANGED with the rename and the second
// did not:
//   · the `accDescr` used to carry the strict form and describe the brackets in words, because
//     parentheses are ambiguous when spoken — a deliberate asymmetry between what a non-sighted reader
//     met and what a sighted one did. With one rendering there is nothing left to describe, and the two
//     readers now meet the same words. Nothing pins that beyond the file-level check below.
//   · the figure's `centre:` line is pinned by NOTHING, and the pipe is why. It reads
//     `centre: Context & Harness | Engineering`, and that line break means no bare-form pattern here can
//     ever match it, in any rendering — so stripping the qualifier tomorrow stays green. An honest gap,
//     stated rather than implied, and one this rename did not close.

// Surfaces are read as SOURCE rather than imported as values, because what is asserted is the
// authored TEXT — including the comments around it, which is where a superseded term most often
// survives a find-and-replace. `profile.ts` is read the same way for the same reason: its comments
// carry the vocabulary history and are exactly where the bare form would linger.
//
// The third element is the surface's OWN bare-form pattern. It is a tuple rather than a flag so that
// reading the list answers "which rendering is legal here" per row, with no default to look up.
//
// EVERY ROW CARRIES THE SAME PATTERN TODAY, and the tuple is kept anyway. That is a fact about the
// current copy — one rendering, everywhere, since #593 retired the prose affordance — and not about the
// mechanism. Collapsing the column to a shared constant would be the tidy-up that has to be undone the
// next time one surface earns a rendering the CV must not have, which has already happened once.
const SURFACES: ReadonlyArray<[string, string, RegExp]> = [
  ['profile.ts', profileSrc, BARE_UNPREFIXED],
  ['architecture.en.md', architectureEn, BARE_UNPREFIXED],
  ['architecture.pt.md', architecturePt, BARE_UNPREFIXED],
  // The banner copy itself carries no form of the practice name at all — the LinkedIn headline sitting
  // beside the cover already does, and the same words twice on one screen is one sentence stuttering.
  // What this row guards is the edit a month from now that decides the banner should say it after all.
  ['banners.mjs', bannersSrc, BARE_UNPREFIXED],
];

// THE ONE SENTENCE ON THOSE TWO SURFACES THAT STILL MAY NOT PARENTHESISE, AND WHY IT IS PINNED APART.
// The affordance above is granted per FILE, so it necessarily covers the closing paragraph too — and
// that paragraph is where the essay stops describing the term and CLAIMS it: "Context & Harness
// Engineering is the claim I am making". The `toContain(CURRENT)` assertion does not cover this —
// `accDescr` further up carries a plain occurrence, so a drift confined to the claim sentence would
// ship green.
//
// THE AFFORDANCE IT WAS PINNED APART FROM IS GONE (#593), AND THIS ARM STAYS. Its original argument was
// that a per-FILE allowance necessarily reached the one sentence that must not parenthesise. With the
// allowance retired that argument is spent — and the arm's actual work never depended on it: it pins
// that THIS sentence, specifically, renders the term, which no file-level check can say.
//
// ANCHORED ON THE CLAUSE, NOT ON A LINE NUMBER: this page is being restructured (#448), and a
// positional anchor would silently start guarding a different sentence. The clause is distinctive per
// edition, and its own presence is asserted first — an anchor that stops matching must redden as a
// missing anchor rather than pass as a satisfied one.
const CLAIM_CLAUSE: ReadonlyArray<[string, string, RegExp]> = [
  ['architecture.en.md', architectureEn, /is the claim I am making/],
  ['architecture.pt.md', architecturePt, /é a afirmação que eu faço/],
];

// AND THE SENTENCE THAT INTRODUCES THE TERM — the same defect class as `CLAIM_CLAUSE`, from the other
// side. `SURFACES` only forbids a BARE form on these two files, and `toContain(CURRENT)` is satisfied by
// the `accDescr` further down, so the opening sentence — the one occurrence a reader of this page meets
// FIRST — was guarded by nothing: deleting the term from it, or changing it in one edition only, both
// shipped green. The second is the one that matters most, since a suite whose purpose is cross-surface
// consistency was reporting consistency while the two editions diverged.
//
// UNTIL #593 THIS ARM PINNED THE PARENTHESISED RENDERING HERE AND THE STRICT ONE AT THE CLAIM SENTENCE,
// and the pair was the whole point: two sentences on one page, deliberately rendered differently, each
// pinned so neither drifted into the other. The affordance is retired, so both arms now pin the same
// rendering. The arm is KEPT rather than folded into the file-level check because that check is
// satisfied by any one occurrence anywhere on the page; what this says is that this sentence is one.
//
// SAME ANCHOR DISCIPLINE AS ABOVE, for the same #448 reason, and stated once there rather than twice:
// the anchor's presence and uniqueness are asserted FIRST, so a reworded opening fails as a moved anchor
// rather than passing as a satisfied one; emphasis markers are stripped rather than matched; and the
// assertion is on the text ADJACENT to the anchor, not on a line number.
//
// THE ANCHOR IS PER EDITION, not a shared phrase. The two editions are written, not translated — they
// share no clause — and assuming they did has already cost this page one round. It SHORTENED in #593:
// it read `a loop built on AI-DLC & ` until the opening sentence stopped joining the two terms with an
// ampersand, which the practice's own name now contains.
const OPENING_CLAUSE: ReadonlyArray<[string, string, RegExp]> = [
  ['architecture.en.md', architectureEn, /a loop built on /],
  ['architecture.pt.md', architecturePt, /um loop construído sobre /],
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

  // THE PATTERN HAS TO STILL DISCRIMINATE, and reading it never proves that. A pattern that accepted
  // every rendering would make the assertion above a tautology and stay green on the day the term is
  // reverted — the exact failure this file was written to stop, arriving through the pattern instead of
  // through the term. So it is exercised against literals here, in both directions. This arm carried
  // the retired affordance until #593 and it is REPOINTED rather than deleted: it is the only thing in
  // the file that would catch a lookbehind widened until it permits everything.
  it('the strict pattern accepts exactly one rendering', () => {
    // It still catches a genuinely bare occurrence…
    expect('a loop built on Harness Engineering').toMatch(BARE_UNPREFIXED);
    // …and accepts the current rendering, which is the one it was repointed at.
    expect('a loop built on Context & Harness Engineering').not.toMatch(BARE_UNPREFIXED);
    // THE SUPERSEDED TERM IS NOW A FAILURE ON EVERY SURFACE, and this is what the repoint bought that
    // no surface-scoped exception could have: a revert to the 2026-08-02 name reddens here rather than
    // passing as a legal prefix.
    expect('a loop built on Agent Harness Engineering').toMatch(BARE_UNPREFIXED);
    // And so is a bracketed qualifier, in either the retired spelling or a new one.
    expect('AI-DLC & (Agent) Harness Engineering').toMatch(BARE_UNPREFIXED);
    expect('a loop built on (Context &) Harness Engineering').toMatch(BARE_UNPREFIXED);
  });

  it.each(CLAIM_CLAUSE)('%s renders the term in the sentence that claims it', (_name, src, clause) => {
    // The anchor first, and exactly once. If #448's restructuring reworded or duplicated the clause,
    // this fails as "the anchor moved" instead of quietly guarding nothing or guarding the wrong one.
    expect(src.match(new RegExp(clause.source, 'g')) ?? []).toHaveLength(1);

    // Then the rendering immediately before it. Emphasis markers are stripped rather than matched, so
    // the assertion survives the term losing its bold, and any other rendering fails — a bracketed
    // qualifier does not END with the current form, and neither does a superseded name.
    const preceding = src.slice(0, src.search(clause)).replace(/\*/g, '').trimEnd();
    expect(preceding.endsWith(CURRENT)).toBe(true);
  });

  it.each(OPENING_CLAUSE)('%s renders the term in the sentence that introduces it', (_name, src, clause) => {
    // The anchor first, and exactly once — a reworded or duplicated opening reddens here, as an anchor
    // that moved, before anything is asserted about the term itself.
    const hits = src.match(new RegExp(clause.source, 'g')) ?? [];
    expect(hits).toHaveLength(1);

    // Then the rendering immediately after it. A superseded term and a deleted one both fail: neither
    // STARTS with the current form. Asterisks are stripped so the assertion survives the term gaining or
    // losing its bold, exactly as `CLAIM_CLAUSE` does on the other side of its anchor.
    // The `?? ''` is unreachable: the length assertion above aborts the test when the anchor is
    // missing. It is written rather than a `!` because this app's tsconfig checks indexed access, and
    // the first version of this line typechecked-failed while the suite passed — the exact asymmetry
    // the header of this file was written about.
    const start = src.search(clause) + (hits[0] ?? '').length;
    const following = src.slice(start, start + 80).replace(/\*/g, '').trimStart();
    expect(following.startsWith(CURRENT)).toBe(true);
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
// below is transcribed from `.brand/surfaces.md`'s **2026-08-28** block (it was the 2026-08-27 block
// until #566 shortened the line), which records copy the site
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
// 2026-08-28 block for `2023-04` — and NOT derived from `profile.ts`. An expectation built from the file it guards passes unconditionally and reading it
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
    // SHORTENED ON #566: the trailing personal-platforms clause came OUT of the `description`, on the
    // owner's own reading — «esse paragrafo do pessoal nao deveria estar dentro do work experience,
    // pode dar a impressao errada». It is not relocated anywhere in `profile.ts`; `/architecture`
    // already carries it («o site tem a area arquitetura ja» · «nao precisamos colocar no perfil»).
    // Transcribed from `.brand/surfaces.md`'s 2026-08-28 block, like every other line in this table.
    "Application-modernization and new digital-platform launch programs — microservices, full-stack web, smart TVs and native mobile. Leading the implementation: solution architecture, AWS infrastructure and the technical direction of the build. The launches: a custom cloud-native replacement for a SaaS streaming platform, native across five platforms plus Web, and — as tech lead — an upstream operational-monitoring platform on an oil & gas operator's AWS landing zone.",
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
