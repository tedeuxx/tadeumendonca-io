// App root — a static landing + profile + portfolio + ramp-up + markdown-blog SPA. No backend.
//
// Per-locale URLs (ADR-0036): every public route is served under a first-class locale prefix — `/pt/…`
// and `/en/…` — so each locale has its own crawlable, prerendered, self-canonical URL. The bare `/` and
// any unprefixed or invalid-locale path client-side redirects (path → persisted → navigator → en) to the
// prefixed equivalent, PRESERVING the sub-path (`/me` → `/en/me` for an English browser). There is no
// edge/Accept-Language logic — the redirect is pure client-side React (ADR-0004 holds). The bare `/`
// snapshot stays an x-default English page for the JS-less crawler (scripts/prerender.mjs).
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsentProvider } from './lib/consent';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { ProfilePage } from './pages/ProfilePage';
import { PortfolioPage } from './pages/PortfolioPage';
import { RampUpPage } from './pages/RampUpPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { ArticlePage } from './pages/ArticlePage';
import { LocaleProvider } from './i18n';
import { detectLocale, isLocale, localePath, pathWithoutLocale } from './i18n/config';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// Bare `/` and any unprefixed / invalid-locale path → redirect to the prefixed equivalent, preserving the
// sub-path, query and hash. The locale is resolved path → persisted → navigator → en (detectLocale); the
// path carries no valid prefix here, so it falls through to the persisted/browser signal. `replace` keeps
// the unprefixed URL out of history.
function RootRedirect() {
  const { pathname, search, hash } = useLocation();
  const locale = detectLocale(pathname);
  const rest = pathWithoutLocale(pathname); // unprefixed already → returned unchanged
  return <Navigate to={`${localePath(locale, rest === '' ? '/' : rest)}${search}${hash}`} replace />;
}

// The locale-scoped app: validates the `:locale` segment, then wraps the shell + routes in the
// LocaleProvider (which reads the locale straight off the path). An invalid segment (`/xyz/…`) is not a
// locale at all — treat the whole path as unprefixed and let RootRedirect send it to a real prefix.
function LocaleApp() {
  const { locale } = useParams();
  if (!isLocale(locale)) return <RootRedirect />;
  return (
    <LocaleProvider>
      <AppShell>
        <Routes>
          <Route index element={<LandingPage />} />
          <Route path="me" element={<ProfilePage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="ramp-up" element={<RampUpPage />} />
          <Route path="architecture" element={<ArchitecturePage />} />
          <Route path="blog/:slug" element={<ArticlePage />} />
          {/* The retired /blog list still deep-links: send it to the landing's #artigos, in-locale. */}
          <Route path="blog" element={<Navigate to={localePath(locale, '/#artigos')} replace />} />
          {/* An in-locale unknown path falls to the locale landing (NOT bare `/`, which would loop back
              through RootRedirect). */}
          <Route path="*" element={<Navigate to={localePath(locale, '/')} replace />} />
        </Routes>
      </AppShell>
    </LocaleProvider>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConsentProvider>
        <BrowserRouter>
          <Routes>
            <Route path=":locale/*" element={<LocaleApp />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </ConsentProvider>
    </QueryClientProvider>
  );
}
