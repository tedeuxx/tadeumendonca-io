import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { apiFetch, authedFetch } = vi.hoisted(() => ({ apiFetch: vi.fn(), authedFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ apiFetch, authedFetch }));

import { useCurrentPoll, usePollVote, useAdminPoll, useCreatePoll, useUpdatePoll, useDeletePoll, type Poll } from './usePoll';
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

const poll: Poll = {
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
  installMutationDefaults(qc); // the keyed 'vote' request fn lives in the offline defaults
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('useCurrentPoll', () => {
  it('returns the newest published poll (items[0])', async () => {
    apiFetch.mockResolvedValueOnce({ items: [poll] });
    const { result } = renderHook(() => useCurrentPoll(), { wrapper });
    await waitFor(() => expect(result.current.poll?.poll_id).toBe('pl1'));
    expect(apiFetch).toHaveBeenCalledWith('/polls?limit=1');
  });

  it('returns undefined when there is no active poll', async () => {
    apiFetch.mockResolvedValueOnce({ items: [] });
    const { result } = renderHook(() => useCurrentPoll(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.poll).toBeUndefined();
  });
});

describe('usePollVote', () => {
  it('casts a vote: optimistic immediately, persists it, then reconciles from the server', async () => {
    apiFetch.mockResolvedValueOnce({ vote_counts: { a: 2, b: 1 } });
    const { result } = renderHook(() => usePollVote(poll), { wrapper });
    act(() => result.current.vote('b'));
    expect(result.current.mine).toBe('b'); // optimistic, synchronous
    expect(result.current.voted).toBe(true);
    expect(localStorage.getItem('poll:pl1')).toBe('b');
    expect(result.current.counts.b).toBe(1); // optimistic increment
    await waitFor(() => expect(result.current.counts).toEqual({ a: 2, b: 1 })); // server-reconciled
    expect(apiFetch).toHaveBeenCalledWith('/polls/pl1/votes', expect.objectContaining({ method: 'POST' }));
  });

  it('is final — a second vote is a no-op (no extra request, counts unchanged)', () => {
    localStorage.setItem('poll:pl1', 'a');
    const { result } = renderHook(() => usePollVote(poll), { wrapper });
    expect(result.current.voted).toBe(true); // remembered from a previous visit
    expect(result.current.mine).toBe('a');
    act(() => result.current.vote('b'));
    expect(result.current.mine).toBe('a'); // unchanged
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('totals the counts across options', () => {
    localStorage.setItem('poll:pl1', 'a');
    const { result } = renderHook(() => usePollVote({ ...poll, vote_counts: { a: 3, b: 1 } }), { wrapper });
    expect(result.current.total).toBe(4);
  });
});

describe('admin poll hooks', () => {
  it('useAdminPoll reads a single poll by id', async () => {
    apiFetch.mockResolvedValueOnce(poll);
    const { result } = renderHook(() => useAdminPoll('pl1'), { wrapper });
    await waitFor(() => expect(result.current.data?.poll_id).toBe('pl1'));
    expect(apiFetch).toHaveBeenCalledWith('/polls/pl1');
  });

  it('useCreatePoll POSTs the input', async () => {
    authedFetch.mockResolvedValueOnce({ poll_id: 'new' });
    const { result } = renderHook(() => useCreatePoll(), { wrapper });
    act(() => result.current.mutate({ question: 'Q?', options: [{ label: 'A' }, { label: 'B' }], published: true }));
    await waitFor(() => expect(authedFetch).toHaveBeenCalledWith('/polls', expect.objectContaining({ method: 'POST' })));
  });

  it('useUpdatePoll PUTs to the poll id', async () => {
    authedFetch.mockResolvedValueOnce({ poll_id: 'pl1' });
    const { result } = renderHook(() => useUpdatePoll('pl1'), { wrapper });
    act(() => result.current.mutate({ question: 'Q?', options: [{ id: 'o1', label: 'A' }, { label: 'B' }], published: false }));
    await waitFor(() => expect(authedFetch).toHaveBeenCalledWith('/polls/pl1', expect.objectContaining({ method: 'PUT' })));
  });

  it('useDeletePoll DELETEs the poll id', async () => {
    authedFetch.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDeletePoll(), { wrapper });
    act(() => result.current.mutate('pl1'));
    await waitFor(() => expect(authedFetch).toHaveBeenCalledWith('/polls/pl1', expect.objectContaining({ method: 'DELETE' })));
  });
});
