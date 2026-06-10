// Auth session state (/frontend/state, /frontend/authentication). Zustand holds the derived session
// (email + groups + isAdmin); the Cognito SDK owns the actual tokens. UI gating off `isAdmin` is
// COSMETIC — the BFF re-checks the group server-side. `init()` hydrates from the current SDK session.
import { create } from 'zustand';
import { fetchAuthSession, signInWithRedirect, signOut } from 'aws-amplify/auth';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  status: Status;
  email?: string;
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
        email: payload.email as string | undefined,
        groups,
        isAdmin: groups.includes('admin'),
      });
    } catch {
      set({ status: 'anonymous', email: undefined, groups: [], isAdmin: false });
    }
  },

  signIn: () => signInWithRedirect({ provider: 'Google' }), // social-only → straight to Google (PKCE)

  signOut: async () => {
    await signOut();
    set({ status: 'anonymous', email: undefined, groups: [], isAdmin: false });
  },
}));
