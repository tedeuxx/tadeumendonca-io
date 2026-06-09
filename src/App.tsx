import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from '@cloudscape-design/components/app-layout';
import { HomePage } from './pages/HomePage';

// Single-page CV for Phase 1 (no router/auth yet — Feed/Articles + RequireAuth land in Phase 2/3).
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout
        navigationHide
        toolsHide
        content={<HomePage />}
        contentType="default"
      />
    </QueryClientProvider>
  );
}
