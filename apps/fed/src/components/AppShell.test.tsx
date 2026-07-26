import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { AppShell } from './AppShell';
import { renderWithLocale } from '../test-utils';
import { STORAGE_KEY, type Locale } from '../i18n';

const renderShell = (locale: Locale = 'pt') =>
  renderWithLocale(
    <AppShell>
      <div>child content</div>
    </AppShell>,
    { locale },
  );

beforeEach(() => window.localStorage.removeItem(STORAGE_KEY));

describe('AppShell', () => {
  it('renders the brand, children and the static nav (no auth, no feed)', () => {
    renderShell();
    expect(screen.getByText('child content')).toBeInTheDocument();
    expect(screen.getByText('tadeumendonca')).toBeInTheDocument();
    expect(screen.queryByText('Feed')).toBeNull();
    expect(screen.queryByText('Entrar')).toBeNull();
  });

  // Per-locale URLs (ADR-0036): the nav stays within the active locale — anchors and routes are prefixed.
  it('prefixes the landing anchors and the /me route with the active locale', () => {
    renderShell();
    expect(screen.getByRole('link', { name: 'Artigos' })).toHaveAttribute('href', '/pt/#artigos');
    expect(screen.getByRole('link', { name: 'Portfólio' })).toHaveAttribute('href', '/pt/#portfolio');
    expect(screen.getByRole('link', { name: 'Contato' })).toHaveAttribute('href', '/pt/#contato');
    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/pt/me');
  });

  it('toggles the mobile menu, rendering a second copy of the nav links', () => {
    renderShell();
    const toggle = screen.getByRole('button', { name: 'Abrir menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('link', { name: 'Artigos' })).toHaveLength(1);

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link', { name: 'Artigos' })).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('link', { name: 'Artigos' })[1]);
    expect(screen.getAllByRole('link', { name: 'Artigos' })).toHaveLength(1); // closes on navigate
  });

  it('carries no PWA chrome — the offline banner and install prompt are retired', () => {
    renderShell();
    expect(screen.queryByText(/Você está offline/)).toBeNull();
    expect(screen.queryByText(/[Ii]nstalar/)).toBeNull();
  });

  it('renders a PT/EN toggle that marks the active locale', () => {
    renderShell('pt');
    expect(screen.getByRole('button', { name: 'PT' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches locale on toggle, persists the choice, and re-renders the nav', () => {
    renderShell('pt');
    expect(screen.getByRole('link', { name: 'Artigos' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(screen.getByRole('link', { name: 'Articles' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Artigos' })).toBeNull();
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('en');
  });

  it('renders English nav chrome under the /en prefix when the active locale is en', () => {
    renderShell('en');
    expect(screen.getByRole('link', { name: 'Articles' })).toHaveAttribute('href', '/en/#artigos');
    expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', '/en/#portfolio');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/en/#contato');
  });
});
