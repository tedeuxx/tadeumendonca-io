import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ apiFetch }));

import { useFeed, usePost } from './useFeed';

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

beforeEach(() => vi.clearAllMocks());

describe('useFeed', () => {
  it('fetches the first feed page', async () => {
    apiFetch.mockResolvedValueOnce({ items: [{ kind: 'post', post_id: 'p1', title: 'T', body: 'b', published: true, created_at: 'x' }], next_cursor: 'c2' });
    const { result } = renderHook(() => useFeed(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const first = result.current.data?.pages[0].items[0];
    expect(first?.kind === 'post' && first.post_id).toBe('p1');
    expect(result.current.hasNextPage).toBe(true);
    expect(apiFetch).toHaveBeenCalledWith('/posts?limit=20');
  });
});

describe('usePost', () => {
  it('fetches a single post by id', async () => {
    apiFetch.mockResolvedValueOnce({ post_id: 'p1', title: 'T', body: 'b', published: true, created_at: 'x' });
    const { result } = renderHook(() => usePost('p1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('T');
    expect(apiFetch).toHaveBeenCalledWith('/posts/p1');
  });
});
