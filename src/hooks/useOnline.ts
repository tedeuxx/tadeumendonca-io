// Connectivity state (/frontend/state) — subscribes to React Query's onlineManager (the same source
// that pauses/resumes offline mutations), so the UI's notion of "online" never disagrees with the
// buffer's. SSR/first paint assumes online.
import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true,
  );
}
