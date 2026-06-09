import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { authedFetch } = vi.hoisted(() => ({ authedFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ authedFetch }));

import { useCreatePost, useSubscribe, useUnsubscribe } from './usePostMutations';

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

beforeEach(() => vi.clearAllMocks());

describe('useCreatePost', () => {
  it('POSTs the input and returns the created post', async () => {
    authedFetch.mockResolvedValueOnce({ post_id: 'p1', title: 'T' });
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    result.current.mutate({ title: 'T', body: 'b', published: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [path, init] = authedFetch.mock.calls[0];
    expect(path).toBe('/posts');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({ title: 'T', published: true });
  });
});

describe('useSubscribe / useUnsubscribe', () => {
  it('subscribe POSTs the email', async () => {
    authedFetch.mockResolvedValueOnce({ email: 'a@b.io', status: 'active' });
    const { result } = renderHook(() => useSubscribe(), { wrapper });
    result.current.mutate('a@b.io');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(authedFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('unsubscribe DELETEs the email', async () => {
    authedFetch.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useUnsubscribe(), { wrapper });
    result.current.mutate('a@b.io');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(authedFetch.mock.calls[0][1].method).toBe('DELETE');
  });
});
