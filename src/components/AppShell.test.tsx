import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('../auth/authStore', () => ({ useAuth }));

import { AppShell } from './AppShell';

beforeEach(() => {
  vi.clearAllMocks();
});

const renderShell = () =>
  render(
    <MemoryRouter>
      <AppShell>
        <div>child content</div>
      </AppShell>
    </MemoryRouter>,
  );

describe('AppShell', () => {
  it('renders the header title, children and the nav (compose is not in the nav)', () => {
    useAuth.mockReturnValue({ status: 'anonymous', signIn: vi.fn(), signOut: vi.fn(), isAdmin: false });
    renderShell();
    expect(screen.getByText('child content')).toBeInTheDocument();
    expect(screen.getByText('tadeumendonca')).toBeInTheDocument();
    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.queryByText('New post')).toBeNull();
  });

  it('invokes signIn from the account button when anonymous', () => {
    const signIn = vi.fn();
    useAuth.mockReturnValue({ status: 'anonymous', signIn, signOut: vi.fn(), isAdmin: false });
    renderShell();
    fireEvent.click(screen.getByText('Sign in'));
    expect(signIn).toHaveBeenCalled();
  });

  it('shows the account avatar and invokes signOut when authenticated', () => {
    const signOut = vi.fn();
    useAuth.mockReturnValue({ status: 'authenticated', email: 'a@b.io', signIn: vi.fn(), signOut, isAdmin: false });
    renderShell();
    fireEvent.click(screen.getByLabelText('Sign out'));
    expect(signOut).toHaveBeenCalled();
  });
});
