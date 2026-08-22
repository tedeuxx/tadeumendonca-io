import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import type { BlogPost } from '../lib/content';
import { renderWithLocale } from '../test-utils';
import { translate } from '../i18n/messages';

const { getAllPosts } = vi.hoisted(() => ({ getAllPosts: vi.fn() }));
vi.mock('../lib/content', () => ({ getAllPosts }));

import { ArticlesSection, ARCHITECTURE_PUBLISHED } from './ArticlesSection';

// One day either side of the card's own publication date, derived from the constant rather than typed:
// a literal pair would still straddle nothing if the constant moved, and the ordering assertions below
// would go quietly vacuous instead of red.
const DAY = 24 * 60 * 60 * 1000;
const shift = (days: number) => new Date(new Date(ARCHITECTURE_PUBLISHED).getTime() + days * DAY).toISOString();
const NEWER = shift(1);
const OLDER = shift(-1);

const post = (over: Partial<BlogPost> = {}): BlogPost => ({
  slug: 'building',
  title: 'Building',
  date: '2026-06-01T00:00:00Z',
  tag: 'aws',
  track: 'engenharia',
  excerpt: 'x',
  body: '# hi',
  ...over,
});

const renderSection = (locale: 'pt' | 'en' = 'pt') => renderWithLocale(<ArticlesSection />, { locale });

beforeEach(() => vi.clearAllMocks());

describe('ArticlesSection', () => {
  it('shows the empty state', () => {
    getAllPosts.mockReturnValue([]);
    renderSection();
    expect(screen.getByText('Ainda não há artigos nesta trilha.')).toBeInTheDocument();
  });

  it('lists posts with their title link and track chip', () => {
    getAllPosts.mockReturnValue([post()]);
    renderSection();
    expect(screen.getAllByRole('link', { name: 'Building' })[0]).toHaveAttribute('href', '/pt/blog/building');
    // "Engenharia" also labels a filter tab — the chip is the one inside the article row. `getByRole`
    // used to be enough; since #450 slice 2 the teaser card is a second <article> in this section, so the
    // row is selected explicitly rather than by being the only one.
    const rows = screen.getAllByRole('article').filter((el) => el.dataset.testid !== 'architecture-card');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Engenharia');
  });

  it('renders the reader-first takeaway when the post declares one', () => {
    getAllPosts.mockReturnValue([post({ takeaway: 'onde serverless paga.' })]);
    renderSection();
    expect(screen.getByText('Você sai sabendo')).toBeInTheDocument();
    expect(screen.getByText(/onde serverless paga/)).toBeInTheDocument();
  });

  it('advertises an embedded video and the LinkedIn edition when present', () => {
    getAllPosts.mockReturnValue([post({ hasVideo: true, linkedinUrl: 'https://linkedin.com/pulse/x' })]);
    renderSection();
    expect(screen.getByText('▶ vídeo no artigo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver no LinkedIn' })).toHaveAttribute('href', 'https://linkedin.com/pulse/x');
  });

  it('omits the video badge and LinkedIn link by default', () => {
    getAllPosts.mockReturnValue([post()]);
    renderSection();
    expect(screen.queryByText('▶ vídeo no artigo')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Ver no LinkedIn' })).toBeNull();
  });

  it('starts on "Tudo" and asks the loader for every track', () => {
    getAllPosts.mockReturnValue([post()]);
    renderSection();
    expect(getAllPosts).toHaveBeenCalledWith('pt', undefined);
    expect(screen.getByRole('tab', { name: 'Tudo' })).toHaveAttribute('aria-selected', 'true');
  });

  it('filters by track in local state (no URL param)', () => {
    getAllPosts.mockReturnValue([post()]);
    renderSection();

    fireEvent.click(screen.getByRole('tab', { name: 'Vida pessoal' }));
    expect(getAllPosts).toHaveBeenLastCalledWith('pt', { track: 'pessoal' });
    expect(screen.getByRole('tab', { name: 'Vida pessoal' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('tab', { name: 'Engenharia' }));
    expect(getAllPosts).toHaveBeenLastCalledWith('pt', { track: 'engenharia' });

    fireEvent.click(screen.getByRole('tab', { name: 'Tudo' }));
    expect(getAllPosts).toHaveBeenLastCalledWith('pt', undefined);
  });

  // THE /architecture TEASER CARD (#450, slice 2). Its own copy contract is asserted in
  // `ArchitectureCard.test.tsx`; what belongs HERE is the two properties that are the section's, and that
  // the card cannot assert about itself — WHERE it sits, and that nothing in this section can remove it.
  describe('the architecture teaser card', () => {
    const cardTitle = (locale: 'pt' | 'en') => translate(locale, 'architecture.cardTitle');

    // The rendered rows, top to bottom, with the card named rather than matched by title — so an
    // assertion reads as the reader's own scan of the column.
    const rowOrder = () =>
      screen
        .getAllByRole('article')
        .map((el) =>
          el.dataset.testid === 'architecture-card' ? 'architecture' : (el.querySelector('h3')?.textContent ?? '?'),
        );

    // IN CHRONOLOGICAL ORDER, NOT PINNED. Until this slice the card was rendered before `posts.map` and
    // was permanently row one; the owner reversed that — "queria que ele seguisse a ordem cronológica
    // decrescente normal dos artigos, como se fosse um" — and chose the SECTION's publication date as the
    // key. So the assertion is no longer about a position at all: it is that the card takes the position
    // its date earns, which is the only formulation a future article cannot invalidate.
    //
    // The three cases are the three branches of the index, and each one catches a different wrong
    // implementation: the straddle catches BOTH a surviving pin and a blind append, the all-newer case
    // catches a surviving pin on its own, and the all-older case catches an append on its own. Both
    // locales, because the card is rendered from the message catalog and a pt-only assertion would pass
    // on an English edition that never wired the strings.
    it.each(['pt', 'en'] as const)('sorts between a newer and an older article (%s)', (locale) => {
      getAllPosts.mockReturnValue([
        post({ slug: 'newer', title: 'Newer', date: NEWER }),
        post({ slug: 'older', title: 'Older', date: OLDER }),
      ]);
      renderSection(locale);

      expect(rowOrder()).toEqual(['Newer', 'architecture', 'Older']);
      expect(screen.getByTestId('architecture-card').textContent).toContain(cardTitle(locale));
    });

    it.each(['pt', 'en'] as const)('is the LAST row when every article is newer than it (%s)', (locale) => {
      getAllPosts.mockReturnValue([
        post({ slug: 'a', title: 'A', date: shift(9) }),
        post({ slug: 'b', title: 'B', date: shift(2) }),
      ]);
      renderSection(locale);

      expect(rowOrder()).toEqual(['A', 'B', 'architecture']);
    });

    it.each(['pt', 'en'] as const)('is the FIRST row when every article is older than it (%s)', (locale) => {
      getAllPosts.mockReturnValue([
        post({ slug: 'a', title: 'A', date: shift(-2) }),
        post({ slug: 'b', title: 'B', date: shift(-9) }),
      ]);
      renderSection(locale);

      expect(rowOrder()).toEqual(['architecture', 'A', 'B']);
    });

    // THE TIE, pinned because it is the one case a reader cannot infer from the rule and the one an edit
    // flips silently: an article published on the same instant sits BELOW the card. Nothing on the site
    // ties today, which is exactly why the behaviour needs an assertion rather than a witness.
    it('puts an article sharing its exact date below it', () => {
      getAllPosts.mockReturnValue([post({ slug: 'same', title: 'Same', date: ARCHITECTURE_PUBLISHED })]);
      renderSection();

      expect(rowOrder()).toEqual(['architecture', 'Same']);
    });

    // OUTSIDE THE TRACK FILTER. The chips are a taxonomy over WRITING and the card is not writing, so no
    // chip state may remove it. Asserted through the real control the reader presses, on every chip, and
    // including the state that matters most — a chip whose track has zero articles, where the section
    // renders its empty state and the card must still be the front door to /architecture.
    it.each(['pt', 'en'] as const)('survives every filter chip, including one that matches nothing (%s)', (locale) => {
      getAllPosts.mockReturnValue([post()]);
      renderSection(locale);
      expect(screen.getByTestId('architecture-card')).toBeInTheDocument();

      for (const chip of ['tracks.pessoal', 'tracks.engenharia', 'articles.filterAll'] as const) {
        // The chip matches nothing on the first pass, which is the case the card most easily fails.
        getAllPosts.mockReturnValue(chip === 'tracks.pessoal' ? [] : [post()]);
        fireEvent.click(screen.getByRole('tab', { name: translate(locale, chip) }));
        expect(
          screen.getByTestId('architecture-card').textContent,
          `the card disappeared under the "${translate(locale, chip)}" chip`,
        ).toContain(cardTitle(locale));
      }
    });

    // THE EMPTY-ARTICLES CASE, on its own rather than only inside the loop above: the section's very first
    // test renders with `getAllPosts → []`, and a card rendered from `posts` rather than beside it would
    // vanish exactly there while every other assertion in this file stayed green.
    it.each(['pt', 'en'] as const)('renders alongside the empty state when there are no posts (%s)', (locale) => {
      getAllPosts.mockReturnValue([]);
      renderSection(locale);

      const empty = screen.getByText(translate(locale, 'articles.empty'));
      const card = screen.getByTestId('architecture-card');
      expect(empty).toBeInTheDocument();
      expect(card.textContent).toContain(cardTitle(locale));
      // And it is still the only <article> — the empty state is not one, so "first" is not vacuous here.
      expect(screen.getAllByRole('article')).toHaveLength(1);

      // THE EMPTY STATE COMES FIRST, and this ordering is REACHABLE TODAY rather than theoretical: both
      // published articles are `track: engenharia`, so pressing "Vida pessoal" renders exactly this.
      //
      // It is asserted because it is the better of the two orders and nothing else would hold it. The
      // message is scoped to the chip the reader just pressed ("nesta trilha"), so it belongs directly
      // under that control; the card follows, chip-labelled "Seção do site", and the column reads *no
      // writing in this track* → *here is something that is not writing*. The PINNED order was the
      // inverse — a visible row sitting directly above a sentence saying there is nothing here, which
      // invites the reader to take the message as false or the card as an article the filter missed.
      expect(empty.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      // AND IT IS SCOPED TO THE LIST, which is what makes that order safe. The message borrows the rule
      // the section draws between entries, so it reads as a note in an entry's place rather than as a
      // statement about the whole section — and the card below it is then another entry in the same list
      // instead of a row contradicting the sentence above it (copy lens, #485).
      //
      // Asserted on `border-b` — the STRUCTURAL half of the separator — and deliberately not on
      // `border-border`, which is a design-system COLOUR token: coupling a test to a token means a rename
      // that changes nothing a reader sees turns the run red. Same rule the E2E chip locator was just
      // moved off a token for.
      const emptyRow = screen.getByTestId('articles-empty-row');
      expect(emptyRow.className).toContain('border-b');
      expect(emptyRow).toContainElement(empty);
    });

    // The article rows keep `articles.read`. The card dropping it must not become the section dropping it:
    // this is the assertion that would catch the "fix" of retiring the key outright.
    it.each(['pt', 'en'] as const)('leaves the article rows reading articles.read (%s)', (locale) => {
      getAllPosts.mockReturnValue([post()]);
      renderSection(locale);

      const rows = screen.getAllByRole('article').filter((el) => el.dataset.testid !== 'architecture-card');
      expect(rows).toHaveLength(1);
      expect(rows[0].textContent).toContain(translate(locale, 'articles.read'));
    });
  });
});
