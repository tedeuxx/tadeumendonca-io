// App shell (/frontend/design-system). BVB identity: black/graphite + yellow, single fixed theme.
// Layout: global header (platform title left, account/settings right) → horizontal nav row →
//   content (the star, wide & centered) + a "components" zone reserved for future widgets (xl+).
//   The header + nav row stick together at the top; the nav row scrolls horizontally on narrow screens.
import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, User, LogIn, LogOut, Settings, WifiOff } from 'lucide-react';
import { useAuth } from '../auth/authStore';
import { useOnline } from '../hooks/useOnline';
import { InstallPrompt } from './InstallPrompt';
import { SocialLinksWidget } from './SocialLinksWidget';
import { PollWidget } from './PollWidget';
import { cn } from '../lib/cn';

function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 border-b border-border bg-muted px-4 py-1.5 text-xs text-muted-foreground">
      <WifiOff size={14} />
      <span>Você está offline — suas ações serão enviadas quando a conexão voltar.</span>
    </div>
  );
}

interface NavEntry {
  to: string;
  label: string;
  icon: typeof Home;
}
const NAV: NavEntry[] = [
  { to: '/', label: 'Feed', icon: Home },
  { to: '/blog', label: 'Blog', icon: FileText },
  { to: '/profile', label: 'Quem Sou', icon: User },
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

function Account() {
  const { status, email, signIn, signOut } = useAuth();
  if (status !== 'authenticated') {
    return (
      <button
        onClick={() => void signIn()}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <LogIn size={18} /> <span>Entrar</span>
      </button>
    );
  }
  const initial = (email ?? '?')[0]?.toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <NavLink to="/conta" aria-label="Minha conta" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
        {initial}
      </NavLink>
      <span className="hidden max-w-[12rem] truncate text-sm text-muted-foreground sm:block">{email}</span>
      <NavLink to="/conta" aria-label="Configurações" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
        <Settings size={18} />
      </NavLink>
      <button onClick={() => void signOut()} aria-label="Sair" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
        <LogOut size={18} />
      </button>
    </div>
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
      <p className="text-sm text-muted-foreground">Busca e mais widgets em breve.</p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col">
      {/* Global chrome: header (title + account/settings) and the horizontal nav row stick together. */}
      <div className="sticky top-0 z-20 bg-background">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <HeaderBrand />
          <Account />
        </header>
        <nav className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-1.5">
          <NavItems />
        </nav>
        <OfflineBanner />
        <InstallPrompt />
      </div>

      {/* Content (the star) + components zone (desktop only) */}
      <div className="flex flex-1">
        <main className="min-w-0 flex-1 pb-12 xl:border-r xl:border-border">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
        <aside className="hidden w-[320px] shrink-0 flex-col gap-4 p-4 xl:flex">
          <PollWidget />
          <SocialLinksWidget />
          <ComponentsPanel />
        </aside>
      </div>
    </div>
  );
}
