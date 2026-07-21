import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from './HomePage';
import { profile } from '../data/profile';

// Reframe-first: the landing renders the STATIC CV (no BFF call) followed by the portfolio section.
function renderHome() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HomePage (landing)', () => {
  it('renders the static CV', async () => {
    renderHome();
    expect(await screen.findByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument();
  });

  it('renders the portfolio section', async () => {
    renderHome();
    expect(await screen.findByRole('heading', { level: 2, name: 'Portfólio' })).toBeInTheDocument();
  });
});
