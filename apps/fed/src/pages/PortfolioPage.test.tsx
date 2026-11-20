import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { PortfolioPage } from './PortfolioPage';
import { catalog } from '../data/catalog';
import { renderWithLocale } from '../test-utils';

describe('PortfolioPage', () => {
  it('renders the header and the seeded catalog', () => {
    renderWithLocale(<PortfolioPage />);
    expect(screen.getByRole('heading', { name: 'Portfólio' })).toBeInTheDocument();
    // The seeded catalog card is linked to its repo.
    expect(screen.getByRole('link', { name: new RegExp(catalog[0].name) })).toHaveAttribute('href', catalog[0].repoUrl);
  });

  // The reference page of ADR-0008 (*A document title leads with the section label*). The composed title, in both locales — the string a tab shows, not the key.
  it.each([
    ['pt', 'Portfólio · tadeumendonca.io'],
    ['en', 'Portfolio · tadeumendonca.io'],
  ] as const)('titles the tab with the section name the reader clicked (%s)', (locale, expected) => {
    document.title = '';
    renderWithLocale(<PortfolioPage />, { locale });
    expect(document.title).toBe(expected);
  });
});
