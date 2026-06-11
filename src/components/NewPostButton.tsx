// New-post control (/frontend/forms) — admin-only action in the feed header; links to the compose
// page. Renders nothing for non-admins (same pattern as SubscribeButton's signed-in-only gating).
import { Link as RouterLink } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import { useAuth } from '../auth/authStore';

export function NewPostButton() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return (
    <RouterLink
      to="/compose"
      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
    >
      <PenSquare size={16} /> New post
    </RouterLink>
  );
}
