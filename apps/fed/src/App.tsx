// App root — a static landing + profile + portfolio + ramp-up + markdown-blog SPA. No backend. The
// landing (/) is the content shop window and owns the #artigos / #portfolio / #contato anchors; /me
// hosts the profile, /portfolio the full catalog, /ramp-up the open AI-Engineer plan, /blog/:slug the
// canonical article. React Query wraps the (static) profile query. The retired /blog list, /articles,
// and the former /cv and /profile paths keep back-compat redirects (/cv · /profile → /me).
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsentProvider } from './lib/consent';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { ProfilePage } from './pages/ProfilePage';
import { PortfolioPage } from './pages/PortfolioPage';
import { RampUpPage } from './pages/RampUpPage';
import { ArticlePage } from './pages/ArticlePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConsentProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/me" element={<ProfilePage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/ramp-up" element={<RampUpPage />} />
              <Route path="/blog/:slug" element={<ArticlePage />} />
              {/* Back-compat: old deep-links (og:image, shared URLs) still resolve. */}
              <Route path="/articles/:slug" element={<ArticlePage />} />
              <Route path="/blog" element={<Navigate to="/#artigos" replace />} />
              <Route path="/articles" element={<Navigate to="/#artigos" replace />} />
              {/* /cv and /profile were the CV route before it became /me — keep external links alive. */}
              <Route path="/cv" element={<Navigate to="/me" replace />} />
              <Route path="/profile" element={<Navigate to="/me" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </ConsentProvider>
    </QueryClientProvider>
  );
}
