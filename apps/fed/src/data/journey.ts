// The personal journey photographs on /me (#127).
//
// WHY ITS OWN MODULE AND NOT `profile.ts`. Two reasons, and only the second one survives this slice.
// The near-term one: #416 (the role rename) is open against `profile.ts` — open rather than in flight,
// since it carries no `ready` label and has no PR at the time of writing — and a second slice editing the
// same file buys a conflict for nothing. The lasting one is the reason this file will still be here after
// that lands — `profile.ts` is the CV, and the CV is the thing `/cv.pdf` is PRINTED from. Everything in it
// is a claim a recruiter reads on paper, and these five photographs are kept OUT of that data so the
// two-page budget in `e2e/cv-pdf.spec.ts` never depends on decoration. They are suppressed in the print
// edition through `data-print="hide"` (see `CVSection`), which is the owner's ruling of 2026-08-25 and the
// reason the printed CV is unchanged by the layout that renders them.
//
// WHAT THIS PARAGRAPH USED TO CLAIM, AND WHY IT IS CORRECTED RATHER THAN DELETED (#516 slice 2b). It read
// that those four "carry no date, no employer, no title" and that putting them among the credentials
// "would invite the next reader to treat a photograph as a credential". The first half is now FALSE on the
// web edition and the second half describes what the layout deliberately does: each frame renders inside
// the dated, employer-headed experience entry its `engagement` names, so it inherits a date, an employer
// and a title by placement. That is a cost the owner accepted knowingly — `product-lead` stated it as
// finding 7 on #516 ("they stop being rapport and become evidence — and evidence is judged"), and the
// answer to it is not a disclaimer but the attribution machinery below: an authored, sourced, checkable
// key, refused at module load if it resolves to anything other than exactly one entry. A future reader
// finding the old sentence in git history has not found a rule that was broken; they have found the rule
// this one replaced.
//
// SHAPE: modelled on `library.ts` — the FACTS (which file) authored once with no locale, and the
// reader-facing prose leaves typed `Record<Locale, string>` so a missing translation is a COMPILE error.
// That is the contract `catalog.ts` lacked when it served Portuguese on `/en/portfolio` for three days
// (#235), and it matters more here than there: `alt` is the ONLY thing a reader who cannot see the
// photograph gets, so an untranslated one is not a cosmetic defect.
//
// THE SET IS THE OWNER'S; THE ORDER OF THIS ARRAY NO LONGER REACHES A READER (#516, ruling 2026-08-25).
// He approved the first four photographs (#127, 2026-08-25, "de acordo") and named the fifth himself
// (#548, 2026-08-27), and substituting or adding one is an owner decision rather than an implementation
// one, because what was approved was these photographs rather than a category. THE FIFTH IS THE PROOF OF
// THAT RULE RATHER THAN AN EXCEPTION TO IT: two other candidates from the same source folder were offered
// to him and declined, so the file below is his answer and not a search result.
//
// The SEQUENCE was also his decision and it has lost its object: it was an order of
// reading for a strip — the craft, the work, the chapter, the place, deliberately not chronological
// (2020, 2020, 2022, 2022) — and the strip stopped existing when each frame moved inside the experience
// entry its `engagement` names. The entries have an order already, newest first because it is a CV, and
// the frames inherit it. Nothing here reverses that decision; the thing it governed is gone, which is why
// `journey.test.ts` locks the SET and no longer locks the sequence. Keep authoring this array in a
// sensible order anyway — it is what a reader of this file meets — but do not treat it as a guarantee.
//
// THOSE FOUR YEARS ARE A NOTE TO WHOEVER EDITS THIS FILE. THEY ARE NOT A RULE, AND THEY CANNOT CONTRADICT
// AN `engagement` BELOW (#516, owner ruling 2026-08-25). They are file facts; no reader ever meets one,
// because no surface prints a date for these photographs. The case that forced this note is
// `journey-aws-summit.jpg`, recorded above as 2022 and attributed by the owner to a role that starts
// 2023-04. It looked like a conflict, so it was MEASURED on the original at full resolution rather than
// argued: the backdrop reads `aws SUMMIT SÃO PAULO` and nothing else — no year — and the badge carries
// his name, `AWS` and the category `Funcionário`, with no date. In the published 660px grayscale
// derivative the badge is illegible entirely. THE FRAME CARRIES NO DATE, SO NOTHING IN IT SUSTAINS OR
// CONTRADICTS A PLACEMENT, and placement is therefore editorial by construction — the owner's, not
// derivable. A future reader who reads 2022 against a 2023 placement has not found an error. Keep the
// years, because they are useful to whoever edits; keep this paragraph with them, because without it the
// years read as a rule.
//
// ATTRIBUTION IS AUTHORED, SOURCED TO THE OWNER, AND NEVER DERIVED (#516, 2026-08-25). WHICH ENGAGEMENT A
// FRAME BELONGS TO is his answer, per frame, recorded as data in `engagement` below — not derived from
// date proximity, and not derived from what is visible in the frame. BOTH DERIVATIONS PRODUCE A FALSE
// ATTRIBUTION, and that is measured rather than feared: for `journey-home-office.jpg` — April 2020, two
// months before `profile.ts` starts Globo at 2020-06 — nearest date lands on Globo, and so does the
// content of the frame (a monitoring dashboard, against a Globo entry whose highlights are an
// observability platform). The owner places it at Accenture. Both available heuristics were wrong at
// once, on the same frame. `journey-sticker-lid.jpg` is the other half of the argument: NOTHING IN THIS
// REPOSITORY COULD HAVE PLACED IT AT ALL — every metadata segment is stripped from the committed bytes,
// which `scripts/photo-assets.test.mjs` proves — and he placed it at Globo.
//
// HIS ANSWERS, VERBATIM, BECAUSE THE KEYS BELOW ARE A NORMALISATION OF THEM AND NORMALISATION LAUNDERS
// PROVENANCE (#516 slice 2a). `engagement` is now a `{ company, start_date }` pair that matches
// `profile.ts` exactly, which is what makes the attribution CHECKABLE — and the cost of that shape is
// that this file no longer carries the owner's own words as data. It carries them here instead, and this
// paragraph is the only place they exist in the repository:
//
//   2026-08-25, the four frames:
//     "home office para a accenture, docker com notebook globo, corredor corporativo aws,
//      aws summit senior delivery consultant"
//
//   2026-08-25, closing the two employer-level ambiguities the pair had to resolve:
//     "na accenture coloca no 2015-2020"
//     "aws proserve do corredor eu falei para a entrada de caa, a do delivery consultant falei a foto
//      do aws summit"
//
//   2026-08-27, the fifth frame (#548), placing it before it existed as a file:
//     "vi que preciso de uma foto para Systems Integration Analyst"
//     "eu colocaria a foto em manila"
//     "tinah uma foto na frente do predio da accenture"
//
// THE FIFTH IS THE STRONGEST CASE THIS FILE HAS FOR "NEVER DERIVED", and it is worth stating because it
// is the one frame where a derivation would have looked plausible. Its filename carries a 2021 stamp
// (an export date from an editing app, not a capture date) and NOTHING in the frame carries a year —
// nearest-date lands it on the AWS ProServe entry, four employers away from where he put it. He named
// the ROLE first and the photograph second, which is the only order in which this attribution is his.
//
// Read the keys against those three sentences: `{ 'Accenture', '2015-01' }` is *na accenture no
// 2015-2020*; the corridor at `2021-01` is *a entrada de caa* (Cloud Application Architect); the Summit
// at `2023-04` is *senior delivery consultant*. A reviewer holding his sentences can verify every key on
// sight, which is the whole reason the key is a legible pair rather than an opaque id — see ADR-0050.
//
// THE JOIN, AND THE DIRECTION IT MUST KEEP (#516 slice 2a, ADR-0050). `engagement` is a natural key into
// `profile.ts`'s experience array: `{ company, start_date }`, because `start_date` is unique across all
// five entries while `company` is not — `Accenture` names two and the AWS ProServe string names two.
// `assertJourneyShape` resolves every key at module load and REFUSES a key matching zero entries, a key
// matching more than one, and two frames landing on the same entry.
//
// THE DEPENDENCY EDGE IS ONE-WAY AND MUST STAY SO: `journey.ts` imports `profile.ts`, and `profile.ts`
// must NEVER import `journey.ts`. The reverse edge would put a photograph's placement into the module
// `/cv.pdf` is printed from, which is the leak the first paragraph of this file exists to prevent,
// arriving from the other direction.
//
// TWO HAZARDS, NAMED RATHER THAN DISCOVERED. The AWS employer string carries a U+2014 EM DASH; spelling
// it with a hyphen produces a key that matches zero entries, so the mistake is a RED BUILD and never a
// wrong attribution — the failure direction we want, and the reason the string is written once below.
// And the duplication is real: two files now carry the same employer strings, so a correction in
// `profile.ts` reddens this module until it follows. That is stated as a bad consequence in ADR-0050
// rather than mitigated, because the alternative — resolving by anything softer than exact equality —
// is the derivation this whole slice exists to forbid.
//
// ~~THE LAYOUT IS FINISHED AT FOUR, AND THE BUDGET IS A CONSTRAINT RATHER THAN A CAPACITY. Five experience
// entries carry four frames, so one entry carries none — which is correct rather than a gap: a frame is a
// figure an entry MAY carry, not a slot every entry must fill, and nothing in the markup announces an
// absence — though the two-track layout is conditional on the frame (#516 slice 2c), so at `md` and up a
// photoless entry stays a single track and a reader comparing rows can infer the absence from the
// alignment even though no markup states it. Do not read the empty entry as an invitation to fill it.~~
//
// STRUCK BY THE OWNER, #548 (2026-08-27): *"vi que preciso de uma foto para Systems Integration Analyst"*.
// Struck rather than deleted because it was not wrong about the LAYOUT — it was a statement about a set
// he had approved, and he changed the set. Five entries now carry five frames, so the sentence it was
// really defending ("do not read the empty entry as an invitation") has no empty entry left to defend.
//
// WHAT SURVIVES IT, AND IT IS THE HALF A FUTURE READER WILL BE TEMPTED TO DELETE: the two-track layout is
// still CONDITIONAL on the frame (`CVSection`'s `JourneyFigure` returns `null` for an absent one), and
// that branch is now unexercised by production data. It is not dead code — a sixth experience entry, or a
// frame withdrawn, reaches it immediately — and `CVSection.test.tsx` exercises it in both directions with
// its own fixtures. Do not "simplify" it on the grounds that every entry currently has a photograph.
//
// THE BUDGET IS STILL A CONSTRAINT RATHER THAN A CAPACITY, and the arithmetic behind that wording lives in
// ADR-0048's 2026-08-25 amendment, deliberately NOT restated here — a measured number copied into a second
// place is a number that goes stale in one of them silently. What IS enforced here is the total payload
// bound in `scripts/photo-assets.test.mjs`, which this frame consumed 77 KB of. There is still no `<= 5`
// assertion anywhere, on purpose: the set lock in `journey.test.ts` already refuses a sixth frame, and a
// second guard on the same fact would be a second thing to keep in step.
//
// PROVENANCE AND REVERSIBILITY. The sources live outside this repo, in the owner's own library, and are
// deliberately not committed: what ships is a 660x880 grayscale derivative with every metadata segment
// removed. `scripts/photo-assets.test.mjs` proves the EXIF absence against the committed bytes, which is
// the half that can be checked here; the originals staying out of git is the half that cannot, and is a
// process fact recorded in the PR rather than a property of this file.
//
// THE FIFTH FRAME'S DERIVATIVE IS THE ONLY ONE THAT LOST CONTENT, and it is named here because a reader
// comparing it with the original would otherwise think something went wrong. The source is SQUARE
// (1152x1152); the set's 3:4 portrait ratio is locked by `journey.test.ts`, so 25% of the width had to
// go. The window is off-centre (`crop=864:1152:230:0`) because a centred one bisects a face at the right
// edge — the geometry is a consequence of the ratio lock, not an editorial decision about who is in the
// photograph, and it dropped two people from the left of the SOURCE frame. THAT COUNT IS SOURCE-SIDE and
// is not checkable here, since the source is not committed. The published count has its own base and is
// checkable: six full faces plus a seventh the crop edge CUTS rather than removes — taken on the committed
// bytes in `journey.test.ts`'s third-party paragraph, with the command that re-takes it. The two counts
// count different things and must not be netted against each other.
import { LOCALES, type Locale } from '../i18n';
import { photoFor, type PhotoAsset } from './photos';
import { profileSource } from './profile';

/**
 * The natural key into `profile.ts`'s experience array — see the JOIN paragraph above and ADR-0050.
 *
 * BOTH FIELDS, NOT EITHER. `company` alone is ambiguous by measurement (`Accenture` names two entries,
 * the AWS ProServe string names two); `start_date` alone is unique today and is unique by accident
 * rather than by rule — two roles beginning the same month is an ordinary thing for a CV to record.
 * The pair is what carries the meaning a reader of the owner's own sentence can check.
 *
 * SPELLED EXACTLY AS `profile.ts` SPELLS IT. Resolution is exact string equality, never normalised,
 * trimmed-and-compared or matched case-insensitively: every softening turns a red build into a
 * plausible-looking wrong answer, and a wrong answer here is a false attribution inside a work-experience
 * entry.
 */
export interface EngagementKey {
  company: string;
  start_date: string;
}

/**
 * One engagement pair, flattened to a single comparable string — the ONE spelling of the join.
 *
 * NUL AS THE SEPARATOR, WRITTEN AS AN ESCAPE RATHER THAN AS A RAW BYTE: it is the one character neither an
 * employer name nor a `YYYY-MM` can contain, so two distinct pairs can never collapse into one key and read
 * as a duplicate that is not one.
 *
 * EXPORTED, AND THAT IS THE POINT (#516 slice 2b). `assertJourneyShape` uses it to refuse two frames on one
 * entry, and `CVSection` uses it to decide which entry a frame renders inside. Those two have to agree
 * exactly — the guard's promise is "at most one frame per entry", and a component joining on a different
 * spelling would be checking a different fact than the one that was guarded. Spelled twice, they could
 * drift; spelled once, the guard is about the lookup the layout actually performs.
 */
export const engagementKey = ({ company, start_date }: EngagementKey): string =>
  `${company}\u0000${start_date}`;

/** An entry as AUTHORED: the filename, plus the two prose leaves. */
export interface JourneyEntry {
  /** Root-relative, and it must be a key of the photograph registry — see `assertJourneyShape`. */
  src: string;
  /**
   * WHICH EXPERIENCE ENTRY THIS FRAME IS FROM — the owner's own answer, normalised into the pair that
   * `profile.ts` can be joined on, with his sentences kept verbatim in the ATTRIBUTION paragraph at the
   * top of this file. That paragraph also carries the measurement that makes "never derived" a rule
   * rather than a preference.
   *
   * IT RESOLVES TO EXACTLY ONE ENTRY, AND THAT IS CHECKED AT MODULE LOAD, NOT HOPED FOR. Slice 1
   * authored an employer NAME here and the shape could not carry the answer: three of the four strings
   * matched no entry at all and the fourth matched two. See `assertJourneyShape`.
   *
   * NOT LOCALE-KEYED, and deliberately not a prose leaf. Both fields are facts `profile.ts` authors once
   * and shares across editions — employers and dates never localize — so a `Record<Locale, …>` here would
   * invite someone to translate one edition and make the two disagree on a FACT, which is the one thing
   * that file says can never happen.
   *
   * AND IT IS NOT READER-FACING COPY. Nothing renders it: `CVSection` places the frame inside the
   * experience entry this key names, and that entry's own heading is what a reader reads. This is the
   * placement key, not the label — rendering it would publish the attribution twice, once as prose
   * nobody reviewed.
   */
  engagement: EngagementKey;
  /**
   * What is in the frame, for a reader who never sees it.
   *
   * NOT the same string as `caption`, and the distinction is the one `PhotoFigure` already draws: `alt`
   * describes the frame, `caption` says what the photograph is doing on the page. Collapsing them gives a
   * screen-reader user the editorial line and none of the picture.
   */
  alt: Record<Locale, string>;
  /** What the photograph is doing here — reader-facing prose, authored per locale. */
  caption: Record<Locale, string>;
}

/** An entry as RENDERED: the same prose, with the filename resolved to its measured asset. */
export interface JourneyPhoto extends Omit<JourneyEntry, 'src'> {
  photo: PhotoAsset;
}

/**
 * The two editions of one prose leaf, written once each — `pt` first, then `en`.
 *
 * IT IS NOT SUGAR, AND IT IS NOT TASTE. The four authored entries below repeat the same record shape four
 * times, and adding a fifth field to each of them (`engagement`, #516) pushed that repetition past
 * SonarCloud's copy-paste threshold: the quality gate reddened on `new_duplicated_lines_density` — 3.4%
 * against a 3% bound — with the four new lines landing inside a block the scanner already considered
 * duplicated. Naming the shape once is the fix that REMOVES the repetition; raising the bound is the fix
 * that hides it, and this repo's gate policy says not to take the second one.
 *
 * THE ANNOTATED RETURN TYPE IS THE CONTRACT, and it is written out rather than inferred on purpose:
 * `Record<Locale, string>` built from `{ pt, en }` means adding a third locale turns THIS ONE LINE into a
 * compile error — which is precisely the property the SHAPE paragraph at the top of this file leans on.
 * Letting TypeScript infer `{ pt: string; en: string }` would give the same runtime value and lose it.
 *
 * ARGUMENT ORDER IS `pt`, `en` — the order the record was written in before this helper existed, and the
 * order every call below reads in. A swapped pair stays visible on sight, since one string is Portuguese
 * and the other is not; that is the same protection the object literal gave, no more and no less.
 */
const prose = (pt: string, en: string): Record<Locale, string> => ({ pt, en });

/**
 * The AWS employer string, spelled ONCE — and the reason it is a constant is the em dash, not the length.
 *
 * It is U+2014, and `profile.ts` authors it that way on both of its ProServe entries. Written inline
 * twice below it would be two chances to type a hyphen, and a hyphen produces a key matching zero
 * entries rather than a visibly different string. Here the mistake can only be made once, and
 * `assertJourneyShape` catches it either way.
 */
const AWS_PROSERVE = 'Amazon Web Services — Professional Services';

/**
 * One engagement key, named once — the `prose` helper's argument, applied to the other repeated shape.
 *
 * SAME REASON AS `prose`, MEASURED THE SAME WAY. Slice 1 added a fifth FIELD to four repeated literals
 * and tripped SonarCloud's `new_duplicated_lines_density` (3.4% against a 3% bound); slice 2a turns that
 * field into a two-field OBJECT in each of the same four literals, which is strictly more of the shape
 * the scanner already flagged. Naming it once REMOVES the repetition; raising the bound would hide it,
 * and this repo's gate policy says not to take the second one.
 *
 * ARGUMENT ORDER IS `company`, `start_date` — the order `profile.ts` authors them in, and the order the
 * owner's own sentences read in ("na accenture coloca no 2015-2020"). A swapped pair is not a silent
 * defect: a date is not an employer name, so it matches zero entries and the build goes red by name.
 */
const at = (company: string, start_date: string): EngagementKey => ({ company, start_date });

/**
 * Everything about an authored entry that TypeScript cannot say, checked at module load.
 *
 * MODELLED ON `assertLibraryShape`, including the part that matters most: it reads its ARGUMENT and never
 * the shipped array, so the test can feed it a bad entry and watch it throw. An assertion that can only be
 * exercised through the real, correct data is an assertion nobody has ever seen fail — which is this
 * workspace's recurring defect, not a hypothetical one.
 *
 * IT TAKES THE EXPERIENCE ARRAY AS AN ARGUMENT for the same reason it takes the entries: so a test can
 * feed it a `profile.ts` that has drifted and watch each join failure fire, without editing the real CV.
 *
 * What it catches that the type system cannot:
 *
 *   1. A `src` that is not in `photos.json`. The registry is what supplies `width`/`height`, so an
 *      unregistered file renders with no reserved box — cumulative layout shift on every tile, which is
 *      the exact failure the registry was built to remove. `photoFor` returns `null` rather than guessing,
 *      by design, and a `null` the component branched on would degrade to three tiles silently.
 *   2. A blank prose leaf. `Record<Locale, string>` makes a MISSING locale a compile error and has nothing
 *      at all to say about `''`, and an empty `alt` is worse than a missing one: it declares the image
 *      decorative to a screen reader.
 *   3. A missing or blank `engagement` field. An entry with no authored attribution is an entry a later
 *      layout would have to place by GUESSING, and both guesses available — nearest date, and what is in
 *      the frame — were measured wrong on the same frame (#516).
 *   4. AN `engagement` MATCHING NO EXPERIENCE ENTRY — the drift case. `Globo.com` renamed, a role's
 *      `start_date` corrected, the AWS em dash retyped as a hyphen: each one silently orphans a frame,
 *      and a layout keyed on the join would then render it nowhere or, worse, somewhere.
 *   5. AN `engagement` MATCHING MORE THAN ONE — the case a bare employer name produced today, before the
 *      key became a pair. Two entries a frame could equally belong to is not a placement.
 *   6. TWO FRAMES ON ONE ENTRY. The layout has no defined behaviour for a second figure inside one
 *      experience block; without this the failure is silent stacking rather than a message.
 *   7. `alt` equal to `caption`. They are two jobs (describe the frame / say what it is doing here), and
 *      collapsing them is the cheap mistake — it looks like less duplication and costs a reader who cannot
 *      see the photograph the whole photograph.
 *
 * 4, 5 and 6 are what make a FALSE ATTRIBUTION UNPUBLISHABLE rather than merely discouraged: they fail
 * the build before a reader can be told the wrong employer.
 */
export function assertJourneyShape(
  entries: readonly JourneyEntry[],
  experience: readonly EngagementKey[],
): void {
  // Which frame already claimed each entry — the state case 6 needs, and the reason this is a `Map`
  // rather than a `Set`: the message names BOTH frames, so the reader does not have to go and find the
  // other one.
  const claimed = new Map<string, string>();

  for (const { src, engagement, alt, caption } of entries) {
    if (!photoFor(src)) {
      throw new Error(`journey: ${src} is not in the photograph registry (src/data/photos.json)`);
    }
    if (!engagement?.company?.trim() || !engagement?.start_date?.trim()) {
      throw new Error(`journey: ${src} has no authored engagement`);
    }

    const { company, start_date } = engagement;
    const matches = experience.filter(
      (item) => item.company === company && item.start_date === start_date,
    );
    if (matches.length === 0) {
      throw new Error(
        `journey: ${src} names an engagement no experience entry matches (${company}, ${start_date})`,
      );
    }
    if (matches.length > 1) {
      throw new Error(
        `journey: ${src} names an engagement matching ${matches.length} experience entries (${company}, ${start_date})`,
      );
    }

    // `engagementKey`, and NOT a second spelling of the same join (#516 slice 2b). The NUL-separator
    // argument moved to that function's own comment, with the code it argues about.
    const key = engagementKey(engagement);
    const alreadyClaimedBy = claimed.get(key);
    if (alreadyClaimedBy) {
      throw new Error(
        `journey: ${src} and ${alreadyClaimedBy} both claim the experience entry (${company}, ${start_date})`,
      );
    }
    claimed.set(key, src);

    for (const locale of LOCALES) {
      if (!alt[locale]?.trim()) throw new Error(`journey: ${src} has no ${locale} alt text`);
      if (!caption[locale]?.trim()) throw new Error(`journey: ${src} has no ${locale} caption`);
      if (alt[locale] === caption[locale]) {
        throw new Error(`journey: ${src} reuses its ${locale} caption as alt text`);
      }
    }
  }
}

/**
 * The five photographs the owner approved. A SET — the order this array is written in is not part of
 * what was approved any more (#516 slice 2b).
 *
 * IT READ "in the approved order" UNTIL THIS SLICE, and that line outlived the rule it described. The
 * sequence WAS his decision — the craft, the work, the chapter, the place — and it was a decision about
 * how those photographs read together at the end of the page; it lost its object when each frame moved
 * inside the experience entry its `engagement` names. `journey.test.ts` is what this now agrees with:
 * its set lock compares this array against the approved filenames SORTED on both sides, so it refuses a
 * substituted, added or missing frame and asserts nothing whatever about the sequence. Reordering these
 * four breaks no test and changes nothing a reader meets — so do not preserve this order as though it
 * were load-bearing, and do not read a reorder as damage.
 *
 * Every string below is reader-facing copy on a hiring surface, so it is `product-lead`'s to rule on and
 * not the builder's to rewrite. What the builder owns is that both editions exist and that `alt` and
 * `caption` are different jobs.
 */
const journey: readonly JourneyEntry[] = [
  {
    src: '/photos/journey-sticker-lid.jpg',
    engagement: at('Globo.com', '2020-06'),
    alt: prose(
      'Homem sorrindo atrás da tampa aberta de um notebook coberta de adesivos de ferramentas — Amazon Web Services, Elastic Stack, Terraform, Flutter, npm, VS Code, SonarQube, Docker, Kubernetes, MongoDB, Redis, Python, Android — vestindo uma camiseta com uma baleia carregando contêineres.',
      'A smiling man behind the open lid of a laptop covered in tool stickers — Amazon Web Services, Elastic Stack, Terraform, Flutter, npm, VS Code, SonarQube, Docker, Kubernetes, MongoDB, Redis, Python, Android — wearing a t-shirt of a whale carrying containers.',
    ),
    caption: prose(
      'Meus stacks favoritos na época, colados na tampa.',
      'My favourite stacks at the time, stuck to the lid.',
    ),
  },
  {
    src: '/photos/journey-home-office.jpg',
    engagement: at('Accenture', '2015-01'),
    alt: prose(
      'Homem de óculos em primeiro plano, de lado, com uma escrivaninha atrás: um monitor externo exibindo um painel de monitoramento com gráficos e um notebook aberto exibindo um editor de código em tema escuro.',
      'A man in glasses in the foreground, turned to the side, with a desk behind him: an external monitor showing a monitoring dashboard of charts, and an open laptop showing a dark-theme code editor.',
    ),
    caption: prose(
      'Os últimos meses aqui foram em casa, sem ninguém por perto.',
      'The last months of this one were at home, with nobody around.',
    ),
  },
  {
    src: '/photos/journey-aws-summit.jpg',
    engagement: at(AWS_PROSERVE, '2023-04'),
    alt: prose(
      'Homem de pé diante de um painel liso onde se lê "aws Summit São Paulo", usando um cordão com crachá pendurado no pescoço.',
      'A man standing in front of a plain wall reading "aws Summit São Paulo", a lanyard and badge around his neck.',
    ),
    caption: prose(
      'O evento voltou depois da pandemia. Eu voltei junto — pela primeira vez como funcionário.',
      'The event came back after the pandemic. I came back with it — for the first time as an employee.',
    ),
  },
  {
    // THE FIFTH FRAME (#548), AND THE ONLY ONE THE OWNER IS NOT IN. Every other entry below is a
    // photograph of him; this one is a group in front of the office, and he supplied it for exactly that
    // reason — it is the only thing that exists from 2008–2015. TWO COUNTS, TWO BASES, NEVER MIXED: the
    // SOURCE carries eight colleagues (a source-side fact — the source is not committed, see the
    // provenance paragraph above), and the PUBLISHED 660x880 crop carries seven identifiable presences,
    // six of them full faces and the seventh cut by the left edge — counted on the committed bytes in
    // `journey.test.ts`'s third-party paragraph, which also carries the command that re-takes the count.
    // `alt` describes the published frame, and it therefore has to
    // describe PEOPLE, which is a job none of the other four alt strings has had.
    src: '/photos/journey-manila.jpg',
    engagement: at('Accenture', '2008-03'),
    alt: prose(
      'Grupo de pessoas diante de um prédio de escritórios onde se lê "accenture": cinco em pé na frente — a da ponta esquerda só meio dentro do quadro — e duas outras atrás delas, sorrindo para a câmera; algumas usam crachá pendurado no pescoço, e torres altas fecham o fundo.',
      'A group of people in front of an office building reading "accenture": five standing across the front — the one at the left edge only half in frame — and two more behind them, smiling at the camera; some with badges on lanyards around their necks and tall towers closing the background.',
    ),
    caption: prose(
      'Manila. Esse trabalho me levou até o outro lado do mundo.',
      'Manila. This job took me to the other side of the world.',
    ),
  },
  {
    src: '/photos/journey-corridor.jpg',
    engagement: at(AWS_PROSERVE, '2021-01'),
    alt: prose(
      'Homem de pé no meio de um corredor de escritório longo e vazio, com luminárias circulares e o forro aberto, mostrando dutos e tubulações; portas de elevador à direita.',
      'A man standing in the middle of a long, empty office corridor, circular light fittings overhead and the ceiling opened up to show ducts and pipework; lift doors along the right.',
    ),
    caption: prose(
      'Uma tecnologia que eu admirava e queria usar todos os dias. Aqui o teto estava aberto.',
      'A technology I admired and wanted to use every day. Here the ceiling was open.',
    ),
  },
];

// Checked at module load, exactly as `library.ts` does it: a defect in the authored data fails the build
// and every test that imports it, rather than reaching a reader as a missing box or a silent `undefined`.
//
// `profileSource.experience` and NOT `profile.experience`: the join is on facts — an employer name and a
// date — which the source authors once and shares across both editions, so resolving against a
// locale-resolved edition would key the attribution on a locale for no reason at all.
assertJourneyShape(journey, profileSource.experience);

/**
 * The set, with each `src` resolved to its measured asset.
 *
 * The non-null assertion is safe BECAUSE of the line above and for no other reason — `assertJourneyShape`
 * has already refused every `src` the registry does not know. Written as `!` rather than as a second
 * runtime branch on purpose: a branch here would be unreachable code that no test could cover honestly,
 * and an uncoverable branch is how a suite starts reporting numbers about lines nobody can exercise.
 */
export const JOURNEY_PHOTOS: readonly JourneyPhoto[] = journey.map(
  ({ src, engagement, alt, caption }) => ({
    photo: photoFor(src)!,
    engagement,
    alt,
    caption,
  }),
);

/** One frame as a COMPONENT reads it: the measured asset, the placement key, and one edition's prose. */
export interface JourneyFrame {
  photo: PhotoAsset;
  engagement: EngagementKey;
  alt: string;
  caption: string;
}

/**
 * The set flattened to a single locale — the same shape `resolveProfile` already establishes next door.
 *
 * WHY THE PAGE RESOLVES AND THE COMPONENT DOES NOT (#516 slice 2b). `CVSection` is a pure presentational
 * component: it receives a resolved `Profile` and renders it, and every localized leaf on this page is
 * already flattened before it arrives. Passing `Record<Locale, string>` leaves into it instead would make
 * it the one component on /me that reads the locale context, for no reason but that these prose strings
 * happen to live in a different module.
 *
 * IT RETURNS A NEW ARRAY PER CALL, and that is deliberate rather than careless. Memoizing it would cache
 * two arrays for the lifetime of the process to save mapping five objects on a page that renders once per
 * navigation; the cache would be the more expensive object. If this ever renders in a hot path, measure
 * before adding one.
 */
export const resolveJourney = (locale: Locale): readonly JourneyFrame[] =>
  JOURNEY_PHOTOS.map(({ photo, engagement, alt, caption }) => ({
    photo,
    engagement,
    alt: alt[locale],
    caption: caption[locale],
  }));
