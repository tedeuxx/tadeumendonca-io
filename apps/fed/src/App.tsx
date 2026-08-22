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
import { LibraryPage } from './pages/LibraryPage';
import { LocaleProvider } from './i18n';
import { detectLocale, isLocale, localePath, pathWithoutLocale, type Locale } from './i18n/config';
import { articlePathForLocale, supersededSlugTarget } from './lib/content';
import { useScrollToTop } from './hooks/useScrollToTop';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// Bare `/` and any unprefixed / invalid-locale path → redirect to the prefixed equivalent, preserving the
// sub-path, query and hash. The locale is resolved path → persisted → navigator → en (detectLocale); the
// path carries no valid prefix here, so it falls through to the persisted/browser signal. `replace` keeps
// the unprefixed URL out of history.
//
// The sub-path is preserved VERBATIM for every route except an article, whose slug is per-locale
// (ADR-0037). Re-prefixing `/blog/my-commitment` for a pt-BR reader produced `/pt/blog/my-commitment` —
// a route that does not exist — so they landed on the blog listing and never reached the article, while
// an English reader got it fine (#204). `articlePathForLocale` maps the slug to the target locale's own,
// from either direction; anything it does not recognise passes through, so an unknown slug still falls
// to the in-locale not-found.
//
// `/library` needs nothing here, and that is a property of the slug choice rather than luck: it is one
// English slug prefixed twice (ADR-0036), so `/library` re-prefixed verbatim is `/pt/library` — a real,
// prerendered route. A localized pair would have needed this mapper generalised, which is one of the
// costs weighed when it was declined.
function RootRedirect() {
  const { pathname, search, hash } = useLocation();
  const locale = detectLocale(pathname);
  const rest = pathWithoutLocale(pathname); // unprefixed already → returned unchanged
  const target = articlePathForLocale(rest === '' ? '/' : rest, locale);
  return <Navigate to={`${localePath(locale, target)}${search}${hash}`} replace />;
}

// A published article URL is a permanent contract (ADR-0010), and ADR-0037 makes an article slug
// per-locale and therefore correctable — a title can be redrafted after publication, and then the address
// still spells the withdrawn one. This is the join between those two facts: a slug listed in an edition's
// `previousSlugs` redirects to that edition's CURRENT slug instead of falling through to `ArticlePage`'s
// not-found.
//
// It sits in the router rather than inside `ArticlePage` because that is where every other back-compat
// path on this site already lives (`/blog` → `/#artigos`, the in-locale `*`, `RootRedirect`) — ADR-0010's
// mechanism is client-side `<Navigate … replace>`, and a second mechanism inside the page would be a
// redirect nobody reading the route table could see. `replace` keeps the retired URL out of history, so
// the back button does not bounce the reader straight back into it.
//
// Only the retired case is intercepted: a live slug and an unknown slug both render `ArticlePage`
// unchanged, so the in-locale not-found behaviour is untouched.
function ArticleRoute({ locale }: { locale: Locale }) {
  const { slug } = useParams<{ slug: string }>();
  const current = slug ? supersededSlugTarget(slug, locale) : undefined;
  if (current) return <Navigate to={localePath(locale, `/blog/${current}`)} replace />;
  return <ArticlePage />;
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
          {/* The sixth public surface (#166). One English slug prefixed twice, bilingual label and page
              — the same shape as the four above it, so it needs no per-locale route resolution. */}
          <Route path="library" element={<LibraryPage />} />
          <Route path="blog/:slug" element={<ArticleRoute locale={locale} />} />
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

// Scroll behaviour on route change (#scroll-to-top). Mounted HERE, above the route table rather than
// inside `LocaleApp`, for two reasons: it must survive a locale switch (`/pt/x` → `/en/x` remounts
// LocaleApp, and a hook inside it would re-mount and lose its navigation type), and `RootRedirect`
// renders outside `LocaleApp` entirely. The rules it applies — and why the back button is exempt —
// are on the hook itself. Renders nothing.
function ScrollToTop() {
  useScrollToTop();
  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConsentProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path=":locale/*" element={<LocaleApp />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </ConsentProvider>
    </QueryClientProvider>
  );
}
