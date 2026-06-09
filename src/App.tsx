// App shell (/frontend/routing, /frontend/design-system). Router + Cloudscape TopNavigation (sign
// in/out via Cognito) + AppLayout with side nav. Public routes (CV, feed, post detail) + the auth
// callback; admin routes (compose) land in the next layer behind RequireAuth.
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from '@cloudscape-design/components/app-layout';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import { HomePage } from './pages/HomePage';
import { FeedPage } from './pages/FeedPage';
import { PostPage } from './pages/PostPage';
import { ComposePage } from './pages/ComposePage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ArticlePage } from './pages/ArticlePage';
import { ComposeArticlePage } from './pages/ComposeArticlePage';
import { CallbackPage } from './pages/CallbackPage';
import { RequireAuth } from './auth/RequireAuth';
import { useAuth } from './auth/authStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, email, isAdmin, signIn, signOut } = useAuth();

  const utilities =
    status === 'authenticated'
      ? [
          {
            type: 'menu-dropdown' as const,
            text: email ?? 'Account',
            iconName: 'user-profile' as const,
            items: [{ id: 'signout', text: 'Sign out' }],
            onItemClick: () => void signOut(),
          },
        ]
      : [{ type: 'button' as const, text: 'Sign in', onClick: () => void signIn() }];

  return (
    <>
      <div id="top-nav">
        <TopNavigation
          identity={{
            href: '/',
            title: 'tadeumendonca.io',
            onFollow: (e) => {
              e.preventDefault();
              navigate('/');
            },
          }}
          utilities={utilities}
        />
      </div>
      <AppLayout
        headerSelector="#top-nav"
        toolsHide
        navigation={
          <SideNavigation
            activeHref={location.pathname}
            header={{ href: '/', text: 'tadeumendonca.io' }}
            onFollow={(e) => {
              if (!e.detail.external) {
                e.preventDefault();
                navigate(e.detail.href);
              }
            }}
            items={[
              { type: 'link', text: 'CV', href: '/' },
              { type: 'link', text: 'Feed', href: '/feed' },
              { type: 'link', text: 'Articles', href: '/articles' },
              ...(isAdmin
                ? [
                    { type: 'link' as const, text: 'New post', href: '/compose' },
                    { type: 'link' as const, text: 'New article', href: '/compose-article' },
                  ]
                : []),
            ]}
          />
        }
        content={
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/posts/:postId" element={<PostPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/articles/:slug" element={<ArticlePage />} />
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
        }
        contentType="default"
      />
    </>
  );
}

export function App() {
  const init = useAuth((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
