import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { AppShell } from './AppShell';
import { ConsentProvider } from '../lib/consent';
import { renderWithLocale } from '../test-utils';
import { STORAGE_KEY, type Locale } from '../i18n';

// The offer's aria-label is in the SUGGESTED language, not the page's, so it is one of the two.
const OFFER_LABEL = /Language suggestion|Sugestão de idioma/;

const renderShell = (locale: Locale = 'pt') =>
  renderWithLocale(
    <AppShell>
      <div>child content</div>
    </AppShell>,
    { locale },
  );

beforeEach(() => window.localStorage.removeItem(STORAGE_KEY));
// The env stub is per-test; leaking it would silently enable the consent bar in every later render.
afterEach(() => vi.unstubAllEnvs());

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
    // nothing about the notices it exists to order.
    expect(container.querySelectorAll('.fixed.bottom-0')).toHaveLength(1);
    expect(screen.getByRole('region', { name: OFFER_LABEL }).parentElement).toBe(stack);
  });

  // The other half of #230's guarantee: BOTH notices in the one container, in the order #172 fixed.
  //
  // It needs its own render, and the reason is worth stating because the obvious one is wrong: the
  // consent bar is absent from the default tree not because analytics is unconfigured under Vitest, but
  // because `useConsent()` falls back to **'denied'** with no ConsentProvider mounted, and ConsentBanner
  // returns null on `status !== 'undecided'` before the measurement id is ever read. Both conditions have
  // to be supplied — the provider AND the id.
  //
  // Wrapping in ConsentProvider is not a contrivance: it is what `App.tsx` wraps AppShell in for real, so
  // this tree is closer to production than the bare one above.
  it('keeps both notices in the one stack, offer above consent, for an undecided reader', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST12345');
    const { container } = renderWithLocale(
      <ConsentProvider>
        <AppShell>
          <div>child content</div>
        </AppShell>
      </ConsentProvider>,
    );
    const stack = container.querySelector('.fixed.bottom-0');
    if (!stack) throw new Error('AppShell must render the bottom stack');

    const offer = screen.getByRole('region', { name: OFFER_LABEL });
    const consent = screen.getByRole('region', { name: 'Aviso de cookies' });
    expect(offer.parentElement).toBe(stack);
    expect(consent.parentElement).toBe(stack);
    // The offer sits ABOVE the consent bar, so it precedes it inside the container.
    expect(offer.compareDocumentPosition(consent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
