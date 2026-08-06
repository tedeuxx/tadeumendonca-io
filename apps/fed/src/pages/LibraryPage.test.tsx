import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { LibraryPage } from './LibraryPage';
import { library, type LibraryEntry } from '../data/library';
import { renderWithLocale } from '../test-utils';

// THE EMPTY STATE IS THE REASON THIS FILE USES THE `entries` SEAM, and it is worth saying before the
// tests. With books on the shelf, no route and no E2E journey can reach the empty branch any more — the
// only way to render it would be to empty the real array. An arm nothing can render is an arm nothing can
// prove still works, and this one is REVIEWED COPY, not dead code: it is what the surface shows if the
// array is emptied, if a data import breaks, or if a filter is ever added upstream. So the seam renders it
// directly and it stays covered, in both editions, exactly as it was when it was the whole page.

const FIXTURE: LibraryEntry[] = [
  {
    title: 'Designing Data-Intensive Applications',
    authors: ['Martin Kleppmann'],
    publisher: "O'Reilly",
    year: 2017,
    url: 'https://dataintensive.net',
    rating: 5,
    takeaway: { pt: 'O que eu tirei do livro.', en: 'What I took from the book.' },
  },
];

describe('LibraryPage — the chrome', () => {
  it('renders the heading and the intro', () => {
    renderWithLocale(<LibraryPage />);
    expect(screen.getByRole('heading', { level: 1, name: /Biblioteca/ })).toBeInTheDocument();
    expect(screen.getByText(/só entra o que eu terminei/)).toBeInTheDocument();
  });

  it('serves the chrome in the visitor language, without the other edition leaking in', () => {
    const { unmount } = renderWithLocale(<LibraryPage />, { locale: 'pt' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Biblioteca — o que eu leio, e o que ficou');
    expect(screen.getByText('Estante · em montagem')).toBeInTheDocument();
    expect(screen.queryByText(/Shelf · being put together/)).toBeNull();
    unmount();

    renderWithLocale(<LibraryPage />, { locale: 'en' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Library — what I read, and what stuck');
    expect(screen.getByText('Shelf · being put together')).toBeInTheDocument();
    expect(screen.queryByText(/Estante · em montagem/)).toBeNull();
  });
});

describe('LibraryPage — the empty state, still live copy', () => {
  it('states the shelf is being built, in the reader’s own words', () => {
    renderWithLocale(<LibraryPage entries={[]} />);
    // Asserted on its TEXT, not on the testid alone: an empty <p data-testid> satisfies a presence check
    // while showing the reader nothing.
    expect(screen.getByTestId('library-empty')).toHaveTextContent('Esta estante ainda está sendo montada.');
    expect(screen.queryByTestId('library-shelf')).toBeNull();
  });

  it('is authored in both editions, each rendering without the other’s text', () => {
    const { unmount } = renderWithLocale(<LibraryPage entries={[]} />, { locale: 'pt' });
    expect(screen.getByTestId('library-empty')).toHaveTextContent('Esta estante ainda está sendo montada.');
    expect(screen.queryByText(/This shelf is still being put together/)).toBeNull();
    unmount();

    renderWithLocale(<LibraryPage entries={[]} />, { locale: 'en' });
    expect(screen.getByTestId('library-empty')).toHaveTextContent('This shelf is still being put together.');
    expect(screen.queryByText(/Esta estante ainda está sendo montada/)).toBeNull();
  });

  // The branch is exclusive, and it matters in the direction that is easy to get wrong: a page rendering
  // BOTH would show a populated shelf under a sentence saying there is nothing on it.
  it('does not show the empty sentence once there is anything on the shelf', () => {
    renderWithLocale(<LibraryPage entries={FIXTURE} />);
    expect(screen.queryByTestId('library-empty')).toBeNull();
    expect(screen.getByTestId('library-shelf')).toBeInTheDocument();
  });
});

describe('LibraryPage — the card', () => {
  const renderCard = (locale: 'pt' | 'en' = 'pt') => {
    renderWithLocale(<LibraryPage entries={FIXTURE} />, { locale });
    return within(screen.getByTestId('library-shelf')).getByRole('listitem');
  };

  it('shows the title as the link to the book’s canonical page, opened safely', () => {
    const link = within(renderCard()).getByRole('link', { name: /Designing Data-Intensive Applications/ });
    expect(link).toHaveAttribute('href', 'https://dataintensive.net');
    // `noreferrer` implies `noopener`; both are the repo's convention for every outbound link.
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveAttribute('target', '_blank');
  });

  // One destination per book, so there is exactly ONE anchor. A second link to the same URL would read as
  // a second destination to a sighted reader and announce the same place twice to a screen reader.
  it('links the book once, not twice', () => {
    expect(within(renderCard()).getAllByRole('link')).toHaveLength(1);
  });

  it('shows the facts — authors, publisher, year — beside the title', () => {
    expect(renderCard()).toHaveTextContent("Martin Kleppmann · O'Reilly · 2017");
  });

  // `publisher` and `year` are optional facts and an absent one must vanish, not render as a stray
  // separator or the word "undefined". Only the authors remain.
  it('omits the optional facts cleanly when they are absent', () => {
    renderWithLocale(<LibraryPage entries={[{ ...FIXTURE[0], publisher: undefined, year: undefined }]} />);
    const card = within(screen.getByTestId('library-shelf')).getByRole('listitem');
    expect(card).toHaveTextContent('Martin Kleppmann');
    expect(card).not.toHaveTextContent('undefined');
    expect(card).not.toHaveTextContent('Martin Kleppmann ·');
  });

  // The takeaway is the card's prose payload and the rating is its claim. Both are asserted per edition
  // in one test because they flip together: the rating reaches a reader who cannot see the fill ONLY
  // through the meter's accessible name, and that name is a catalog string, so it must be in the
  // visitor's language and not merely present.
  it('renders the takeaway and announces the rating in the visitor’s language', () => {
    const { unmount } = renderWithLocale(<LibraryPage entries={FIXTURE} />, { locale: 'pt' });
    expect(screen.getByTestId('library-shelf')).toHaveTextContent('O que eu tirei do livro.');
    expect(screen.queryByText(/What I took from the book/)).toBeNull();
    expect(within(screen.getByTestId('library-shelf')).getByRole('img')).toHaveAccessibleName('Nota 5 de 5');
    unmount();

    renderWithLocale(<LibraryPage entries={FIXTURE} />, { locale: 'en' });
    expect(screen.getByTestId('library-shelf')).toHaveTextContent('What I took from the book.');
    expect(screen.queryByText(/O que eu tirei do livro/)).toBeNull();
    expect(within(screen.getByTestId('library-shelf')).getByRole('img')).toHaveAccessibleName('Rated 5 out of 5');
  });

  // A list, so a screen reader can say how many books there are before reading them.
  it('renders the shelf as a list of books', () => {
    renderWithLocale(<LibraryPage entries={[FIXTURE[0], { ...FIXTURE[0], url: 'https://example.com/other' }]} />);
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
  });
});

describe('LibraryPage — the shipped shelf', () => {
  // The default path — no `entries` prop — must render the REAL data. The seam exists for the empty
  // branch; if it also changed what a reader sees, every test above would be about a fixture and nothing
  // would cover the page the site actually serves.
  it('renders every shipped book by default, in the authored order', () => {
    renderWithLocale(<LibraryPage />);
    const cards = within(screen.getByTestId('library-shelf')).getAllByRole('listitem');
    expect(cards).toHaveLength(library.length);
    expect(library.length).toBeGreaterThan(0);
    expect(cards.map((card) => within(card).getByRole('link').getAttribute('href'))).toEqual(
      library.map((book) => book.url),
    );
  });

  it('gives each shipped book a rating meter and its own takeaway', () => {
    renderWithLocale(<LibraryPage />, { locale: 'pt' });
    const shelf = screen.getByTestId('library-shelf');
    expect(within(shelf).getAllByTestId('rating-meter')).toHaveLength(library.length);
    for (const book of library) {
      expect(shelf, `"${book.title}" renders no takeaway`).toHaveTextContent(book.takeaway.pt);
    }
  });
});
