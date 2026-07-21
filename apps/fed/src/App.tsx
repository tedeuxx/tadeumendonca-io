// App root — a static CV + portfolio + markdown-blog SPA. No backend: the only routes are the CV
// landing (/), the portfolio, and the blog (rendered from markdown-in-repo). React Query wraps the
// (static) profile query; /articles + /profile keep back-compat redirects.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { PortfolioPage } from './pages/PortfolioPage';
import { ArticlesPage } from './pages/ArticlesPage';
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
            <Route path="/" element={<HomePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/blog" element={<ArticlesPage />} />
            <Route path="/blog/:slug" element={<ArticlePage />} />
            {/* Back-compat: old /articles deep-links (og:image, notifications) still resolve. */}
            <Route path="/articles" element={<Navigate to="/blog" replace />} />
            <Route path="/articles/:slug" element={<ArticlePage />} />
            <Route path="/profile" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
