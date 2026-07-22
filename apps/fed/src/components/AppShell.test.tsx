import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';

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

  it('carries no PWA chrome — the offline banner and install prompt are retired', () => {
    renderShell();
    expect(screen.queryByText(/Você está offline/)).toBeNull();
    expect(screen.queryByText(/[Ii]nstalar/)).toBeNull();
  });
});
