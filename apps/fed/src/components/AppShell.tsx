// App shell (/frontend/design-system). Brutalist identity: near-black/off-white + safety orange,
// single fixed theme. Layout: global header (brand) → horizontal nav row → content (the star, wide &
// centered) + a static "components" zone (xl+). Fully static — no auth, no backend, no PWA.
import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, User, Boxes } from 'lucide-react';
import { SocialLinksWidget } from './SocialLinksWidget';
import { cn } from '../lib/cn';

interface NavEntry {
  to: string;
  label: string;
  icon: typeof User;
}
const NAV: NavEntry[] = [
  { to: '/', label: 'Quem Sou', icon: User },
  { to: '/portfolio', label: 'Portfólio', icon: Boxes },
  { to: '/blog', label: 'Blog', icon: FileText },
];

function HeaderBrand() {
  return (
    <NavLink to="/" className="flex items-center gap-2 font-display text-lg font-extrabold uppercase tracking-tight">
      <span className="h-5 w-1.5 shrink-0 rounded-sm bg-primary" />
      <span>
        tadeumendonca<span className="text-primary">.io</span>
      </span>
    </NavLink>
  );
}

function NavItems() {
  return (
    <>
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted',
              isActive ? 'font-semibold text-primary' : 'text-muted-foreground',
            )
          }
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  );
}

function ComponentsPanel() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-4 w-1.5 rounded-sm bg-primary" />
        <h2 className="font-display font-bold">Em breve</h2>
      </div>
      <p className="text-sm text-muted-foreground">Mais projetos no catálogo em breve.</p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col">
      {/* Global chrome: header (brand) and the horizontal nav row stick together. */}
      <div className="sticky top-0 z-20 bg-background">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <HeaderBrand />
        </header>
        <nav className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-1.5">
          <NavItems />
        </nav>
      </div>

      {/* Content (the star) + components zone (desktop only) */}
      <div className="flex flex-1">
        <main className="min-w-0 flex-1 pb-12 xl:border-r xl:border-border">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
        <aside className="hidden w-[320px] shrink-0 flex-col gap-4 p-4 xl:flex">
          <SocialLinksWidget />
          <ComponentsPanel />
        </aside>
      </div>
    </div>
  );
}
