import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { ArchitectureCard } from './ArticlesSection';
import { renderWithLocale } from '../test-utils';
import { translate } from '../i18n/messages';

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

  // THE EMPTY SLOTS, asserted as a WHOLE-TEXT equality rather than four absences. Same reason as above:
  // an absence assertion is satisfied by a card that failed to render, and four of them in sequence stop
  // at the first failure. This single assertion covers the date, the #tag, the takeaway label and the
  // read control at once, and it names what the card IS instead of listing what it is not.
  it.each(['pt', 'en'] as const)('carries the chip, the title, the excerpt and nothing else (%s)', (locale) => {
    render(locale);
    expect(card().textContent).toBe(
      translate(locale, 'architecture.cardTrack') +
        translate(locale, 'architecture.cardTitle') +
        translate(locale, 'architecture.cardExcerpt') +
        translate(locale, 'nav.architecture'),
    );
    // The date slot specifically, by element rather than by text: a `<time>` rendered with an empty
    // value would survive the equality above and still emit a machine-readable publication date.
    expect(card().querySelector('time')).toBeNull();
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
