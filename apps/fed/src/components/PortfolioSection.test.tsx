import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CatalogProject } from '../data/catalog';

// Drive both the empty state and the populated state by mocking the (static) catalog module.
const { state } = vi.hoisted(() => ({ state: { catalog: [] as CatalogProject[] } }));
vi.mock('../data/catalog', () => ({
  get catalog() {
    return state.catalog;
  },
}));

import { PortfolioSection } from './PortfolioSection';

const sample: CatalogProject = {
  name: 'demo-project',
  tagline: 'A demo automation.',
  description: 'Does a thing.',
  stack: ['Python'],
  repoUrl: 'https://github.com/tedeuxx/demo',
  liveUrl: 'https://example.com',
  status: 'live',
};

describe('PortfolioSection', () => {
  beforeEach(() => {
    state.catalog = [];
  });

  it('shows an empty state linking to GitHub when the catalog is empty', () => {
    render(<PortfolioSection />);
    expect(screen.getByText(/Catálogo em construção/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Acompanhe no GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/tedeuxx',
    );
  });

  it('renders a card per catalog project', () => {
    state.catalog = [sample];
    render(<PortfolioSection />);
    expect(screen.getByRole('link', { name: /demo-project/ })).toHaveAttribute('href', sample.repoUrl);
    expect(screen.getByText('A demo automation.')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver ao vivo/ })).toHaveAttribute('href', sample.liveUrl);
  });

  it('omits the section heading when not embedded', () => {
    state.catalog = [sample];
    render(<PortfolioSection embedded={false} />);
    expect(screen.queryByRole('heading', { name: 'Portfólio' })).not.toBeInTheDocument();
  });
});
