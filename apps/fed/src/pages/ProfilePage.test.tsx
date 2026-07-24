import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfilePage } from './ProfilePage';
import { profile } from '../data/profile';
import { renderWithLocale } from '../test-utils';

function renderProfile(locale: 'pt' | 'en' = 'pt') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithLocale(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
    { locale },
  );
}

describe('ProfilePage', () => {
  it('renders the static profile — this is where the personal name lives', async () => {
    renderProfile();
    expect(await screen.findByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument();
  });

  it('titles the document with the profile label and name', async () => {
    renderProfile();
    await screen.findByRole('heading', { level: 1, name: profile.name });
    // pt locale → "Perfil — <name>".
    expect(document.title).toContain('Perfil');
  });

  // The profile CONTENT localizes, not just the chrome — a pt visitor gets a Portuguese CV, which is
  // what the bilingual work is for. Asserted through the page (not the resolver) so the locale actually
  // travels provider → useProfile → render.
  it('renders the profile content in Portuguese for a pt visitor', async () => {
    renderProfile('pt');
    await screen.findByRole('heading', { level: 1, name: profile.name });
    // Locale-discriminating, floor-agnostic: the years figure is the evergreen "N+" form (#124).
    expect(screen.getByText(/\d+\+ anos em SDLC/)).toBeInTheDocument();
  });

  it('renders the profile content in English for an en visitor', async () => {
    renderProfile('en');
    await screen.findByRole('heading', { level: 1, name: profile.name });
    expect(screen.getByText(/\d+\+ years across SDLC/)).toBeInTheDocument();
  });
});
