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

  // THE /architecture TEASER CARD (#450, slice 2), and the assertion is about the LANDING'S SHAPE, which
  // is what the owner rejected the band over: "você descaracterizou a home". The band was a section
  // BETWEEN the hero and the grid; the card is INSIDE the article list, so the landing is hero → grid
  // again with nothing pushed down. Asserted by containment rather than by order, because containment is
  // the property that failed: a card that rendered as a sibling of `#artigos` would satisfy every
  // "the card follows the hero" ordering check and be the band again under a new name.
  it('carries the architecture card inside the articles section, not as a band above it', async () => {
    const { container } = renderLanding();
    await screen.findByRole('heading', { name: /Artigos/ });

    const card = container.querySelector('[data-testid="architecture-card"]');
    const hero = container.querySelector('header#top');
    const articles = container.querySelector('#artigos');
    expect(card).not.toBeNull();
    expect(articles!.contains(card!)).toBe(true);
    // And the hero's next block is the grid itself — nothing sits between them.
    expect(hero!.nextElementSibling!.contains(articles!)).toBe(true);
  });

  // The card adds a SECOND control to /architecture on this page — the hero row already opens with
  // it (#429). That is the accepted shape; what was rejected is a FIFTH hero control, so the count
  // that matters is the hero row's, and `e2e/hero-row.spec.ts` pins it at four in a real viewport.
  it('does not add the card as a fifth hero control', async () => {
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
