// X-style app shell (/frontend/design-system): left nav rail + centered content column + right sidebar
// on desktop; top bar + bottom tab bar on mobile. Dark-first with a theme toggle. Brand = slate + cyan.
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

function Brand() {
  return (
    <NavLink to="/" className="flex items-center gap-2 px-3 py-2 text-lg font-bold tracking-tight">
      <span className="h-5 w-1.5 rounded-sm bg-primary" />
      <span>
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

function Account({ compact = false }: { compact?: boolean }) {
  const { status, email, signIn, signOut } = useAuth();
  if (status !== 'authenticated') {
    return (
      <button
        onClick={() => void signIn()}
        className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <LogIn size={18} /> {!compact && 'Sign in'}
      </button>
    );
  }
  const initial = (email ?? '?')[0]?.toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{initial}</div>
      {!compact && <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{email}</span>}
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
              'flex items-center gap-4 rounded-full transition-colors',
              orientation === 'rail' ? 'px-4 py-3 text-lg hover:bg-muted' : 'flex-col gap-0.5 px-3 py-1.5 text-xs',
              isActive ? 'font-bold text-foreground' : 'text-muted-foreground',
            )
          }
        >
          <Icon size={orientation === 'rail' ? 24 : 22} />
          <span className={orientation === 'bottom' ? 'text-[10px]' : ''}>{label}</span>
        </NavLink>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1280px]">
      {/* Left rail (desktop) */}
      <header className="sticky top-0 hidden h-screen w-[88px] shrink-0 flex-col justify-between border-r border-border px-2 py-3 lg:flex xl:w-[260px]">
        <div className="flex flex-col gap-1">
          <Brand />
          <nav className="mt-2 flex flex-col gap-1">
            <NavItems orientation="rail" />
          </nav>
        </div>
        <div className="flex flex-col gap-2 px-2">
          <ThemeToggle />
          <Account />
        </div>
      </header>

      {/* Center content column */}
      <main className="min-w-0 flex-1 border-border pb-20 lg:border-x lg:pb-0">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-3 py-2 backdrop-blur lg:hidden">
          <Brand />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Account compact />
          </div>
        </div>
        {children}
      </main>

      {/* Right sidebar (wide desktop) */}
      <aside className="sticky top-0 hidden h-screen w-sidebar shrink-0 flex-col gap-4 p-4 xl:flex">
        <SidebarAbout />
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-border bg-background/90 backdrop-blur lg:hidden">
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
