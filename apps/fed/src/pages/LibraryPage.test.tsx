import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LibraryPage } from './LibraryPage';
import { library } from '../data/library';
import { renderWithLocale } from '../test-utils';

describe('LibraryPage', () => {
  it('renders the heading and the intro', () => {
    renderWithLocale(<LibraryPage />);
    expect(screen.getByRole('heading', { level: 1, name: /Biblioteca/ })).toBeInTheDocument();
    expect(screen.getByText(/Não é lista de leitura/)).toBeInTheDocument();
  });

  // The empty state is the surface's whole visible payload in this slice, so it is asserted on its TEXT
  // rather than on the testid alone: an empty <p data-testid> would satisfy a presence check while
  // showing the reader nothing.
  it('states the shelf is being built, in the reader’s own words', () => {
    renderWithLocale(<LibraryPage />);
    expect(screen.getByTestId('library-empty')).toHaveTextContent('A estante ainda está sendo montada.');
  });

  // Guards the guard. Every assertion above is about the EMPTY branch, and `library` is empty today —
  // so if the shelf ever gains an entry without this page gaining a way to render one, these tests would
  // go red for the right reason and this one says why in one line.
  it('is asserted against an empty shelf — the branch under test is the empty one', () => {
    expect(library).toHaveLength(0);
  });

  // Chrome AND the empty state flip together, and each edition is asserted to render WITHOUT the other's
  // text — the parity rule (ADR-0032). "Present in pt" alone would pass a fallback that rendered both.
  it('serves the whole page in the visitor language', () => {
    const { unmount } = renderWithLocale(<LibraryPage />, { locale: 'pt' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Biblioteca — o que eu leio, e o que ficou');
    expect(screen.getByText('Estante · em curadoria')).toBeInTheDocument();
    expect(screen.getByTestId('library-empty')).toHaveTextContent('A estante ainda está sendo montada.');
    expect(screen.queryByText(/The shelf is still being put together/)).toBeNull();
    unmount();

    renderWithLocale(<LibraryPage />, { locale: 'en' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Library — what I read, and what stuck');
    expect(screen.getByText('Shelf · being curated')).toBeInTheDocument();
    expect(screen.getByTestId('library-empty')).toHaveTextContent('The shelf is still being put together.');
    expect(screen.queryByText(/A estante ainda está sendo montada/)).toBeNull();
  });
});
