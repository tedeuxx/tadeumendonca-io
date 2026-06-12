// Offline-first wiring (/frontend/state) — the QueryClient is persisted to IndexedDB so the feed/
// articles the viewer already loaded stay readable offline, and reaction/comment mutations made while
// offline are PAUSED, persisted, and replayed on reconnect (or on next launch). The mutation request
// functions live here as keyed defaults — a persisted paused mutation only stores its key + variables,
// so resuming it after a reload needs the function (and the cache-invalidation) to be reattachable by
// key, even when the originating component is gone. `authedFetch` re-fetches a fresh token at replay
// time, so a comment queued while offline still authenticates when it finally sends.
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';
import { apiFetch, authedFetch } from './api';

const DAY = 1000 * 60 * 60 * 24;
export const PERSIST_MAX_AGE = 7 * DAY;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, gcTime: PERSIST_MAX_AGE },
    // Default networkMode 'online' pauses mutations while offline and auto-resumes on reconnect — the
    // buffer we want. No retries: connectivity is handled by pausing, not by hammering.
    mutations: { retry: 0 },
  },
});

export type ReactionVars = { postId: string; emoji: string; method: 'POST' | 'DELETE' };
export type CommentVars = { postId: string; body: string; author_name: string };

// Keyed mutation defaults carry the request fn + reconciliation so a persisted, paused mutation can
// replay after a full reload (when the originating hook is long gone). Installed on a passed client so
// the same wiring is reusable in tests; onSuccess closes over that client. Variables hold everything
// the request needs (postId etc.), since that's all the persisted mutation keeps.
export function installMutationDefaults(client: QueryClient): void {
  // Reactions — public (no auth) vanity counters; reconcile feed/post to the server's authoritative
  // counts (matters when a queued reaction finally lands after reload).
  client.setMutationDefaults(['reaction'], {
    mutationFn: (vars: ReactionVars) =>
      apiFetch(`/posts/${vars.postId}/reactions`, {
        method: vars.method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ emoji: vars.emoji }),
      }),
    onSuccess: (_data: unknown, vars: ReactionVars) => {
      void client.invalidateQueries({ queryKey: ['feed'] });
      void client.invalidateQueries({ queryKey: ['post', vars.postId] });
    },
  });
  // Comments — authenticated + post-moderated; refresh the list + the post's denormalized count.
  // authedFetch attaches a fresh Bearer at call time, so replays after reload still authenticate.
  client.setMutationDefaults(['comment'], {
    mutationFn: (vars: CommentVars) =>
      authedFetch(`/posts/${vars.postId}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: vars.body, author_name: vars.author_name }),
      }),
    onSuccess: (_data: unknown, vars: CommentVars) => {
      void client.invalidateQueries({ queryKey: ['comments', vars.postId] });
      void client.invalidateQueries({ queryKey: ['post', vars.postId] });
    },
  });
}

installMutationDefaults(queryClient);

// IndexedDB-backed persister (idb-keyval) — async, off the main thread, far larger quota than
// localStorage, and reachable from the SW if ever needed.
export const persister = createAsyncStoragePersister({
  storage: { getItem: get, setItem: set, removeItem: del },
  key: 'tmio-react-query-cache',
});
