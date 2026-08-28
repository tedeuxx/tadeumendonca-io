import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfilePage } from './ProfilePage';
import { profile } from '../data/profile';
import { renderWithLocale } from '../test-utils';

function renderProfile(locale: 'pt' | 'en' = 'pt') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithLocale(
    <QueryClientProvider client={qc}>
      <ProfilePage />
    </QueryClientProvider>,
    { locale },
  );
}

describe('ProfilePage', () => {
  it('renders the static profile — this is where the personal name lives', async () => {
    renderProfile();
    expect(await screen.findByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument();
  });

  // ADR-0045, and the one section the catalog-wide check in messages.test.ts cannot reach: /me composes
  // its title from the nav label plus DATA (the personal name), so there is no `profile.title` leaf to
  // derive from. `toContain` was too weak for the convention — it passes on a title that merely mentions
  // the label somewhere — so this pins the LEAD and the composed whole.
  it.each([
    ['pt', 'Perfil'],
    ['en', 'Profile'],
  ] as const)('leads the document title with the nav label, then the name (%s)', async (locale, label) => {
    document.title = '';
    renderProfile(locale);
    await screen.findByRole('heading', { level: 1, name: profile.name });
    expect(document.title).toBe(`${label} — ${profile.name} · tadeumendonca.io`);
  });

  // The profile CONTENT localizes, not just the chrome — a pt visitor gets a Portuguese CV, which is
  // what the bilingual work is for. Asserted through the page (not the resolver) so the locale actually
  // travels provider → useProfile → render.
  it('renders the profile content in Portuguese for a pt visitor', async () => {
    renderProfile('pt');
    await screen.findByRole('heading', { level: 1, name: profile.name });
    // Locale-discriminating, floor-agnostic: the years figure is the evergreen "N+" form (#124).
    expect(screen.getByText(/\d+\+ anos em Desenvolvimento de Software/)).toBeInTheDocument();
  });

  it('renders the profile content in English for an en visitor', async () => {
    renderProfile('en');
    await screen.findByRole('heading', { level: 1, name: profile.name });
    expect(screen.getByText(/\d+\+ years across Software Development/)).toBeInTheDocument();
  });
});
