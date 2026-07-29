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

  // #230 — the bottom notices must come BEFORE the header in the DOM, however they look on screen.
  // `position: fixed` ignores document order; assistive technology does not. Rendered last, a screen
  // reader reached them only after the whole page — worst possible ordering for the locale offer, whose
  // value is arriving early for someone who may not read the page's language.
  //
  // Asserted on document order rather than on a class, because the classes could stay identical while a
  // refactor moves the container back below the footer and nothing would notice — which is how it was
  // written in the first place.
  it('renders the bottom notices before the header in the DOM, despite sitting last on screen', () => {
    const { container } = renderShell();
    const stack = container.querySelector('.fixed.bottom-0');
    const header = container.querySelector('header');
    // Narrowed by a throw rather than `expect(...).not.toBeNull()`, which does not narrow for TypeScript
    // — and `e2e/`-style non-null assertions would hide a missing node behind a confusing crash.
    if (!stack || !header) throw new Error('AppShell must render both the bottom stack and the header');

    // Node.DOCUMENT_POSITION_FOLLOWING === 4: `header` comes after `stack`.
    expect(stack.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // The container is a direct sibling of the header — a refactor cannot satisfy the ordering by
    // nesting the stack deeper or relocating it under main/footer.
    expect(stack.parentElement).toBe(header.parentElement);

    // There is exactly ONE bottom container, and a real notice is inside it. Both halves are load-bearing:
    // without the count, splitting the notices into two containers passes (querySelector takes the first);
    // without the containment, an EMPTY container in the right place passes and the ordering asserts
    // nothing about the notices it exists to order. This is as far as the guard reaches here —
    // `analyticsConfigured()` is false under Vitest, so ConsentBanner renders null and only the locale
    // offer is observable in this tree. That the two share the container is asserted structurally
    // (one container) rather than by finding both.
    expect(container.querySelectorAll('.fixed.bottom-0')).toHaveLength(1);
    expect(screen.getByRole('region', { name: /Language suggestion|Sugestão de idioma/ }).parentElement).toBe(stack);
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
