import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { AppShell } from './AppShell';
import { ConsentProvider } from '../lib/consent';
import { renderWithLocale } from '../test-utils';
import { STORAGE_KEY, type Locale } from '../i18n';
import { SITE_VERSION, releaseUrl } from '../lib/version';

// The offer's aria-label is in the SUGGESTED language, not the page's, so it is one of the two.
const OFFER_LABEL = /Language suggestion|Sugestão de idioma/;

const renderShell = (locale: Locale = 'pt', initialPath?: string) =>
  renderWithLocale(
    <AppShell>
      <div>child content</div>
    </AppShell>,
    { locale, initialPath },
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
    expect(screen.getByRole('link', { name: 'Portfólio' })).toHaveAttribute('href', '/pt/portfolio');
    expect(screen.getByRole('link', { name: 'Contato' })).toHaveAttribute('href', '/pt/#contato');
    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/pt/me');
    // #166's second slice. The route shipped one slice earlier with no nav entry at all, deliberately —
    // this asserts the entry exists AND is locale-prefixed, since the surface's whole reason for a shared
    // English slug is that the PREFIX is what carries the language.
    expect(screen.getByRole('link', { name: 'Biblioteca' })).toHaveAttribute('href', '/pt/library');
  });

  // The label is bilingual even though the slug is not (ADR-0036's 2026-08-05 amendment), so "Biblioteca"
  // is the one place a Portuguese reader meets the surface's own name. Asserted in both editions because
  // a missing catalog entry renders the KEY, which looks like a label and reads as one at a glance.
  it('names the shelf in the visitor’s language while both editions share the slug', () => {
    const { unmount } = renderShell();
    expect(screen.getByRole('link', { name: 'Biblioteca' })).toHaveAttribute('href', '/pt/library');
    expect(screen.queryByRole('link', { name: 'Library' })).toBeNull();
    unmount();

    renderShell('en');
    expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute('href', '/en/library');
    expect(screen.queryByRole('link', { name: 'Biblioteca' })).toBeNull();
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
  // It needs its own render because in the default tree NEITHER of ConsentBanner's two conditions holds:
  // there is no `.env*` in apps/fed so the measurement id is unset, AND `useConsent()` falls back to
  // 'denied' with no ConsentProvider mounted. Either one alone is enough to render it null, so both have
  // to be supplied here. Worth spelling out because supplying only one looks like it should work and
  // silently does not — the guard would then assert nothing about the consent bar while appearing to.
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
    expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', '/en/portfolio');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/en/#contato');
  });

  // #315. The nav entry named after the catalog used to land on the landing's SHORTLIST of it, one
  // further click from the real thing. Both assertions above now pin the route, and the two below pin
  // what that change must NOT have cost.
  //
  // Written as a pair on purpose: the defect this replaced was a link that WORKED — it scrolled, it
  // highlighted, it looked designed — so "the link resolves" was never the failing property. What
  // failed was WHERE it resolved to. An assertion that only checks the new href would go green on a
  // regression that took the anchor away with it.
  it('is a react-router route, not a plain anchor — so it does not full-load back to the landing', () => {
    renderShell('pt');
    const portfolio = screen.getByRole('link', { name: 'Portfólio' });
    // The href is what distinguishes the route from the anchor it replaced — NOT the border, which
    // used to encode `route: true` and no longer encodes anything (#346, and the nav-border test
    // below). The active-state coverage is separate (`text-foreground` / `aria-current`), in the two
    // tests that follow: this one must not be allowed to stand in for it.
    expect(portfolio).toHaveAttribute('href', '/pt/portfolio');
    expect(screen.getByRole('link', { name: 'Artigos' })).toHaveAttribute('href', '/pt/#artigos');
  });

  // The active state was an owner acceptance criterion, and the entry SWAPPED MECHANISMS to satisfy
  // it. It used to carry `section: 'portfolio'`, so `useActiveSection` scroll-spied the landing region
  // and set `aria-current="true"`. As a route it is react-router's `isActive`, which sets
  // `aria-current="page"`. Different attribute VALUE, different trigger, same visible affordance —
  // exactly the kind of swap that keeps looking right while the thing a screen reader announces
  // changes underneath it.
  it('marks the Portfolio entry current while the reader is ON the catalog route', () => {
    renderShell('pt', '/pt/portfolio');
    const portfolio = screen.getByRole('link', { name: 'Portfólio' });
    expect(portfolio).toHaveAttribute('aria-current', 'page');
    expect(portfolio.className).toContain('text-foreground');
  });

  // The negative half, which is the one that fails if `isActive` is ever loosened to a prefix match:
  // on the landing NOTHING should mark it, because the reader is not there.
  it('does not mark it current on the landing, where the section is only a teaser', () => {
    renderShell('pt', '/pt');
    const portfolio = screen.getByRole('link', { name: 'Portfólio' });
    expect(portfolio).not.toHaveAttribute('aria-current');
    expect(portfolio.className).not.toContain('text-foreground');
  });

  it('leaves #portfolio a live landing anchor — the section stayed, only the nav entry moved', () => {
    renderShell('pt');
    // No nav entry points at it any more, so nothing should mark it while scrolling. `SECTIONS` is what
    // useActiveSection observes, and it is derived from NAV — the risk is that removing the entry is
    // read as removing the section. LandingPage still renders `id="portfolio"` (asserted in e2e); here
    // we pin that the nav no longer CLAIMS it, which is the half this file owns.
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).not.toContain('/pt/#portfolio');
    expect(hrefs).toContain('/pt/portfolio');
  });

  // #346. The border used to encode what an entry IS: `route: true` rendered `border border-border`,
  // the two landing anchors rendered none. With those anchors sitting at positions 1 and 3, the rule
  // came out as an ALTERNATING border, which reads as a glitch rather than as a cue — and the border
  // never carried the distinction for a screen-reader user at all. The decision is that it is chrome:
  // every item carries it, and route-vs-anchor stays expressed by `aria-current` (`page` from the
  // router, `true` from the scroll-spy), which is the mechanism that was always doing the work.
  //
  // Asserted across the WHOLE nav, not on the two entries that changed. The defect class here is "one
  // item differs from the rest", so pinning only yesterday's two would leave the next divergence
  // uncovered — including the reverse of this change, a border removed from one route entry.
  //
  // Both copies are checked because the mobile menu is a second live mount of NavItems, not a restyling
  // of the desktop one; a change that reached only one of them is a real, shippable outcome.
  const NAV_LABELS = ['Artigos', 'Portfólio', 'Contato', 'Ramp-up', 'Arquitetura', 'Biblioteca', 'Perfil'];

  it('borders every nav item, in the desktop bar and in the mobile menu alike', () => {
    renderShell('pt');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));

    for (const name of NAV_LABELS) {
      const copies = screen.getAllByRole('link', { name });
      // Pinned at two so the loop cannot pass by inspecting a single copy: with the menu open both
      // renderings are mounted, and an entry present in only one of them is exactly the half-applied
      // change this test exists to catch.
      expect(copies, `${name} should render in both the desktop bar and the mobile menu`).toHaveLength(2);
      for (const link of copies) {
        expect(link.className, `${name} must carry the nav border`).toContain('border-border');
      }
    }
  });

  // The other half: the border is UNCONDITIONAL. Making it appear on the active entry would satisfy
  // "every item is bordered" on some page and re-create the same visual inconsistency on every other,
  // so the active entry and an inactive neighbour are compared side by side on the same render.
  it('keeps the border unconditional — the active entry is marked by colour, not by gaining a border', () => {
    renderShell('pt', '/pt/portfolio');
    const portfolio = screen.getByRole('link', { name: 'Portfólio' });
    const articles = screen.getByRole('link', { name: 'Artigos' });

    expect(portfolio.className).toContain('border-border');
    expect(portfolio.className).toContain('text-foreground');
    // Inactive, bordered identically — 'text-muted-foreground' does not contain 'text-foreground', so
    // this negative is real rather than an accident of substring matching.
    expect(articles.className).toContain('border-border');
    expect(articles.className).not.toContain('text-foreground');
  });
});

// The skip link (#250). The defect it guards is not "the link is missing" — it is a link that exists,
// looks right, and leaves focus behind, so the next Tab returns to the nav it was supposed to skip.
describe('skip link', () => {
  it('is the FIRST focusable element in the document, ahead of the notices and the nav', () => {
    const { container } = renderShell('pt');
    const focusable = container.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
    expect(focusable.length).toBeGreaterThan(1); // otherwise "first" is vacuous
    expect(focusable[0]).toHaveAttribute('href', '#main');
    expect(focusable[0]).toHaveTextContent('Pular para o conteúdo');
  });

  it('targets a main region that can HOLD focus, not just receive a scroll', () => {
    const { container } = renderShell('pt');
    const main = container.querySelector('main');
    // Without tabIndex the browser scrolls and focus stays on the link — the failure that makes a skip
    // link look present and do nothing. Asserting the attribute is asserting the behaviour's precondition.
    expect(main).toHaveAttribute('id', 'main');
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  // The version lives in the SHELL footer, not the landing's colophon, and that placement is the point:
  // this footer is on every route, so /architecture and /me carry it too. It was in ContactFooter first,
  // which renders only on the landing — so the page the feature exists for did not have it.
  //
  // The semver SHAPE is asserted first, and the ordering matters. A test cannot independently know the
  // version — any assertion reads the same file the component does, so comparing them proves only that
  // both read something. Without this line an empty import renders "v" and an assertion built from the
  // same empty value matches it happily.
  it('names the running build in the footer of every route, linked to its release', () => {
    expect(SITE_VERSION, 'VERSION must resolve to a real semver at build time').toMatch(/^\d+\.\d+\.\d+$/);

    renderShell('pt');
    // Found by its ACCESSIBLE name, not its visible text. The visible text is a bare `v0.1.144`; the
    // accessible name comes from aria-label, because a screen reader announcing "v0.1.144" as a link
    // gets no context and no external-link cue. Querying by role+name is what proves the label reached
    // the element — a getByText would pass with the aria-label missing entirely.
    const tag = screen.getByRole('link', { name: 'Notas da versão que está no ar (GitHub)' });
    expect(tag).toHaveTextContent(`v${SITE_VERSION}`);
    expect(tag).toHaveAttribute('href', releaseUrl());
    // The release for THIS build, not a generic releases page — that is what makes the number checkable
    // rather than decorative.
    expect(releaseUrl()).toBe(`https://github.com/tedeuxx/tadeumendonca-io/releases/tag/v${SITE_VERSION}`);
  });

  it('renders its own edition, with no leak from the other', () => {
    const { unmount } = renderShell('pt');
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Skip to content' })).toBeNull();
    unmount();

    renderShell('en');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pular para o conteúdo' })).toBeNull();
  });
});
