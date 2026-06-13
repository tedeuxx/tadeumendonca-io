// The signed-in user's own account (/frontend/api-client). GET /me reads the caller's profile +
// communication prefs; PUT /me upserts them. Both are authed (authedFetch attaches the Bearer); the
// BFF identifies the caller by their token sub, so these only ever touch the caller's own record.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authedFetch } from '../lib/api';

export type DigestSchedule = 'daily' | 'weekly';

export interface Me {
  cognito_sub: string;
  nickname?: string;
  avatar_key?: string;
  newsletter_opt_in: boolean;
  newsletter_schedule?: DigestSchedule;
  created_at: string;
  updated_at?: string;
}

export interface MeInput {
  nickname?: string;
  newsletter_opt_in: boolean;
  newsletter_schedule?: DigestSchedule;
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => authedFetch<Me>('/me') });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MeInput) => authedFetch<Me>('/me', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }),
    onSuccess: (me) => qc.setQueryData(['me'], me), // the server echo is authoritative
  });
}
