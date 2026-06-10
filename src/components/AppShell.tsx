// X-style app shell (/frontend/design-system). Three responsive tiers:
//   < md (phones):     top bar + bottom tab bar, single full-width column
//   md–lg (tablets):   icon-only left rail + fixed 600px feed column (no right sidebar)
//   xl+ (desktop):     expanded rail (labels) + 600px column + right About sidebar
// Dark-first with a theme toggle. Brand = slate + cyan.
import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, User, PenSquare, Sun, Moon, LogIn, LogOut } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/authStore';
import { cn } from '../lib/cn';

interface NavEntry {
  to: string;
  label: string;
  icon: typeof Home;
  adminOnly?: boolean;
}
const NAV: NavEntry[] = [
  { to: '/', label: 'Feed', icon: Home },
  { to: '/articles', label: 'Articles', icon: FileText },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/compose', label: 'New post', icon: PenSquare, adminOnly: true },
];

function Brand({ collapsible = false }: { collapsible?: boolean }) {
  return (
    <NavLink
      to="/"
      className={cn('flex items-center gap-2 px-3 py-2 text-lg font-bold tracking-tight', collapsible && 'justify-center xl:justify-start')}
    >
      <span className="h-5 w-1.5 shrink-0 rounded-sm bg-primary" />
      <span className={collapsible ? 'hidden xl:inline' : ''}>
        tadeumendonca<span className="text-primary">.io</span>
      </span>
    </NavLink>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

function Account({ variant }: { variant: 'bar' | 'rail' }) {
  const { status, email, signIn, signOut } = useAuth();
  // `bar` (mobile top bar) never shows text; `rail` shows it only when expanded (xl+).
  const textCls = variant === 'rail' ? 'hidden xl:block' : 'hidden';
  const centerCls = variant === 'rail' ? 'justify-center xl:justify-start' : '';

  if (status !== 'authenticated') {
    return (
      <button
        onClick={() => void signIn()}
        className={cn('flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90', centerCls)}
      >
        <LogIn size={18} /> <span className={variant === 'rail' ? 'hidden xl:inline' : 'hidden'}>Sign in</span>
      </button>
    );
  }
  const initial = (email ?? '?')[0]?.toUpperCase();
  return (
    <div className={cn('flex items-center gap-1.5 xl:gap-2', centerCls)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{initial}</div>
      <span className={cn('min-w-0 flex-1 truncate text-sm text-muted-foreground', textCls)}>{email}</span>
      <button onClick={() => void signOut()} aria-label="Sign out" className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
        <LogOut size={18} />
      </button>
    </div>
  );
}

function NavItems({ orientation }: { orientation: 'rail' | 'bottom' }) {
  const { isAdmin } = useAuth();
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);
  return (
    <>
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-full transition-colors',
              orientation === 'rail'
                ? 'mx-auto h-12 w-12 justify-center gap-4 text-lg hover:bg-muted xl:mx-0 xl:h-auto xl:w-auto xl:justify-start xl:px-4 xl:py-3'
                : 'flex-col gap-0.5 px-3 py-1.5 text-xs',
              isActive ? 'font-bold text-foreground' : 'text-muted-foreground',
            )
          }
        >
          <Icon size={orientation === 'rail' ? 24 : 22} />
          <span className={orientation === 'rail' ? 'hidden xl:inline' : 'text-[10px]'}>{label}</span>
        </NavLink>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1280px]">
      {/* Left rail (tablet: icon-only · desktop: expanded with labels) */}
      <header className="sticky top-0 hidden h-screen w-[88px] shrink-0 flex-col justify-between border-r border-border px-2 py-3 md:flex xl:w-[260px]">
        <div className="flex flex-col gap-1">
          <Brand collapsible />
          <nav className="mt-2 flex flex-col gap-1">
            <NavItems orientation="rail" />
          </nav>
        </div>
        <div className="flex flex-col items-center gap-2 px-1 xl:items-stretch xl:px-2">
          <ThemeToggle />
          <Account variant="rail" />
        </div>
      </header>

      {/* Center content column — fixed 600px feed width from md up (X-style) */}
      <main className="min-w-0 w-full flex-1 border-border pb-20 md:w-[600px] md:flex-none md:border-x md:pb-0">
        {/* Mobile top bar (phones only) */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-3 py-2 backdrop-blur md:hidden">
          <Brand />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Account variant="bar" />
          </div>
        </div>
        {children}
      </main>

      {/* Right sidebar (desktop only) */}
      <aside className="sticky top-0 hidden h-screen w-sidebar shrink-0 flex-col gap-4 p-4 xl:flex">
        <SidebarAbout />
      </aside>

      {/* Bottom tab bar (phones only) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-border bg-background/90 backdrop-blur md:hidden">
        <NavItems orientation="bottom" />
      </nav>
    </div>
  );
}

function SidebarAbout() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-4 w-1.5 rounded-sm bg-primary" />
        <h2 className="font-bold">Tadeu Mendonça</h2>
      </div>
      <p className="text-sm text-muted-foreground">Software Engineer — Cloud &amp; Serverless. Feed, articles e o CV completo.</p>
      <NavLink to="/profile" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
        Ver o CV →
      </NavLink>
    </div>
  );
}
