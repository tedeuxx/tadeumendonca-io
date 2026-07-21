// App root (/frontend/routing, /frontend/design-system). Router + the X-style AppShell. Feed is the
// home (/), the CV lives at /profile. Public routes (feed, post/article detail, profile) + the auth
// callback; admin routes (compose) sit behind RequireAuth.
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persister, PERSIST_MAX_AGE } from './lib/offline';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { FeedPage } from './pages/FeedPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { PostPage } from './pages/PostPage';
import { ComposePage } from './pages/ComposePage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ArticlePage } from './pages/ArticlePage';
import { ComposeArticlePage } from './pages/ComposeArticlePage';
import { ComposePollPage } from './pages/ComposePollPage';
import { AccountPage } from './pages/AccountPage';
import { CallbackPage } from './pages/CallbackPage';
import { ShortLinkPage } from './pages/ShortLinkPage';
import { RequireAuth } from './auth/RequireAuth';
import { useAuth } from './auth/authStore';

export function App() {
  const init = useAuth((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE }}
      // Once the cache is rehydrated, replay any mutations that were queued offline in a prior session.
      // (React Query also auto-resumes them the moment connectivity returns within a session.)
      onSuccess={() => void queryClient.resumePausedMutations()}
    >
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/posts/:postId" element={<PostPage />} />
            <Route path="/p/:code" element={<ShortLinkPage />} />
            <Route path="/blog" element={<ArticlesPage />} />
            <Route path="/blog/:slug" element={<ArticlePage />} />
            {/* Back-compat: old /articles deep-links (og:image, notifications) still resolve. */}
            <Route path="/articles" element={<Navigate to="/blog" replace />} />
            <Route path="/articles/:slug" element={<ArticlePage />} />
            {/* Back-compat: /profile deep-links (og:image, older shares) now land on the CV landing. */}
            <Route path="/profile" element={<Navigate to="/" replace />} />
            <Route
              path="/compose"
              element={
                <RequireAuth admin>
                  <ComposePage />
                </RequireAuth>
              }
            />
            <Route
              path="/compose/:postId"
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
            <Route
              path="/compose-article/:slug"
              element={
                <RequireAuth admin>
                  <ComposeArticlePage />
                </RequireAuth>
              }
            />
            <Route
              path="/compose-poll"
              element={
                <RequireAuth admin>
                  <ComposePollPage />
                </RequireAuth>
              }
            />
            <Route
              path="/compose-poll/:pollId"
              element={
                <RequireAuth admin>
                  <ComposePollPage />
                </RequireAuth>
              }
            />
            <Route
              path="/conta"
              element={
                <RequireAuth>
                  <AccountPage />
                </RequireAuth>
              }
            />
            <Route path="/callback" element={<CallbackPage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </PersistQueryClientProvider>
  );
}
