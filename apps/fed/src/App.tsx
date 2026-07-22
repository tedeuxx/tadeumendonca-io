// App root — a static landing + CV + portfolio + markdown-blog SPA. No backend. The landing (/) is
// the content shop window and owns the #artigos / #portfolio / #contato anchors; /cv hosts the CV,
// /portfolio the full catalog, /blog/:slug the canonical article. React Query wraps the (static)
// profile query. The retired /blog list, /articles and /profile keep back-compat redirects.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { CvPage } from './pages/CvPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { ArticlePage } from './pages/ArticlePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/cv" element={<CvPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/blog/:slug" element={<ArticlePage />} />
            {/* Back-compat: old deep-links (og:image, shared URLs) still resolve. */}
            <Route path="/articles/:slug" element={<ArticlePage />} />
            <Route path="/blog" element={<Navigate to="/#artigos" replace />} />
            <Route path="/articles" element={<Navigate to="/#artigos" replace />} />
            <Route path="/profile" element={<Navigate to="/cv" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
