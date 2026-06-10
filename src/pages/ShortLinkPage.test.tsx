import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ apiFetch }));
const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('react-router-dom', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return { ...actual, useNavigate: () => navigate };
});

import { ShortLinkPage } from './ShortLinkPage';

const renderAt = (code: string) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/p/${code}`]}>
        <Routes>
          <Route path="/p/:code" element={<ShortLinkPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe('ShortLinkPage', () => {
  it('resolves the code and redirects to the canonical post', async () => {
    apiFetch.mockResolvedValueOnce({ type: 'post', target_id: 'p1' });
    renderAt('aB3xK9q');
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/posts/p1', { replace: true }));
    expect(apiFetch).toHaveBeenCalledWith('/shortlinks/aB3xK9q');
  });

  it('shows a not-found notice when the code is unknown', async () => {
    apiFetch.mockRejectedValueOnce({ error: { code: 'not_found' } });
    renderAt('nope');
    expect(await screen.findByText(/não existe ou expirou/)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
