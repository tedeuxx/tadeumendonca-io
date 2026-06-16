// Subscribe control (/frontend/forms) — compact pill in the feed header. Subscribes the signed-in
// user's email to new-post notifications; anonymous users see nothing (no sign-in prompt here).
import { Bell, Check } from 'lucide-react';
import { useAuth } from '../auth/authStore';
import { useSubscribe } from '../hooks/usePostMutations';

const pill = 'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors';

export function SubscribeButton() {
  const { status, email } = useAuth();
  const subscribe = useSubscribe();

  if (status !== 'authenticated') return null;

  if (subscribe.isSuccess) {
    return (
      <span className={`${pill} text-primary`}>
        <Check size={16} /> Inscrito
      </span>
    );
  }
  return (
    <button
      onClick={() => email && subscribe.mutate(email)}
      disabled={subscribe.isPending}
      className={`${pill} bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60`}
    >
      <Bell size={16} /> Inscrever-se
    </button>
  );
}
