// App shell (/frontend/design-system). Brutalist identity: near-black/off-white + safety orange,
// single fixed theme. Layout: a 1440px frame with heavy side rules → sticky nav (brand left, links
// right, collapsible on mobile) → the page. Fully static — no auth, no backend, no PWA.
//
// The landing owns the anchors (#artigos, #portfolio, #contato); nav points at them through `/#…`
// so the same link works from a sub-route (full load back to the landing) and as an in-page jump on
// the landing itself. `/cv` and `/portfolio` are real routes.
import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useActiveSection } from '../hooks/useActiveSection';
import { cn } from '../lib/cn';

interface NavEntry {
  href: string;
  label: string;
  /** Landing anchor id — the nav marks it while that region is in view. */
  section?: string;
  /** Real route (react-router) vs. landing anchor (plain href). */
  route?: boolean;
}
const NAV: NavEntry[] = [
  { href: '/#artigos', label: 'Artigos', section: 'artigos' },
  { href: '/#portfolio', label: 'Portfólio', section: 'portfolio' },
  { href: '/#contato', label: 'Contato', section: 'contato' },
  { href: '/cv', label: 'CV', route: true },
];
const SECTIONS = NAV.map((entry) => entry.section).filter((id): id is string => id !== undefined);

const linkClass = 'px-3.5 py-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground invert-hover';

function Brand() {
  return (
    <NavLink to="/" className="flex items-center gap-2 font-mono text-[0.95rem] font-bold tracking-tight">
      <span className="h-5 w-1.5 shrink-0 bg-primary" />
      <span>
        tadeumendonca<span className="text-primary">.io</span>
      </span>
    </NavLink>
  );
}

function NavItems({ activeSection, onNavigate }: { activeSection: string | null; onNavigate?: () => void }) {
  return (
    <>
      {NAV.map(({ href, label, route, section }) =>
        route ? (
          <NavLink
            key={href}
            to={href}
            onClick={onNavigate}
            className={({ isActive }) => cn(linkClass, 'border border-border', isActive && 'text-foreground')}
          >
            {label}
          </NavLink>
        ) : (
          <a
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={section && section === activeSection ? 'true' : undefined}
            className={cn(linkClass, section === activeSection && 'text-foreground')}
          >
            {label}
          </a>
        ),
      )}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Only the landing carries the anchored regions.
  const onLanding = useLocation().pathname === '/';
  const activeSection = useActiveSection(SECTIONS, onLanding);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-screen flex-col border-x-2 border-border-strong">
      <header className="sticky top-0 z-20 bg-background">
        <nav
          className="flex items-center justify-between gap-3 border-b-2 border-border-strong px-[--gutter]"
          style={{ minHeight: 'var(--header-h)' }}
        >
          <Brand />
          <div className="hidden items-center md:flex">
            <NavItems activeSection={activeSection} />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            className="p-2 text-foreground md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
        {menuOpen && (
          <div className="flex flex-col items-start border-b border-border bg-background px-[--gutter] py-2 md:hidden">
            <NavItems activeSection={activeSection} onNavigate={() => setMenuOpen(false)} />
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
