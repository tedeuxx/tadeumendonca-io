import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { apiFetch, authedFetch } = vi.hoisted(() => ({ apiFetch: vi.fn(), authedFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ apiFetch, authedFetch }));

import { useReactions } from './useReactions';
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

let qc: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  installMutationDefaults(qc); // the keyed 'reaction' request fn lives in the offline defaults
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('useReactions', () => {
  it('adds a reaction (POST): optimistic immediately, then the server count, and remembers it', async () => {
    apiFetch.mockResolvedValueOnce({ reaction_counts: { '👍': 3 } });
    const { result } = renderHook(() => useReactions('p1', { '👍': 2 }), { wrapper });
    act(() => result.current.toggle('👍'));
    expect(result.current.mine).toBe('👍'); // optimistic, synchronous
    expect(localStorage.getItem('reaction:p1')).toBe('👍');
    await waitFor(() => expect(result.current.counts).toEqual({ '👍': 3 })); // reconciled from server
    expect(apiFetch).toHaveBeenCalledWith('/posts/p1/reactions', expect.objectContaining({ method: 'POST' }));
  });

  it('toggles the same emoji off (DELETE)', async () => {
    localStorage.setItem('reaction:p1', '👍');
    apiFetch.mockResolvedValueOnce({ reaction_counts: { '👍': 1 } });
    const { result } = renderHook(() => useReactions('p1', { '👍': 2 }), { wrapper });
    act(() => result.current.toggle('👍'));
    expect(result.current.mine).toBeNull();
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/posts/p1/reactions', expect.objectContaining({ method: 'DELETE' })));
    expect(localStorage.getItem('reaction:p1')).toBeNull();
  });

  it('swaps reactions: queues a DELETE of the previous then a POST of the new', async () => {
    localStorage.setItem('reaction:p1', '👍');
    apiFetch.mockResolvedValue({ reaction_counts: { '👍': 1, '❤️': 1 } });
    const { result } = renderHook(() => useReactions('p1', { '👍': 2 }), { wrapper });
    act(() => result.current.toggle('❤️'));
    expect(result.current.mine).toBe('❤️'); // optimistic swap
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    expect(result.current.counts).toEqual({ '👍': 1, '❤️': 1 });
  });
});
