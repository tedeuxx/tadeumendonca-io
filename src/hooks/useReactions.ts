// Reactions (/frontend/state) — PUBLIC, anonymous-friendly vanity counters. The post carries the
// counts; this hook owns the live count + the viewer's own reaction (one per browser, persisted in
// localStorage). Toggling an emoji swaps the previous one. No auth (apiFetch).
import { useState } from 'react';
import { apiFetch } from '../lib/api';

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '💡'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

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

type Counts = Record<string, number>;
const send = (postId: string, emoji: string, method: 'POST' | 'DELETE') =>
  apiFetch<{ reaction_counts: Counts }>(`/posts/${postId}/reactions`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ emoji }),
  });

export function useReactions(postId: string, initial?: Counts) {
  const [counts, setCounts] = useState<Counts>(initial ?? {});
  const [mine, setMine] = useState<string | null>(() => readMine(postId));
  const [pending, setPending] = useState(false);

  const toggle = async (emoji: ReactionEmoji) => {
    if (pending) return;
    setPending(true);
    try {
      if (mine === emoji) {
        const { reaction_counts } = await send(postId, emoji, 'DELETE');
        setCounts(reaction_counts);
        setMine(null);
        writeMine(postId, null);
      } else {
        if (mine) await send(postId, mine, 'DELETE'); // swap off the previous reaction
        const { reaction_counts } = await send(postId, emoji, 'POST');
        setCounts(reaction_counts);
        setMine(emoji);
        writeMine(postId, emoji);
      }
    } catch {
      /* vanity metric — swallow transient errors */
    } finally {
      setPending(false);
    }
  };

  return { counts, mine, toggle, pending };
}
