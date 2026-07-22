import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CvPage } from './CvPage';
import { profile } from '../data/profile';

function renderCv() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <CvPage />
      </MemoryRouter>
    </QueryClientProvider>,
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
});
