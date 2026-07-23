import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { CatalogProject } from '../data/catalog';
import { renderWithLocale } from '../test-utils';

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
  proof: 'como encadear um agente com ferramentas.',
  stack: ['Python'],
  repoUrl: 'https://github.com/tedeuxx/demo',
  liveUrl: 'https://example.com',
  status: 'live',
};

const renderSection = (props: { limit?: number; showAllLink?: boolean } = {}) =>
  renderWithLocale(
    <MemoryRouter>
      <PortfolioSection {...props} />
    </MemoryRouter>,
  );

describe('PortfolioSection', () => {
  beforeEach(() => {
    state.catalog = [];
  });

  it('shows an empty state linking to GitHub when the catalog is empty', () => {
    renderSection();
    expect(screen.getByText(/Catálogo em construção/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Acompanhe no GitHub/ })).toHaveAttribute('href', 'https://github.com/tedeuxx');
  });

  it('renders a card per catalog project, with the reader-first payoff', () => {
    state.catalog = [sample];
    renderSection();
    expect(screen.getByRole('link', { name: /demo-project/ })).toHaveAttribute('href', sample.repoUrl);
    expect(screen.getByText('A demo automation.')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('O que você tira disso')).toBeInTheDocument();
    expect(screen.getByText(/como encadear um agente/)).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver no GitHub/ })).toHaveAttribute('href', sample.repoUrl);
    expect(screen.getByRole('link', { name: /Ver ao vivo/ })).toHaveAttribute('href', sample.liveUrl);
  });

  it('omits the live link when the project has none', () => {
    state.catalog = [{ ...sample, liveUrl: undefined }];
    renderSection();
    expect(screen.queryByRole('link', { name: /Ver ao vivo/ })).toBeNull();
  });

  it('omits the payoff line when the project declares none', () => {
    state.catalog = [{ ...sample, proof: undefined }];
    renderSection();
    expect(screen.queryByText('O que você tira disso')).toBeNull();
  });

  it('truncates to the shortlist and links to the full catalog on request', () => {
    state.catalog = [sample, { ...sample, name: 'second' }, { ...sample, name: 'third' }];
    renderSection({ limit: 2, showAllLink: true });
    expect(screen.queryByRole('link', { name: /third/ })).toBeNull();
    expect(screen.getByRole('link', { name: /Ver catálogo completo/ })).toHaveAttribute('href', '/portfolio');
  });

  it('shows everything and no catalog link by default', () => {
    state.catalog = [sample, { ...sample, name: 'second' }];
    renderSection();
    expect(screen.getByRole('link', { name: /second/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver catálogo completo/ })).toBeNull();
  });
});
