import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { ArchitectureCard, ARCHITECTURE_PUBLISHED } from './ArticlesSection';
import { renderWithLocale } from '../test-utils';
import { translate } from '../i18n/messages';
import { dateLocale, type Locale } from '../i18n';
import { getAllPosts } from '../lib/content';
// The two records that DATE the section's publication, imported as text so this suite can read the
// date back out of them. `?raw` rather than `node:fs` — the app's tsconfig carries no Node types, so
// `readFileSync` typechecks red while vitest (which does not run tsc) stays green; that exact trap is
// documented at `src/data/vocabulary.test.ts:3`. Out-of-root raw imports are already the idiom here
// (`src/lib/version.ts:15` reads the repo's `VERSION` the same way).
import adr0038 from '../../../../docs/adr/0038-content-distribution-linkedin-and-x.md?raw';
import adr0039 from '../../../../docs/adr/0039-share-campaign-tagging.md?raw';

// The date the card must show, derived from the exported constant rather than typed as a literal: a
// literal here would keep passing after someone edited the constant, which is the one thing this suite
// exists to notice now that the row's POSITION is computed from that same value.
const shownDate = (locale: Locale) =>
  new Date(ARCHITECTURE_PUBLISHED).toLocaleDateString(dateLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// The /architecture teaser card (#450, slice 2) — the object that replaced the band shipped in #461.
//
// It lives in `ArticlesSection.tsx` beside `ArticleRow`, whose class constants it renders, so this suite
// is filed under the card's own name rather than the section's: what is asserted here is the CARD's
// contract (which strings, which control, which slots are empty), and the section's own suite asserts
// where it sits and that no filter can remove it.
const render = (locale: 'pt' | 'en' = 'pt') => renderWithLocale(<ArchitectureCard />, { locale });

const card = () => screen.getByTestId('architecture-card');

describe('ArchitectureCard', () => {
  // BOTH LOCALES, EXPLICITLY. This suite renders at `pt` by default and the card is copy — a pt-only
  // assertion passes on a card whose English edition was never wired at all.
  it.each(['pt', 'en'] as const)('renders the three catalog leaves (%s)', (locale) => {
    render(locale);
    expect(screen.getByText(translate(locale, 'architecture.cardTrack'))).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: translate(locale, 'architecture.cardTitle') }),
    ).toBeInTheDocument();
    expect(screen.getByText(translate(locale, 'architecture.cardExcerpt'))).toBeInTheDocument();
  });

  // THE CONTROL, ASSERTED POSITIVELY AND EXHAUSTIVELY — this is the `articles.read` guard, and its shape
  // is the point. `queryByText('Ler artigo')` toBeNull() is the obvious spelling and the weak one: it
  // passes on a card that renders nothing at all, and the last round's gate found negative arms dying on
  // their first assertion and never reaching the second. So the card's links are enumerated and the list
  // is pinned: exactly two, the title and the control, and the control's name is `nav.architecture`. A
  // control relabelled `articles.read` fails this by NAME, and a third control fails it by COUNT.
  it.each([
    ['pt', 'Arquitetura', '/pt/architecture'],
    ['en', 'Architecture', '/en/architecture'],
  ] as const)('labels its control with the nav key, never with articles.read (%s)', (locale, label, href) => {
    render(locale);
    expect(translate(locale, 'nav.architecture')).toBe(label);

    const links = within(card()).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual([translate(locale, 'architecture.cardTitle'), label]);
    for (const link of links) expect(link).toHaveAttribute('href', href);

    // Said once more against the published string itself, so that a future edition of `articles.read`
    // that happens to read "Arquitetura" could not satisfy the list above.
    expect(label).not.toBe(translate(locale, 'articles.read'));
  });

  // THE SLOTS, asserted as a WHOLE-TEXT equality rather than as a list of presences and absences: an
  // absence assertion is satisfied by a card that failed to render, and a run of them stops at the first
  // failure. This single assertion covers what the card carries AND what it still does not — the #tag and
  // the takeaway label — and it names what the card IS instead of listing what it is not.
  //
  // THE DATE IS IN THE STRING NOW, where it used to be asserted absent. That inversion is the whole of
  // this slice on this file: the row sorts by its publication date, so hiding the key it sorts by would
  // be worse than the pin it replaced.
  it.each(['pt', 'en'] as const)('carries the date, the chip, the title and the excerpt (%s)', (locale) => {
    render(locale);
    expect(card().textContent).toBe(
      shownDate(locale) +
        '·' +
        translate(locale, 'architecture.cardTrack') +
        translate(locale, 'architecture.cardTitle') +
        translate(locale, 'architecture.cardExcerpt') +
        translate(locale, 'nav.architecture'),
    );
  });

  // THE MACHINE-READABLE DATE, by element and attribute rather than by the rendered text above. The text
  // is what a reader sees; `datetime` is what a crawler reads and what the section's own sort compares,
  // so a `<time>` whose attribute drifted from the constant would leave the visible date right and the
  // row in the wrong place. Locale-independent by construction — the attribute is the ISO value.
  it.each(['pt', 'en'] as const)('emits the publication date as a machine-readable <time> (%s)', (locale) => {
    render(locale);
    const time = card().querySelector('time');
    expect(time).not.toBeNull();
    expect(time).toHaveAttribute('datetime', ARCHITECTURE_PUBLISHED);
    expect(time!.textContent).toBe(shownDate(locale));
  });

  // THE HANDLE THE E2E SELECTS THE CHIP ON. `e2e/architecture-card.spec.ts` measures that the chip is
  // whole and inside the viewport at four widths, and it can only find it through this attribute — the
  // chip stopped being the card's only `span` when the date arrived. Pinned HERE because that suite
  // needs a build and a browser: without this assertion, deleting the attribute is a green unit run and
  // a red E2E minutes later, reported as a stale locator rather than as the deletion it is.
  it('gives the chip the handle the E2E selects it by', () => {
    render();
    const chip = card().querySelector('[data-testid="architecture-card-chip"]');
    expect(chip).not.toBeNull();
    expect(chip!.textContent).toBe(translate('pt', 'architecture.cardTrack'));
  });

  // THE CONSTANT AGAINST THE RECORD THAT SETS IT — the assertion that closes a hole the rest of this
  // suite structurally cannot see, and the one that replaced a rule built on a false premise.
  //
  // WHAT WAS HERE BEFORE, and why it had to go rather than be repaired. The old assertion was *every
  // published article is dated at or after the section*, justified as a LAW: "nothing can be published
  // before the site was public, and this constant IS launch day". The constant was launch day because
  // nothing in the repo recorded the section's own publication, so the date was a reasoned decision.
  // It is recorded now (ADR-0038 and ADR-0039, both 2026-08-16), the section turns out to postdate
  // `my-commitment` by three weeks, and the premise of that law is simply false: the section has a real
  // publication date, articles have theirs, and either may be the older. The old rule does not need a
  // weaker threshold — it needed to stop existing, because what it asserted is not true of this corpus
  // and was never true of the world.
  //
  // WHAT THE INVARIANT ACTUALLY IS, therefore: the constant must equal the date this repository RECORDS
  // for the section's publication. That is checkable, it is external to this file, and — unlike every
  // other date assertion in this suite — it does not derive its expectation from the value it checks,
  // which is the property that makes it able to fail at all.
  //
  // THE PROBE IT CLOSES, and it is the gap the last round measured and could not close: set the constant
  // to a WRONG date that still sorts the card second — `2026-08-18T12:00:00.000Z`, between the two
  // published articles and still midday. Every other assertion here stays green (they all derive from
  // the constant), the row stays in position two, the E2E's newest-first and not-first checks both pass.
  // Only this one goes red, and it names the two files that disagree with the edit.
  //
  // A FALSE RED IS POSSIBLE and is accepted deliberately: reword either quoted clause and the pattern
  // stops matching. That failure is LOUD, it names the ADR and the sentence it wanted, and it asks a
  // question worth asking — if the record of the launch date changed, this constant is exactly what
  // should be re-examined. A silent pass on an unmatched pattern would be the strictly worse trade.
  it.each([
    {
      adr: 'docs/adr/0038-content-distribution-linkedin-and-x.md',
      source: adr0038,
      // Wraps across a newline in the file, hence `\s+` rather than a literal space.
      pattern: /`\/architecture` launch pair went out on both surfaces on\s+(\d{4}-\d{2}-\d{2})/,
      clause: 'the `/architecture` launch pair went out on both surfaces on <DATE>',
    },
    {
      adr: 'docs/adr/0039-share-campaign-tagging.md',
      source: adr0039,
      pattern: /amended (\d{4}-\d{2}-\d{2})\*\*[^)]*`\/architecture` launch is tagged/,
      clause: '**amended <DATE>** (`author-post` is exercised — the `/architecture` launch is tagged …)',
    },
  ])('is the publication date $adr records', ({ adr, source, pattern, clause }) => {
    const found = pattern.exec(source);
    expect(
      found,
      `${adr} no longer carries "${clause}" in a form this test can read. Either the clause was ` +
        'reworded (fix the pattern here) or the recorded launch date changed (fix ARCHITECTURE_PUBLISHED).',
    ).not.toBeNull();
    expect(
      found![1],
      `${adr} records the /architecture launch on ${found![1]}, but ARCHITECTURE_PUBLISHED is ` +
        `${ARCHITECTURE_PUBLISHED}. The card's date and its position in the home list both come from ` +
        'that constant, so a value the repo does not record is a date shown to readers that nothing backs.',
    ).toBe(ARCHITECTURE_PUBLISHED.slice(0, 10));
  });

  // AND THE CARD IS NOT THE NEWEST ROW — kept, but as what it now is: a property of the CORPUS, not a
  // law about the world. It is asserted here because `e2e/architecture-card.spec.ts` depends on it
  // (`shape.dates[0].isCard` must be `false`), and that suite needs a build and a browser where this
  // one fails in seconds. It is deliberately NOT justified as "nothing predates the site" any more —
  // that is the false premise the assertion above replaced.
  //
  // THE PROBE IT STILL CLOSES, and the reason it is not merely redundant with the ADR check: set the
  // constant to `2026-08-22T12:00:00.000Z` — newer than every article, still midday so the hour pin
  // below stays green — and the card is the FIRST row of the live home page again, which is the pinned
  // state the un-pin exists to prevent. Both this test and the ADR check catch that one; only this one
  // would catch a future corpus change (an article unpublished, a date corrected) that re-pins the card
  // without anybody touching the constant.
  //
  // WHY IT LIVES IN THIS FILE, not in `ArticlesSection.test.tsx`: that suite mocks `getAllPosts`, so its
  // dates are synthetic and "the card is not first" is FALSE there by construction — one of its tests
  // correctly asserts the card IS first when every mocked article is older. It cannot see the real
  // corpus. This file does not mock the module, so it reads what is actually published.
  it('is not the newest row — at least one published article postdates the section', () => {
    for (const locale of ['pt', 'en'] as const) {
      const posts = getAllPosts(locale);
      // The corpus is the ruler, so an empty one would leave the assertion below vacuous.
      expect(posts.length, 'no articles loaded — this assertion would be vacuous').toBeGreaterThan(0);
      const newer = posts.filter((p) => p.date > ARCHITECTURE_PUBLISHED);
      expect(
        newer.length,
        `no ${locale} article postdates the section (${ARCHITECTURE_PUBLISHED}) — the architecture ` +
          'card would be the first row of the home page, which is the pin the un-pin removed. Newest ' +
          `article: ${posts[0]?.title} (${posts[0]?.date}).`,
      ).toBeGreaterThan(0);
    }
  });

  // THE TIME OF DAY IS PART OF THE DECISION, so it is pinned. `toLocaleDateString` renders in the
  // READER'S zone, so a `T00:00:00Z` value prints as the day BEFORE to every reader west of Greenwich —
  // including the owner, at UTC-3, and including the rendered date this suite asserts above.
  //
  // No instant is safe in EVERY zone (UTC+14 needs hour < 10, UTC-12 needs hour >= 12 — contradictory),
  // so 12:00Z is the maximal-margin choice rather than a guarantee: it holds from UTC-12 through UTC+11,
  // which covers both editions' readerships. Pinned exactly, because "near midday" is the kind of
  // constraint that erodes one edit at a time.
  it('is authored at midday UTC, so the rendered calendar day does not shift west of Greenwich', () => {
    expect(new Date(ARCHITECTURE_PUBLISHED).getUTCHours()).toBe(12);
  });

  // The card is about WHAT THE READER GETS, never about who built it — the Hero's published body ends
  // higher on this same page with "quem escreve isso é consequência, não o ponto".
  it.each(['pt', 'en'] as const)('does not put the owner on the card (%s)', (locale) => {
    render(locale);
    expect(card().textContent).not.toMatch(/Tadeu/i);
  });

  // No word whose truth depends on the date (DECISION 1 on #450): it is what buys the card a life with
  // no retirement step, and nothing in this repo would ever raise a stale "new".
  it.each(['pt', 'en'] as const)('carries no time-bound word (%s)', (locale) => {
    render(locale);
    expect(card().textContent).not.toMatch(/\b(novo|nova|lançamento|recém|agora|new|just shipped|launch)\b/i);
  });
});
