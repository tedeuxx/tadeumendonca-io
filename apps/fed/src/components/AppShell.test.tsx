import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { onlineManager } from '@tanstack/react-query';
import { AppShell } from './AppShell';

afterEach(() => act(() => onlineManager.setOnline(true)));

const renderShell = () =>
  render(
    <MemoryRouter>
      <AppShell>
        <div>child content</div>
      </AppShell>
    </MemoryRouter>,
  );

describe('AppShell', () => {
  it('renders the brand, children and the static nav (no auth, no feed)', () => {
    renderShell();
    expect(screen.getByText('child content')).toBeInTheDocument();
    expect(screen.getByText('tadeumendonca')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Quem Sou/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Portfólio/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Blog/ })).toBeInTheDocument();
    expect(screen.queryByText('Feed')).toBeNull();
    expect(screen.queryByText('Entrar')).toBeNull();
  });

  it('shows an offline banner only while connectivity is down', () => {
    renderShell();
    expect(screen.queryByText(/Você está offline/)).toBeNull(); // online → hidden
    act(() => onlineManager.setOnline(false));
    expect(screen.getByText(/Você está offline/)).toBeInTheDocument();
  });
});
