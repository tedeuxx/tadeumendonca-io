import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('../auth/authStore', () => ({ useAuth }));
// The aside's PollWidget queries the BFF — stub it to "no active poll" so it renders nothing and the
// shell tests stay focused on the chrome (the real app supplies the QueryClientProvider at the root).
// authedFetch backs useMe (the account avatar); resolve an empty profile so no avatar_key → initial.
vi.mock('../lib/api', () => ({ apiFetch: vi.fn().mockResolvedValue({ items: [] }), authedFetch: vi.fn().mockResolvedValue({}) }));

import { AppShell } from './AppShell';

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => act(() => onlineManager.setOnline(true)));

const renderShell = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <AppShell>
          <div>child content</div>
        </AppShell>
      </MemoryRouter>
    </QueryClientProvider>,
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

  it('shows an offline banner only while connectivity is down', () => {
    useAuth.mockReturnValue({ status: 'anonymous', signIn: vi.fn(), signOut: vi.fn(), isAdmin: false });
    renderShell();
    expect(screen.queryByText(/Você está offline/)).toBeNull(); // online → hidden
    act(() => onlineManager.setOnline(false));
    expect(screen.getByText(/Você está offline/)).toBeInTheDocument();
  });

  it('invokes signIn from the account button when anonymous', () => {
    const signIn = vi.fn();
    useAuth.mockReturnValue({ status: 'anonymous', signIn, signOut: vi.fn(), isAdmin: false });
    renderShell();
    fireEvent.click(screen.getByText('Entrar'));
    expect(signIn).toHaveBeenCalled();
  });

  it('shows the account avatar and invokes signOut when authenticated', () => {
    const signOut = vi.fn();
    useAuth.mockReturnValue({ status: 'authenticated', email: 'a@b.io', signIn: vi.fn(), signOut, isAdmin: false });
    renderShell();
    expect(screen.getByLabelText('Minha conta')).toHaveTextContent('A'); // no avatar yet → email initial
    fireEvent.click(screen.getByLabelText('Sair'));
    expect(signOut).toHaveBeenCalled();
  });
});
