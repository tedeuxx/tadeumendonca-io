// Server state for the CV profile (React Query). The BFF caches/serves it; the SPA just fetches.
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Profile } from '../types/profile';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch<Profile>('/profile'),
    staleTime: 5 * 60 * 1000,
  });
}
