import { describe, it, expect, vi, beforeEach } from 'vitest';

const { apiFetch, authedFetch } = vi.hoisted(() => ({ apiFetch: vi.fn(), authedFetch: vi.fn() }));
vi.mock('./api', () => ({ apiFetch, authedFetch }));

import { queryClient, persister, type ReactionVars, type CommentVars } from './offline';

const reactionDefaults = () => queryClient.getMutationDefaults(['reaction'])!;
const commentDefaults = () => queryClient.getMutationDefaults(['comment'])!;

beforeEach(() => vi.clearAllMocks());

describe('offline mutation defaults', () => {
  it('reaction default sends to the post reactions endpoint with the given method', async () => {
    apiFetch.mockResolvedValueOnce({ reaction_counts: {} });
    const fn = reactionDefaults().mutationFn as (v: ReactionVars) => Promise<unknown>;
    await fn({ postId: 'p1', emoji: '👍', method: 'DELETE' });
    expect(apiFetch).toHaveBeenCalledWith('/posts/p1/reactions', expect.objectContaining({ method: 'DELETE' }));
    expect(JSON.parse((apiFetch.mock.calls[0][1] as RequestInit).body as string)).toEqual({ emoji: '👍' });
  });

  it('comment default POSTs via authedFetch (fresh token at replay time)', async () => {
    authedFetch.mockResolvedValueOnce({});
    const fn = commentDefaults().mutationFn as (v: CommentVars) => Promise<unknown>;
    await fn({ postId: 'p1', body: 'oi', author_name: 'A' });
    expect(authedFetch).toHaveBeenCalledWith('/posts/p1/comments', expect.objectContaining({ method: 'POST' }));
  });

  it('reaction onSuccess reconciles feed + post', () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries').mockReturnValue(Promise.resolve());
    const onSuccess = reactionDefaults().onSuccess as (d: unknown, v: ReactionVars) => void;
    onSuccess(null, { postId: 'p1', emoji: '👍', method: 'POST' });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['feed'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['post', 'p1'] });
    spy.mockRestore();
  });

  it('comment onSuccess refreshes the comment list + post', () => {
    const spy = vi.spyOn(queryClient, 'invalidateQueries').mockReturnValue(Promise.resolve());
    const onSuccess = commentDefaults().onSuccess as (d: unknown, v: CommentVars) => void;
    onSuccess(null, { postId: 'p1', body: 'oi', author_name: 'A' });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['comments', 'p1'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['post', 'p1'] });
    spy.mockRestore();
  });

  it('exposes an IndexedDB persister', () => {
    expect(persister).toBeTruthy();
    expect(typeof persister.persistClient).toBe('function');
  });
});
