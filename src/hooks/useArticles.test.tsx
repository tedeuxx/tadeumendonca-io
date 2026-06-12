import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { apiFetch, authedFetch } = vi.hoisted(() => ({ apiFetch: vi.fn(), authedFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ apiFetch, authedFetch }));

import { useArticles, useArticle, useCreateArticle, useUpdateArticle, useDeleteArticle } from './useArticles';

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

beforeEach(() => vi.clearAllMocks());

describe('useArticles', () => {
  it('lists all articles when no tag', async () => {
    apiFetch.mockResolvedValueOnce({ items: [{ slug: 's1' }] });
    const { result } = renderHook(() => useArticles(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiFetch).toHaveBeenCalledWith('/articles?limit=20');
  });
  it('passes the tag filter', async () => {
    apiFetch.mockResolvedValueOnce({ items: [] });
    const { result } = renderHook(() => useArticles('aws'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiFetch).toHaveBeenCalledWith('/articles?limit=20&tag=aws');
  });
});

describe('useArticle', () => {
  it('fetches by slug', async () => {
    apiFetch.mockResolvedValueOnce({ slug: 's1', title: 'T' });
    const { result } = renderHook(() => useArticle('s1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiFetch).toHaveBeenCalledWith('/articles/s1');
  });
});

describe('useCreateArticle', () => {
  it('POSTs the input', async () => {
    authedFetch.mockResolvedValueOnce({ slug: 'new', article_id: 'a1' });
    const { result } = renderHook(() => useCreateArticle(), { wrapper });
    result.current.mutate({ title: 'T', body: 'b', tag: 'aws', published: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(authedFetch.mock.calls[0][0]).toBe('/articles');
    expect(authedFetch.mock.calls[0][1].method).toBe('POST');
  });
});

describe('useUpdateArticle', () => {
  it('PUTs the input to the current slug', async () => {
    authedFetch.mockResolvedValueOnce({ slug: 'building', article_id: 'a1' });
    const { result } = renderHook(() => useUpdateArticle('building'), { wrapper });
    result.current.mutate({ title: 'T2', body: 'b', tag: 'aws', published: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(authedFetch.mock.calls[0][0]).toBe('/articles/building');
    expect(authedFetch.mock.calls[0][1].method).toBe('PUT');
  });
});

describe('useDeleteArticle', () => {
  it('DELETEs by slug', async () => {
    authedFetch.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDeleteArticle(), { wrapper });
    result.current.mutate('building');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(authedFetch.mock.calls[0][0]).toBe('/articles/building');
    expect(authedFetch.mock.calls[0][1].method).toBe('DELETE');
  });
});
