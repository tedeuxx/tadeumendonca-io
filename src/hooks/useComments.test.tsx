import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { apiFetch, authedFetch } = vi.hoisted(() => ({ apiFetch: vi.fn(), authedFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ apiFetch, authedFetch }));

import { usePostComments, useCreateComment, useDeleteComment } from './useComments';

let qc: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

beforeEach(() => {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => vi.clearAllMocks());

describe('useComments', () => {
  it('fetches a post’s comments (public, paginated)', async () => {
    apiFetch.mockResolvedValueOnce({ items: [{ comment_id: 'c1', post_id: 'p1', author_sub: 'u', author_name: 'Ana', body: 'hi', created_at: 't' }] });
    const { result } = renderHook(() => usePostComments('p1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiFetch).toHaveBeenCalledWith('/posts/p1/comments?limit=20');
    expect(result.current.data?.pages[0].items).toHaveLength(1);
  });

  it('creates a comment and invalidates the list + post', async () => {
    authedFetch.mockResolvedValueOnce({});
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateComment('p1'), { wrapper });
    result.current.mutate({ body: 'nice', author_name: 'Ana' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(authedFetch).toHaveBeenCalledWith('/posts/p1/comments', expect.objectContaining({ method: 'POST' }));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['comments', 'p1'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['post', 'p1'] });
  });

  it('deletes a comment', async () => {
    authedFetch.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDeleteComment('p1'), { wrapper });
    result.current.mutate('c1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(authedFetch).toHaveBeenCalledWith('/comments/c1', { method: 'DELETE' });
  });
});
