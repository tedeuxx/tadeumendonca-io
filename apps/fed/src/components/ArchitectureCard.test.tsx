import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { ArchitectureCard, ARCHITECTURE_PUBLISHED } from './ArticlesSection';
import { renderWithLocale } from '../test-utils';
import { translate } from '../i18n/messages';
import { dateLocale, type Locale } from '../i18n';

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
