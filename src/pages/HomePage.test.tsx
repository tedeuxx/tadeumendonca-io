import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from './HomePage';
import type { Profile } from '../types/profile';

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ apiFetch }));

const sample: Profile = {
  profile_id: 'me',
  name: 'Tadeu Mendonça',
  headline: 'Engineer',
  experience: [],
  education: [],
  certifications: [],
  skills: {},
  metadata: {},
};

function renderHome() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <HomePage />
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  beforeEach(() => apiFetch.mockReset());

  it('shows a loading state, then the profile', async () => {
    let resolve: (p: Profile) => void = () => {};
    apiFetch.mockReturnValueOnce(new Promise<Profile>((r) => (resolve = r)));
    renderHome();
    expect(screen.getByText(/Loading profile/)).toBeInTheDocument();
    resolve(sample);
    expect(await screen.findByText('Tadeu Mendonça')).toBeInTheDocument();
  });

  it('shows an error state on failure', async () => {
    apiFetch.mockRejectedValueOnce({ error: { code: 'request_failed' } });
    renderHome();
    await waitFor(() => expect(screen.getByText('Could not load the profile')).toBeInTheDocument());
  });
});
