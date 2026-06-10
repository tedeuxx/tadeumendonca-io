// App root (/frontend/routing, /frontend/design-system). Router + the X-style AppShell. Feed is the
// home (/), the CV lives at /profile. Public routes (feed, post/article detail, profile) + the auth
// callback; admin routes (compose) sit behind RequireAuth.
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { FeedPage } from './pages/FeedPage';
import { PostPage } from './pages/PostPage';
import { ComposePage } from './pages/ComposePage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ArticlePage } from './pages/ArticlePage';
import { ComposeArticlePage } from './pages/ComposeArticlePage';
import { CallbackPage } from './pages/CallbackPage';
import { ShortLinkPage } from './pages/ShortLinkPage';
import { RequireAuth } from './auth/RequireAuth';
import { useAuth } from './auth/authStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  const init = useAuth((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<FeedPage />} />
            <Route path="/feed" element={<Navigate to="/" replace />} />
            <Route path="/posts/:postId" element={<PostPage />} />
            <Route path="/p/:code" element={<ShortLinkPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/articles/:slug" element={<ArticlePage />} />
            <Route path="/profile" element={<HomePage />} />
            <Route
              path="/compose"
              element={
                <RequireAuth admin>
                  <ComposePage />
                </RequireAuth>
              }
            />
            <Route
              path="/compose-article"
              element={
                <RequireAuth admin>
                  <ComposeArticlePage />
                </RequireAuth>
              }
            />
            <Route path="/callback" element={<CallbackPage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
