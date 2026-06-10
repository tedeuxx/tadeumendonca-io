// Auth session state (/frontend/state, /frontend/authentication). Zustand holds the derived session
// (email + groups + isAdmin); the Cognito SDK owns the actual tokens. UI gating off `isAdmin` is
// COSMETIC — the BFF re-checks the group server-side. `init()` hydrates from the current SDK session.
import { create } from 'zustand';
import { fetchAuthSession, signInWithRedirect, signOut } from 'aws-amplify/auth';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  status: Status;
  sub?: string; // Cognito subject — used to mark the user's own comments
  email?: string;
  name?: string; // display name (Google) — sent with comments
  groups: string[];
  isAdmin: boolean;
  init: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  groups: [],
  isAdmin: false,

  init: async () => {
    try {
      const session = await fetchAuthSession();
      const payload = session.tokens?.idToken?.payload;
      if (!payload) {
        set({ status: 'anonymous', email: undefined, groups: [], isAdmin: false });
        return;
      }
      const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];
      set({
        status: 'authenticated',
        sub: payload.sub as string | undefined,
        email: payload.email as string | undefined,
        name: payload.name as string | undefined,
        groups,
        isAdmin: groups.includes('admin'),
      });
    } catch {
      set({ status: 'anonymous', sub: undefined, email: undefined, name: undefined, groups: [], isAdmin: false });
    }
  },

  signIn: () => signInWithRedirect({ provider: 'Google' }), // social-only → straight to Google (PKCE)

  signOut: async () => {
    await signOut();
    set({ status: 'anonymous', sub: undefined, email: undefined, name: undefined, groups: [], isAdmin: false });
  },
}));
