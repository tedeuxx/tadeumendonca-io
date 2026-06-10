import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';

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
  vi.stubGlobal('localStorage', memoryStorage());
  document.documentElement.classList.remove('dark');
  // default OS preference: not light → dark-first
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
});

function Probe() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label="toggle">
      {theme}
    </button>
  );
}

describe('ThemeProvider', () => {
  it('defaults to dark and sets the .dark class', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'toggle' })).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('toggles to light, removes the class, and persists', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByRole('button', { name: 'toggle' })).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('honors a saved preference', () => {
    localStorage.setItem('theme', 'light');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'toggle' })).toHaveTextContent('light');
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(/within ThemeProvider/);
  });
});
