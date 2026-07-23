// The CV profile, resolved to the visitor's active locale. The data is STATIC and versioned in the
// SPA (../data/profile) — there is no network call. We keep the React Query wrapper (resolved from
// the static import) so consumers keep the same {data,isLoading,isError} shape.
//
// The locale is part of the query key, so toggling PT/EN re-resolves the CV instead of serving a
// cached edition in the wrong language.
import { useQuery } from '@tanstack/react-query';
import { profileSource } from '../data/profile';
import { resolveProfile } from '../data/resolveProfile';
import { useLocale } from '../i18n/context';
import type { Profile } from '../types/profile';

export function useProfile() {
  const { locale } = useLocale();
  return useQuery({
    queryKey: ['profile', locale],
    queryFn: (): Promise<Profile> => Promise.resolve(resolveProfile(profileSource, locale)),
    staleTime: Infinity,
  });
}
