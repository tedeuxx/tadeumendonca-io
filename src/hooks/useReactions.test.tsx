import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ apiFetch }));

import { useReactions } from './useReactions';

function memoryStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => void (store[k] = String(v)),
    removeItem: (k: string) => void delete store[k],
    clear: () => void (store = {}),
  } as Storage;
}

beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('useReactions', () => {
  it('adds a reaction (POST), updates counts, and remembers it', async () => {
    apiFetch.mockResolvedValueOnce({ reaction_counts: { '👍': 3 } });
    const { result } = renderHook(() => useReactions('p1', { '👍': 2 }));
    await act(async () => {
      await result.current.toggle('👍');
    });
    expect(result.current.counts).toEqual({ '👍': 3 });
    expect(result.current.mine).toBe('👍');
    expect(apiFetch).toHaveBeenCalledWith('/posts/p1/reactions', expect.objectContaining({ method: 'POST' }));
    expect(localStorage.getItem('reaction:p1')).toBe('👍');
  });

  it('toggles the same emoji off (DELETE)', async () => {
    localStorage.setItem('reaction:p1', '👍');
    apiFetch.mockResolvedValueOnce({ reaction_counts: { '👍': 1 } });
    const { result } = renderHook(() => useReactions('p1', { '👍': 2 }));
    await act(async () => {
      await result.current.toggle('👍');
    });
    expect(result.current.mine).toBeNull();
    expect(apiFetch).toHaveBeenCalledWith('/posts/p1/reactions', expect.objectContaining({ method: 'DELETE' }));
    expect(localStorage.getItem('reaction:p1')).toBeNull();
  });

  it('swaps reactions: removes the previous then adds the new', async () => {
    localStorage.setItem('reaction:p1', '👍');
    apiFetch.mockResolvedValueOnce({ reaction_counts: { '👍': 1 } }); // DELETE old
    apiFetch.mockResolvedValueOnce({ reaction_counts: { '👍': 1, '❤️': 1 } }); // POST new
    const { result } = renderHook(() => useReactions('p1', { '👍': 2 }));
    await act(async () => {
      await result.current.toggle('❤️');
    });
    await waitFor(() => expect(result.current.mine).toBe('❤️'));
    expect(apiFetch).toHaveBeenCalledTimes(2);
    expect(result.current.counts).toEqual({ '👍': 1, '❤️': 1 });
  });
});
