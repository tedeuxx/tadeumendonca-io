// Route guard (/frontend/authorization). Gates a route on authentication and, optionally, the `admin`
// group. This is COSMETIC defense — the BFF enforces the real authz server-side; this just avoids
// rendering admin UI to non-admins and kicks anonymous users to the hosted UI.
import type { ReactNode } from 'react';
import Spinner from '@cloudscape-design/components/spinner';
import Box from '@cloudscape-design/components/box';
import Alert from '@cloudscape-design/components/alert';
import { useAuth } from './authStore';

export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { status, isAdmin, signIn } = useAuth();

  if (status === 'loading') {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
      </Box>
    );
  }

  if (status === 'anonymous') {
    void signIn(); // redirect to the hosted UI
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner /> Redirecting to sign in…
      </Box>
    );
  }

  if (admin && !isAdmin) {
    return (
      <Box padding="l">
        <Alert type="error" header="Forbidden">
          This page requires the admin role.
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
}
