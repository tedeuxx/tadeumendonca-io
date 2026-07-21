// CV profile (Site Fase A — reframe-first). The profile is now STATIC, versioned in the SPA
// (../data/profile) — the BFF is no longer on the critical path for the CV. We keep the React Query
// wrapper (resolved from the static import, no network) so consumers keep the same {data,isLoading,
// isError} shape and the profile still participates in the offline-persisted cache.
import { useQuery } from '@tanstack/react-query';
import { profile } from '../data/profile';
import type { Profile } from '../types/profile';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: (): Promise<Profile> => Promise.resolve(profile),
    staleTime: Infinity,
  });
}
