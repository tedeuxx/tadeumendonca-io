import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { apiFetch, authedFetch } = vi.hoisted(() => ({ apiFetch: vi.fn(), authedFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ apiFetch, authedFetch }));

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
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  installMutationDefaults(qc);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('PollWidget', () => {
  it('renders nothing when there is no active poll', async () => {
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
    const lambdaBtn = screen.getByRole('button', { name: 'Lambda' });
    expect(lambdaBtn).toBeInTheDocument(); // pre-vote: options are buttons, no percentages yet
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'DynamoDB' }));

    // Post-vote: results view — percentages + total appear, buttons are gone.
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
    expect(screen.queryByRole('button', { name: 'Lambda' })).not.toBeInTheDocument(); // straight to results
    expect(screen.getByText('100%')).toBeInTheDocument(); // a: 2/2 (only recorded votes)
    expect(screen.getByText('2 votos')).toBeInTheDocument();
  });
});
