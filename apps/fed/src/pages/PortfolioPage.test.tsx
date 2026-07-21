import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PortfolioPage } from './PortfolioPage';
import { catalog } from '../data/catalog';

describe('PortfolioPage', () => {
  it('renders the header and the seeded catalog', () => {
    render(
      <MemoryRouter>
        <PortfolioPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Portfólio' })).toBeInTheDocument();
    // The seeded catalog card is linked to its repo.
    expect(screen.getByRole('link', { name: new RegExp(catalog[0].name) })).toHaveAttribute('href', catalog[0].repoUrl);
  });
});
