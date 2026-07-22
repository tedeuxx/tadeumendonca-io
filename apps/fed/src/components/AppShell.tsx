// App shell (/frontend/design-system). Brutalist identity: near-black/off-white + safety orange,
// single fixed theme. Layout: a 1440px frame with heavy side rules → sticky nav (brand left, links
// right, collapsible on mobile) → the page. Fully static — no auth, no backend, no PWA.
//
// The landing owns the anchors (#artigos, #portfolio, #contato); nav points at them through `/#…`
// so the same link works from a sub-route (full load back to the landing) and as an in-page jump on
// the landing itself. `/cv` and `/portfolio` are real routes.
import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/cn';

interface NavEntry {
  href: string;
  label: string;
  /** Real route (react-router) vs. landing anchor (plain href). */
  route?: boolean;
}
const NAV: NavEntry[] = [
  { href: '/#artigos', label: 'Artigos' },
  { href: '/#portfolio', label: 'Portfólio' },
  { href: '/#contato', label: 'Contato' },
  { href: '/cv', label: 'CV', route: true },
];

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

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV.map(({ href, label, route }) =>
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
          <a key={href} href={href} onClick={onNavigate} className={linkClass}>
            {label}
          </a>
        ),
      )}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-screen flex-col border-x-2 border-border-strong">
      <header className="sticky top-0 z-20 bg-background">
        <nav
          className="flex items-center justify-between gap-3 border-b-2 border-border-strong px-[--gutter]"
          style={{ minHeight: 'var(--header-h)' }}
        >
          <Brand />
          <div className="hidden items-center md:flex">
            <NavItems />
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
            <NavItems onNavigate={() => setMenuOpen(false)} />
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
