import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('./authStore', () => ({ useAuth }));

import { RequireAuth } from './RequireAuth';

const Child = () => <div>secret</div>;
beforeEach(() => vi.clearAllMocks());

describe('RequireAuth', () => {
  it('renders children for an authenticated admin', () => {
    useAuth.mockReturnValue({ status: 'authenticated', isAdmin: true, signIn: vi.fn() });
    render(
      <RequireAuth admin>
        <Child />
      </RequireAuth>,
    );
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('blocks a non-admin from an admin route', () => {
    useAuth.mockReturnValue({ status: 'authenticated', isAdmin: false, signIn: vi.fn() });
    render(
      <RequireAuth admin>
        <Child />
      </RequireAuth>,
    );
    expect(screen.queryByText('secret')).toBeNull();
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });

  it('redirects an anonymous user to sign in', () => {
    const signIn = vi.fn();
    useAuth.mockReturnValue({ status: 'anonymous', isAdmin: false, signIn });
    render(
      <RequireAuth>
        <Child />
      </RequireAuth>,
    );
    expect(signIn).toHaveBeenCalled();
    expect(screen.queryByText('secret')).toBeNull();
  });
});
