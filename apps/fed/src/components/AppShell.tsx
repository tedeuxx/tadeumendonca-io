// App shell (/frontend/design-system). Brutalist identity: near-black/off-white + safety orange,
// single fixed theme. Layout: a 1440px frame with heavy side rules → sticky nav (brand left, links
// right, collapsible on mobile) → the page. Fully static — no auth, no backend, no PWA.
//
// The landing owns the anchors (#artigos, #contato); nav points at them through `/#…` so the same
// link works from a sub-route (full load back to the landing) and as an in-page jump on the landing
// itself. `/me`, `/ramp-up`, `/architecture`, `/portfolio` and `/library` are real routes and the nav
// links them as routes.
//
// `#portfolio` IS STILL AN ANCHOR ON THE LANDING — it just has no nav entry (#315). The section stays
// as a teaser; what changed is that the menu item named after the catalog now lands ON the catalog
// instead of on the shortlist of it. Until then this file asserted both halves in consecutive
// sentences — "the landing owns #portfolio" and "/portfolio is a real route" — without noticing they
// disagreed for that one entry, which is why the wrong link read as designed.
import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useActiveSection } from '../hooks/useActiveSection';
import { usePageviews } from '../hooks/usePageviews';
import { cn } from '../lib/cn';
import { useConsent } from '../lib/consent';
import { analyticsConfigured } from '../lib/analytics';
import { ConsentBanner } from './ConsentBanner';
import { LocaleSuggestion } from './LocaleSuggestion';
import { LOCALES, useLocale, useLocalePath, type MessageKey } from '../i18n';
import { SITE_VERSION, releaseUrl } from '../lib/version';

interface NavEntry {
  href: string;
  /** Catalog key for the visible label (the anchor id stays a stable, non-localized href). */
  labelKey: MessageKey;
  /** Landing anchor id — the nav marks it while that region is in view. */
  section?: string;
  /** Real route (react-router) vs. landing anchor (plain href). */
  route?: boolean;
}
const NAV: NavEntry[] = [
  { href: '/#artigos', labelKey: 'nav.articles', section: 'artigos' },
  // Position preserved deliberately, and it still is — reordering the reader's menu is not what #315
  // was, nor what #346 is. What changed is the reason it USED to look odd: routes were bordered and
  // anchors were not, so with the two anchors at positions 1 and 3 the border alternated and read as a
  // glitch rather than as a rule. #346 settled that the border is CHROME, not meaning — every entry
  // carries it now, so there is no alternation left to justify and nothing here depends on the order.
  // The route/anchor difference is still expressed where it is actually load-bearing: `isActive` /
  // `aria-current="page"` for routes, scroll-spy `aria-current="true"` for anchors. A border announces
  // nothing to a screen reader, so it was never carrying that distinction for everyone.
  { href: '/portfolio', labelKey: 'nav.portfolio', route: true },
  { href: '/#contato', labelKey: 'nav.contact', section: 'contato' },
  { href: '/ramp-up', labelKey: 'nav.rampup', route: true },
  { href: '/architecture', labelKey: 'nav.architecture', route: true },
  // #166's second slice. The route shipped one slice earlier WITHOUT this entry, deliberately: linking
  // readers at an empty shelf is worse than not linking. It sits beside `/ramp-up` and `/architecture`
  // because it is the same kind of thing — a surface the reader goes to read — and ahead of `/me`, which
  // stays last as the destination the rest of the nav argues towards.
  { href: '/library', labelKey: 'nav.library', route: true },
  { href: '/me', labelKey: 'nav.profile', route: true },
];
const SECTIONS = NAV.map((entry) => entry.section).filter((id): id is string => id !== undefined);

// Shared by BOTH nav shapes — the route `NavLink` and the anchor `<a>`. The border lives here, in the
// one class both branches use, rather than being repeated per branch: #346 decided it is chrome, so
// "every nav item is bordered" is now an invariant of the item, not a property of what it links to.
// Keeping it in a single place is what stops the two branches drifting apart again.
const linkClass =
  'border border-border px-3.5 py-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground invert-hover';

function Brand() {
  const lp = useLocalePath();
  return (
    <NavLink to={lp('/')} className="flex items-center gap-2 font-mono text-[0.95rem] font-bold tracking-tight">
      <span className="h-5 w-1.5 shrink-0 bg-primary" />
      <span>
        tadeumendonca<span className="text-primary">.io</span>
      </span>
    </NavLink>
  );
}

function NavItems({ activeSection, onNavigate }: { activeSection: string | null; onNavigate?: () => void }) {
  const { t } = useLocale();
  // Links stay within the active locale (ADR-0036): the logical href is prefixed with the current locale.
  const lp = useLocalePath();
  return (
    <>
      {NAV.map(({ href, labelKey, route, section }) =>
        route ? (
          <NavLink
            key={href}
            to={lp(href)}
            onClick={onNavigate}
            className={({ isActive }) => cn(linkClass, isActive && 'text-foreground')}
          >
            {t(labelKey)}
          </NavLink>
        ) : (
          <a
            key={href}
            href={lp(href)}
            onClick={onNavigate}
            aria-current={section && section === activeSection ? 'true' : undefined}
            className={cn(linkClass, section === activeSection && 'text-foreground')}
          >
            {t(labelKey)}
          </a>
        ),
      )}
    </>
  );
}

// PT/EN toggle — brutalist mono, radius 0, the safety-orange accent marks the active locale.
// NOT the same treatment as the nav, and the comment here used to claim it was: the nav marks its
// active entry by brightening the label to `text-foreground`, never with the accent, which appears
// in the header only inside this component. The divergence is deliberate — the toggle is a state
// control where the accent says WHICH ONE IS ON, while a nav entry is a destination. Recorded so the
// next reader does not "restore consistency" by moving the accent into the wrong half.
// The codes 'PT'/'EN' are not localized (they are language labels).
// It persists the choice via setLocale (localStorage), overriding browser detection.
function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div role="group" data-print="hide" aria-label={t('locale.switch')} className="ml-1 flex items-center border border-border">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={cn(
            'px-2 py-2 font-mono text-xs uppercase tracking-[0.12em]',
            locale === code ? 'text-primary' : 'text-muted-foreground invert-hover',
          )}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLocale();
  const lp = useLocalePath();
  const { reopen } = useConsent();
  // Send a GA4 page_view on route changes (no-op until the reader has consented).
  usePageviews();
  // Only the landing carries the anchored regions — the locale landing `/pt`|`/en` (ADR-0036).
  const onLanding = useLocation().pathname === lp('/');
  const activeSection = useActiveSection(SECTIONS, onLanding);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-screen flex-col border-x-2 border-border-strong">
      {/* Bottom stack — FIRST in the DOM, last on the screen (#230).

          Both notices are independently present or absent, so they share ONE fixed container and sit in
          it as normal blocks: the locale offer above, the consent bar flush with the bottom. Positioning
          each `fixed bottom-0` would have overlapped them, and offsetting one by the other's height would
          have hard-coded a number that changes with the copy (#172).

          It sits at the TOP of the tree because `position: fixed` ignores document order but assistive
          technology does not. Rendered last, a screen-reader user reached these notices only after
          traversing the whole page — the worst possible ordering for the LOCALE OFFER, whose entire value
          is arriving early for a reader who may not read the page's language. The move costs nothing
          visually and keeps the stacking, because the container moves as a unit.

          Accepted cost: a keyboard user now tabs into the notice before the nav. Same trade a skip-link
          makes — a dismissible notice addressed to you is a reasonable first stop, and either control
          dismisses it in one press. */}
      {/* SKIP LINK (#250) — the first focusable element on every route, and the counterpart to the
          notice ordering above: that block ADDS tab stops before the nav, this one offers a way past all
          of them. Deliberately NOT `sr-only` alone — a sighted keyboard user has to SEE where focus went,
          so the revealed state is a real square control in the brand's own palette, not an off-screen
          ghost.

          It moves FOCUS, not just scroll: `#main` carries `tabIndex={-1}`, without which the browser
          scrolls to the target and leaves focus on the link, so the next Tab returns to the nav — the
          failure that makes a skip link look present and do nothing. */}
      <a
        href="#main"
        data-print="hide"
        className="sr-only focus:not-sr-only focus:absolute focus:left-[--gutter] focus:top-2 focus:z-40 focus:border-2 focus:border-border-strong focus:bg-background focus:px-3.5 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-wider focus:text-foreground"
      >
        {t('nav.skipToContent')}
      </a>

      <div className="fixed inset-x-0 bottom-0 z-30" data-print="hide">
        <LocaleSuggestion />
        <ConsentBanner />
      </div>

      {/* Chrome hidden in print (#140): the print PDF of /me is a CV, not a page screenshot. */}
      <header data-print="hide" className="sticky top-0 z-20 bg-background">
        <nav
          data-print="hide"
          className="flex items-center justify-between gap-3 border-b-2 border-border-strong px-[--gutter]"
          style={{ minHeight: 'var(--header-h)' }}
        >
          <Brand />
          {/* Desktop nav switches on at `lg` (1024px), not `md` (768px): the full row — Brand + the nav
              links + locale toggle, longer in pt — needs well past 768px, so between 768–880px it used to
              overflow the viewport (horizontal scroll) AND wrap the links to two lines. Keeping the
              hamburger until `lg` guarantees the full nav only renders where it fits (#159).
              The count is deliberately NOT written here any more: it said "six links" and #166 made it
              seven, which is the class of prose that goes stale silently (#262). What holds the invariant
              is `e2e/responsive-overflow.spec.ts`, which sweeps 320→1280px on every route in pt-BR (the
              worst case for this row) and fails on a single overflowing pixel — a measurement, not a
              sentence. A seventh entry is exactly the change that would have made a hard-coded number
              lie while the guard stayed honest. */}
          <div className="hidden items-center lg:flex">
            <NavItems activeSection={activeSection} />
            <LocaleToggle />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            className="p-2 text-foreground lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
        {menuOpen && (
          <div data-print="hide" className="flex flex-col items-start border-b border-border bg-background px-[--gutter] py-2 lg:hidden">
            <NavItems activeSection={activeSection} onNavigate={() => setMenuOpen(false)} />
            <div className="pt-1">
              <LocaleToggle />
            </div>
          </div>
        )}
      </header>

      {/* tabIndex={-1} is what makes the skip link move FOCUS rather than only scrolling (#250). */}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>

      <footer data-print="hide" className="border-t-2 border-border-strong px-[--gutter] py-4">
        <div className="mx-auto flex w-full max-w-screen items-center justify-between gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            tadeumendonca.io{' '}
            {/* The running build, linked to its own release — here rather than in the landing's
                colophon, because THIS is the footer every route renders. Knowing which build you are
                reading is the precondition for checking any other claim on the site, and /architecture
                is the page that most needs it.

                Bare on screen and named for assistive technology. `v0.1.144` is a conventional
                identifier rather than prose, so a sighted reader gets the affordance from position and
                register — but a screen reader would announce a link called "v0.1.144" with no context
                and no external-link cue, which is exactly the class of thing the rest of this file is
                careful about. The label costs two catalog entries; that is the right trade. */}
            <a
              href={releaseUrl()}
              target="_blank"
              rel="noreferrer"
              aria-label={t('footer.version')}
              className="hover:text-foreground hover:underline"
            >
              v{SITE_VERSION}
            </a>
          </span>
          {/* Withdrawal must be as reachable as granting: this re-opens the banner to re-decide. Shown
              only when analytics is configured — otherwise there is no cookie choice to manage. */}
          {analyticsConfigured() && (
            <button
              type="button"
              onClick={reopen}
              className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground invert-hover"
            >
              {t('consent.manage')}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
