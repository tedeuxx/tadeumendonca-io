import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './LandingPage';
import { profile } from '../data/profile';
import { renderWithLocale } from '../test-utils';

// The landing is the content shop window: articles first, then portfolio, then contact. The owner's
// name and bio belong to /me and must NOT leak onto the landing.
function renderLanding() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithLocale(
    <QueryClientProvider client={qc}>
      <LandingPage />
    </QueryClientProvider>,
  );
}

describe('LandingPage', () => {
  it('leads with the articles section', async () => {
    renderLanding();
    expect(await screen.findByRole('heading', { name: /Artigos/ })).toBeInTheDocument();
  });

  it('renders the portfolio and contact regions', async () => {
    renderLanding();
    expect(await screen.findByRole('heading', { name: 'Portfólio' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Onde me encontrar' })).toBeInTheDocument(); // aside
    expect(await screen.findByRole('heading', { name: /Algo aqui te ajudou/ })).toBeInTheDocument(); // contact footer
  });

  it('does not show the personal name (it lives on /me)', async () => {
    renderLanding();
    await screen.findByRole('heading', { name: /Artigos/ });
    expect(screen.queryByText(profile.name)).toBeNull();
  });

  // THE /architecture BAND (#450), and the assertion is about its POSITION as much as its presence. The
  // decision was a new section BETWEEN the hero and the two-column grid — placing it after the grid would
  // satisfy "the band exists" while making it a teaser only readers who already stayed ever reach.
  it('carries the architecture band between the hero and the articles grid', async () => {
    const { container } = renderLanding();
    await screen.findByRole('heading', { name: /Artigos/ });

    const band = container.querySelector('[data-testid="architecture-band"]');
    const hero = container.querySelector('header#top');
    const articles = container.querySelector('#artigos');
    expect(band).not.toBeNull();
    // DOCUMENT_POSITION_FOLLOWING (4) — the band follows the hero, and the articles follow the band.
    expect(hero!.compareDocumentPosition(band!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(band!.compareDocumentPosition(articles!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // The band adds a SECOND control to /architecture on this page — the hero row already closes on it
  // (#420). That is the shape both leads agreed; what was rejected is a FIFTH hero control, so the count
  // that matters is the hero row's, and `e2e/hero-row.spec.ts` pins it at four in a real viewport.
  it('does not add the band as a fifth hero control', async () => {
    const { container } = renderLanding();
    await screen.findByRole('heading', { name: /Artigos/ });
    expect(container.querySelectorAll('header#top a[class*="border-border-strong"]')).toHaveLength(4);
  });

  it('surfaces the ramp-up page as a hero CTA (not only from the navbar)', async () => {
    renderLanding();
    const cta = await screen.findByRole('link', { name: /Ramp-up/ });
    expect(cta).toHaveAttribute('href', '/pt/ramp-up');
  });
});
