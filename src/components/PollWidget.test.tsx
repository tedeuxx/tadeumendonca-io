import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { apiFetch, authedFetch } = vi.hoisted(() => ({ apiFetch: vi.fn(), authedFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ apiFetch, authedFetch }));
const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('../auth/authStore', () => ({ useAuth }));

import { PollWidget } from './PollWidget';
import { installMutationDefaults } from '../lib/offline';

function memoryStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => void (store[k] = String(v)),
    removeItem: (k: string) => void delete store[k],
    clear: () => void (store = {}),
  } as Storage;
}

const poll = {
  poll_id: 'pl1',
  question: 'Qual seu serviço AWS favorito?',
  options: [
    { id: 'a', label: 'Lambda' },
    { id: 'b', label: 'DynamoDB' },
  ],
  vote_counts: { a: 2 },
  published: true,
  created_at: '2026-06-01T00:00:00.000Z',
};

let qc: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  useAuth.mockReturnValue({ isAdmin: false });
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  installMutationDefaults(qc);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('PollWidget (public)', () => {
  it('renders nothing when there is no active poll (visitor)', async () => {
    apiFetch.mockResolvedValue({ items: [] });
    const { container } = render(<PollWidget />, { wrapper });
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the question + options as buttons, then reveals results after voting', async () => {
    apiFetch.mockImplementation((path: string) => {
      if (path === '/polls?limit=1') return Promise.resolve({ items: [poll] });
      if (path.endsWith('/votes')) return Promise.resolve({ vote_counts: { a: 2, b: 1 } });
      return Promise.resolve({});
    });
    render(<PollWidget />, { wrapper });

    await screen.findByText('Qual seu serviço AWS favorito?');
    expect(screen.getByRole('button', { name: 'Lambda' })).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'DynamoDB' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'DynamoDB' })).not.toBeInTheDocument());
    expect(screen.getByText('67%')).toBeInTheDocument(); // a: 2/3
    expect(screen.getByText('33%')).toBeInTheDocument(); // b: 1/3
    expect(screen.getByText('3 votos')).toBeInTheDocument();
    expect(localStorage.getItem('poll:pl1')).toBe('b');
  });

  it('shows results immediately when the browser already voted', async () => {
    localStorage.setItem('poll:pl1', 'a');
    apiFetch.mockResolvedValue({ items: [poll] });
    render(<PollWidget />, { wrapper });
    await screen.findByText('Qual seu serviço AWS favorito?');
    expect(screen.queryByRole('button', { name: 'Lambda' })).not.toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('2 votos')).toBeInTheDocument();
  });
});

describe('PollWidget (admin)', () => {
  beforeEach(() => useAuth.mockReturnValue({ isAdmin: true }));

  it('offers a "Nova enquete" entry when there is no active poll', async () => {
    apiFetch.mockResolvedValue({ items: [] });
    render(<PollWidget />, { wrapper });
    expect(await screen.findByText('Nenhuma enquete ativa.')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Nova enquete/ });
    expect(link).toHaveAttribute('href', '/compose-poll');
  });

  it('shows edit/delete on the current poll and deletes via the api', async () => {
    localStorage.setItem('poll:pl1', 'a'); // skip the vote view, go straight to results + admin bar
    apiFetch.mockResolvedValue({ items: [poll] });
    authedFetch.mockResolvedValue(undefined);
    render(<PollWidget />, { wrapper });

    await screen.findByText('Qual seu serviço AWS favorito?');
    expect(screen.getByRole('link', { name: /Editar/ })).toHaveAttribute('href', '/compose-poll/pl1');

    fireEvent.click(screen.getByRole('button', { name: /Excluir/ }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/ }));
    await waitFor(() => expect(authedFetch).toHaveBeenCalledWith('/polls/pl1', expect.objectContaining({ method: 'DELETE' })));
  });
});
