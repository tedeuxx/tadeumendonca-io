import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
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

// Distinct pt/en strings per prose field (#235): identical fixtures would render the same either way,
// so the locale resolution would be untested — the shape of defect that let /en/portfolio ship
// Portuguese copy in the first place.
const sample: CatalogProject = {
  name: 'demo-project',
  tagline: { pt: 'Uma automação de exemplo.', en: 'A demo automation.' },
  description: { pt: 'Faz uma coisa.', en: 'Does a thing.' },
  proof: { pt: 'como encadear um agente com ferramentas.', en: 'how to chain an agent with tools.' },
  stack: ['Python'],
  repoUrl: 'https://github.com/tedeuxx/demo',
  liveUrl: 'https://example.com',
  status: 'live',
};

const renderSection = (props: { limit?: number; showAllLink?: boolean } = {}) =>
  renderWithLocale(<PortfolioSection {...props} />);

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
    expect(screen.getByText('Uma automação de exemplo.')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('O que você tira disso')).toBeInTheDocument();
    expect(screen.getByText(/como encadear um agente/)).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver no GitHub/ })).toHaveAttribute('href', sample.repoUrl);
    expect(screen.getByRole('link', { name: /Ver ao vivo/ })).toHaveAttribute('href', sample.liveUrl);
  });

  // The bug this file's bilingual shape exists to prevent (#235): /en/portfolio served Portuguese copy
  // because the prose fields were plain strings. Asserted in BOTH directions — each edition must show
  // its own prose AND not leak the other's, which is the same parity contract the blog editions carry.
  it('renders each edition in its own language, with no leak from the other', () => {
    state.catalog = [sample];
    const { unmount } = renderWithLocale(<PortfolioSection />, { locale: 'en' });
    expect(screen.getByText('A demo automation.')).toBeInTheDocument();
    expect(screen.getByText('Does a thing.')).toBeInTheDocument();
    expect(screen.getByText(/how to chain an agent/)).toBeInTheDocument();
    expect(screen.queryByText('Uma automação de exemplo.')).toBeNull();
    unmount();

    renderWithLocale(<PortfolioSection />, { locale: 'pt' });
    expect(screen.getByText('Uma automação de exemplo.')).toBeInTheDocument();
    expect(screen.getByText('Faz uma coisa.')).toBeInTheDocument();
    expect(screen.queryByText('A demo automation.')).toBeNull();
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
    expect(screen.getByRole('link', { name: /Ver catálogo completo/ })).toHaveAttribute('href', '/pt/portfolio');
  });

  it('shows everything and no catalog link by default', () => {
    state.catalog = [sample, { ...sample, name: 'second' }];
    renderSection();
    expect(screen.getByRole('link', { name: /second/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver catálogo completo/ })).toBeNull();
  });
});
