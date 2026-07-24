import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CvPage } from './CvPage';
import { profile } from '../data/profile';
import { renderWithLocale } from '../test-utils';

function renderCv(locale: 'pt' | 'en' = 'pt') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithLocale(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <CvPage />
      </MemoryRouter>
    </QueryClientProvider>,
    { locale },
  );
}

describe('CvPage', () => {
  it('renders the static CV — this is where the personal name lives', async () => {
    renderCv();
    expect(await screen.findByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument();
  });

  it('titles the document as the CV', async () => {
    renderCv();
    await screen.findByRole('heading', { level: 1, name: profile.name });
    expect(document.title).toContain('CV');
  });

  // The CV CONTENT localizes, not just the chrome — a pt visitor gets a Portuguese CV, which is what
  // the bilingual work is for. Asserted through the page (not the resolver) so the locale actually
  // travels provider → useProfile → render.
  it('renders the CV content in Portuguese for a pt visitor', async () => {
    renderCv('pt');
    await screen.findByRole('heading', { level: 1, name: profile.name });
    // Locale-discriminating, number-agnostic: the years figure is derived (lib/experience).
    expect(screen.getByText(/\d+ anos em SDLC/)).toBeInTheDocument();
  });

  it('renders the CV content in English for an en visitor', async () => {
    renderCv('en');
    await screen.findByRole('heading', { level: 1, name: profile.name });
    expect(screen.getByText(/\d+y across SDLC/)).toBeInTheDocument();
  });
});
