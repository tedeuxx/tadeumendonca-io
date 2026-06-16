import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { authedFetch } = vi.hoisted(() => ({ authedFetch: vi.fn() }));
vi.mock('../lib/api', () => ({ authedFetch }));

import { extractUrls, useUnfurl } from './useUnfurl';

describe('extractUrls', () => {
  it('pulls unique urls, trims trailing punctuation, caps at max', () => {
    expect(extractUrls('see https://a.com/x. then https://a.com/x and https://b.com!')).toEqual(['https://a.com/x', 'https://b.com']);
  });
  it('returns [] when there are no urls', () => {
    expect(extractUrls('plain text')).toEqual([]);
  });
});

describe('useUnfurl', () => {
  afterEach(() => vi.clearAllMocks());

  it('does nothing for a url-free body', () => {
    const { result } = renderHook(() => useUnfurl('no links', 10));
    expect(result.current.previews).toEqual([]);
    expect(authedFetch).not.toHaveBeenCalled();
  });

  it('debounces, resolves each url, and caches across edits', async () => {
    authedFetch.mockImplementation((_p: string, init: RequestInit) => {
      const { url } = JSON.parse(init.body as string) as { url: string };
      return Promise.resolve({ url, provider: 'web', title: `T:${url}` });
    });
    const { result, rerender } = renderHook(({ b }) => useUnfurl(b, 10), { initialProps: { b: 'visit https://a.com' } });

    await waitFor(() => expect(result.current.previews).toHaveLength(1));
    expect(result.current.previews[0].title).toBe('T:https://a.com');
    expect(authedFetch).toHaveBeenCalledTimes(1);

    // Editing trailing text keeps the same URL → no refetch (served from cache).
    rerender({ b: 'visit https://a.com now' });
    await waitFor(() => expect(result.current.previews).toHaveLength(1));
    expect(authedFetch).toHaveBeenCalledTimes(1);
  });
});
