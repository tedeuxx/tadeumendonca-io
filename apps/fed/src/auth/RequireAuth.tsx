// Route guard (/frontend/authorization). Gates a route on authentication and, optionally, the `admin`
// group. This is COSMETIC defense — the BFF enforces the real authz server-side; this just avoids
// rendering admin UI to non-admins and kicks anonymous users to the hosted UI.
import type { ReactNode } from 'react';
import { CenterLoader, Notice } from '../components/Column';
import { useAuth } from './authStore';

export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { status, isAdmin, signIn } = useAuth();

  if (status === 'loading') return <CenterLoader />;

  if (status === 'anonymous') {
    void signIn(); // redirect to the hosted UI
    return <CenterLoader />;
  }

  if (admin && !isAdmin) {
    return (
      <Notice>
        <strong className="font-semibold">Forbidden</strong> — this page requires the admin role.
      </Notice>
    );
  }

  return <>{children}</>;
}
