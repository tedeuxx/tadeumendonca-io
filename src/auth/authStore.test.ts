import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fetchAuthSession, signInWithRedirect, signOut } = vi.hoisted(() => ({
  fetchAuthSession: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('aws-amplify/auth', () => ({ fetchAuthSession, signInWithRedirect, signOut }));

import { useAuth } from './authStore';

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.setState({ status: 'loading', email: undefined, groups: [], isAdmin: false });
});

describe('authStore.init', () => {
  it('marks anonymous when there is no session', async () => {
    fetchAuthSession.mockResolvedValueOnce({ tokens: undefined });
    await useAuth.getState().init();
    expect(useAuth.getState().status).toBe('anonymous');
    expect(useAuth.getState().isAdmin).toBe(false);
  });

  it('derives email + groups + isAdmin from the id token', async () => {
    fetchAuthSession.mockResolvedValueOnce({
      tokens: { idToken: { payload: { email: 'a@b.io', 'cognito:groups': ['admin', 'registered'] } } },
    });
    await useAuth.getState().init();
    const s = useAuth.getState();
    expect(s.status).toBe('authenticated');
    expect(s.email).toBe('a@b.io');
    expect(s.isAdmin).toBe(true);
  });

  it('non-admin user is not admin', async () => {
    fetchAuthSession.mockResolvedValueOnce({ tokens: { idToken: { payload: { email: 'r@b.io', 'cognito:groups': ['registered'] } } } });
    await useAuth.getState().init();
    expect(useAuth.getState().isAdmin).toBe(false);
  });

  it('falls back to anonymous on error', async () => {
    fetchAuthSession.mockRejectedValueOnce(new Error('no session'));
    await useAuth.getState().init();
    expect(useAuth.getState().status).toBe('anonymous');
  });
});

describe('authStore.signIn', () => {
  it('triggers the hosted-UI redirect', async () => {
    signInWithRedirect.mockResolvedValueOnce(undefined);
    await useAuth.getState().signIn();
    expect(signInWithRedirect).toHaveBeenCalled();
  });
});

describe('authStore.signOut', () => {
  it('clears the session', async () => {
    signOut.mockResolvedValueOnce(undefined);
    useAuth.setState({ status: 'authenticated', email: 'a@b.io', groups: ['admin'], isAdmin: true });
    await useAuth.getState().signOut();
    expect(signOut).toHaveBeenCalled();
    expect(useAuth.getState().status).toBe('anonymous');
  });
});
