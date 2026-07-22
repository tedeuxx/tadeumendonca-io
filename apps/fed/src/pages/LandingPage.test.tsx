import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './LandingPage';
import { profile } from '../data/profile';

// The landing is the content shop window: articles first, then portfolio, then contact. The owner's
// name and bio belong to /cv and must NOT leak onto the landing.
function renderLanding() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
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
    expect(await screen.findByRole('heading', { name: 'Contato' })).toBeInTheDocument(); // #contato region
  });

  it('does not show the personal name (it lives on /cv)', async () => {
    renderLanding();
    await screen.findByRole('heading', { name: /Artigos/ });
    expect(screen.queryByText(profile.name)).toBeNull();
  });
});
