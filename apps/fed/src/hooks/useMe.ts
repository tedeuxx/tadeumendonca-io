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

// Upload a new avatar. The image is sent base64-encoded in a JSON body (matches the BFF, which keeps
// the text/JSON API Gateway path); the BFF resizes it server-side and returns the updated profile.
export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (image_base64: string) =>
      authedFetch<Me>('/me/avatar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image_base64 }) }),
    onSuccess: (me) => qc.setQueryData(['me'], me), // the server echo (new avatar_key) is authoritative
  });
}

// Public URL of a stored avatar. avatar_key is feature-relative (avatars/<sub>-<hash>.png); the bytes
// are served same-origin via the CloudFront /assets/* behavior. Content-addressed, so it's safe to cache.
export function avatarUrl(avatar_key?: string): string | undefined {
  return avatar_key ? `/assets/${avatar_key}` : undefined;
}
