// Reactions (/frontend/state) — PUBLIC, anonymous-friendly vanity counters. The post carries the
// counts; this hook owns the live count + the viewer's own reaction (one per browser, persisted in
// localStorage). Toggling an emoji swaps the previous one. No auth.
//
// Offline-first: each send is a React Query mutation keyed 'reaction' (request fn + reconcile live in
// the persisted mutation defaults, src/lib/offline.ts), so a tap made offline updates the count
// optimistically and is replayed on reconnect / next launch. A swap is two sends (DELETE old, POST new)
// queued in order.
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ReactionVars } from '../lib/offline';

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '💡'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

type Counts = Record<string, number>;

const lsKey = (postId: string) => `reaction:${postId}`;
const readMine = (postId: string): string | null => {
  try {
    return localStorage.getItem(lsKey(postId));
  } catch {
    return null;
  }
};
const writeMine = (postId: string, emoji: string | null) => {
  try {
    if (emoji) localStorage.setItem(lsKey(postId), emoji);
    else localStorage.removeItem(lsKey(postId));
  } catch {
    /* private mode / disabled storage — best-effort */
  }
};
const dec = (c: Counts, e: string): Counts => ({ ...c, [e]: Math.max(0, (c[e] ?? 0) - 1) });
const inc = (c: Counts, e: string): Counts => ({ ...c, [e]: (c[e] ?? 0) + 1 });

export function useReactions(postId: string, initial?: Counts) {
  const [counts, setCounts] = useState<Counts>(initial ?? {});
  const [mine, setMine] = useState<string | null>(() => readMine(postId));
  // The keyed 'reaction' default carries the request fn; on a live success the server's authoritative
  // counts replace the optimistic ones (offline replays reconcile via the default's query invalidation).
  const send = useMutation<{ reaction_counts: Counts }, unknown, ReactionVars>({
    mutationKey: ['reaction'],
    onSuccess: (data) => {
      if (data?.reaction_counts) setCounts(data.reaction_counts);
    },
  });
  const busy = send.isPending && !send.isPaused; // paused = queued offline; don't lock the UI for that

  const toggle = (emoji: ReactionEmoji) => {
    if (busy) return;
    if (mine === emoji) {
      setCounts((c) => dec(c, emoji)); // optimistic remove
      setMine(null);
      writeMine(postId, null);
      send.mutate({ postId, emoji, method: 'DELETE' });
    } else {
      const prev = mine;
      setCounts((c) => inc(prev ? dec(c, prev) : c, emoji)); // optimistic swap
      setMine(emoji);
      writeMine(postId, emoji);
      if (prev) send.mutate({ postId, emoji: prev, method: 'DELETE' });
      send.mutate({ postId, emoji, method: 'POST' });
    }
  };

  return { counts, mine, toggle, pending: busy, isPaused: send.isPaused };
}
