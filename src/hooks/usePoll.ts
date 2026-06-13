// Poll / "enquete" (/frontend/state) — PUBLIC, anonymous. The aside shows the current poll (the newest
// published one). Voting is one-per-browser, persisted in localStorage, and FINAL (no swap/undo — the
// server can't dedupe anonymous votes, so the client enforces it); results are revealed only after the
// viewer votes. snake_case mirrors the BFF (poll_id, vote_counts, option ids).
//
// Offline-first: the vote is a React Query mutation keyed 'vote' (request fn + reconcile live in the
// persisted mutation defaults, src/lib/offline.ts), so a vote cast offline updates optimistically and
// replays on reconnect / next launch.
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { VoteVars } from '../lib/offline';

export interface PollOption {
  id: string;
  label: string;
}

export interface Poll {
  poll_id: string;
  question: string;
  options: PollOption[];
  vote_counts?: Record<string, number>;
  published: boolean;
  created_at: string;
}

interface PollList {
  items: Poll[];
  next_cursor?: string;
}

// The current poll = the newest published poll (the aside surfaces one). `undefined` when there's none.
export function useCurrentPoll() {
  const q = useQuery<PollList>({ queryKey: ['polls'], queryFn: () => apiFetch<PollList>('/polls?limit=1') });
  return { poll: q.data?.items?.[0], isLoading: q.isLoading, isError: q.isError };
}

type Counts = Record<string, number>;

const lsKey = (pollId: string) => `poll:${pollId}`;
const readMine = (pollId: string): string | null => {
  try {
    return localStorage.getItem(lsKey(pollId));
  } catch {
    return null;
  }
};
const writeMine = (pollId: string, optionId: string) => {
  try {
    localStorage.setItem(lsKey(pollId), optionId);
  } catch {
    /* private mode / disabled storage — best-effort */
  }
};
const inc = (c: Counts, id: string): Counts => ({ ...c, [id]: (c[id] ?? 0) + 1 });

// Vote state for a single poll. `mine` is the option the viewer chose (from localStorage); `voted`
// gates the results view. A cast vote is final — `vote` is a no-op once the viewer has voted.
export function usePollVote(poll: Poll) {
  const [counts, setCounts] = useState<Counts>(poll.vote_counts ?? {});
  const [mine, setMine] = useState<string | null>(() => readMine(poll.poll_id));
  // The keyed 'vote' default carries the request fn; on a live success the server's authoritative counts
  // replace the optimistic ones (offline replays reconcile via the default's query invalidation).
  const send = useMutation<{ vote_counts: Counts }, unknown, VoteVars>({
    mutationKey: ['vote'],
    onSuccess: (data) => {
      if (data?.vote_counts) setCounts(data.vote_counts);
    },
  });
  const busy = send.isPending && !send.isPaused; // paused = queued offline; don't lock the UI for that

  const vote = (optionId: string) => {
    if (busy || mine) return; // already voted (or in-flight) — a vote is final
    setCounts((c) => inc(c, optionId)); // optimistic
    setMine(optionId);
    writeMine(poll.poll_id, optionId);
    send.mutate({ pollId: poll.poll_id, optionId });
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, mine, voted: mine !== null, vote, total, pending: busy };
}
