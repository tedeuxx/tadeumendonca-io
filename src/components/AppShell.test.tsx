import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('../auth/authStore', () => ({ useAuth }));

import { AppShell } from './AppShell';
import { ThemeProvider } from '../theme/ThemeProvider';

function memoryStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
  } as Storage;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('localStorage', memoryStorage());
  document.documentElement.classList.remove('dark');
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
});

const renderShell = () =>
  render(
    <ThemeProvider>
      <MemoryRouter>
        <AppShell>
          <div>child content</div>
        </AppShell>
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('AppShell', () => {
  it('renders children and the public nav, hiding admin-only items', () => {
    useAuth.mockReturnValue({ status: 'anonymous', signIn: vi.fn(), signOut: vi.fn(), isAdmin: false });
    renderShell();
    expect(screen.getByText('child content')).toBeInTheDocument();
    // Feed/Articles/Profile appear (rail + bottom = duplicated), New post does not
    expect(screen.getAllByText('Feed').length).toBeGreaterThan(0);
    expect(screen.queryByText('New post')).toBeNull();
  });

  it('shows the admin compose entry for admins', () => {
    useAuth.mockReturnValue({ status: 'authenticated', email: 'a@b.io', signIn: vi.fn(), signOut: vi.fn(), isAdmin: true });
    renderShell();
    expect(screen.getAllByText('New post').length).toBeGreaterThan(0);
  });

  it('invokes signIn from the account button when anonymous', () => {
    const signIn = vi.fn();
    useAuth.mockReturnValue({ status: 'anonymous', signIn, signOut: vi.fn(), isAdmin: false });
    renderShell();
    fireEvent.click(screen.getAllByText('Sign in')[0]);
    expect(signIn).toHaveBeenCalled();
  });

  it('toggles the theme', () => {
    useAuth.mockReturnValue({ status: 'anonymous', signIn: vi.fn(), signOut: vi.fn(), isAdmin: false });
    renderShell();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    fireEvent.click(screen.getAllByLabelText('Toggle theme')[0]);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
