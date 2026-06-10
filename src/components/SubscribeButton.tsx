// Subscribe control (/frontend/forms) — compact pill in the feed header. Subscribes the signed-in
// user's email to new-post notifications; anonymous users get a sign-in prompt instead.
import { Bell, Check } from 'lucide-react';
import { useAuth } from '../auth/authStore';
import { useSubscribe } from '../hooks/usePostMutations';

const pill = 'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors';

export function SubscribeButton() {
  const { status, email, signIn } = useAuth();
  const subscribe = useSubscribe();

  if (status !== 'authenticated') {
    return (
      <button onClick={() => void signIn()} className={`${pill} border border-border text-foreground hover:bg-muted`}>
        <Bell size={16} /> Sign in to subscribe
      </button>
    );
  }
  if (subscribe.isSuccess) {
    return (
      <span className={`${pill} text-primary`}>
        <Check size={16} /> Subscribed
      </span>
    );
  }
  return (
    <button
      onClick={() => email && subscribe.mutate(email)}
      disabled={subscribe.isPending}
      className={`${pill} bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60`}
    >
      <Bell size={16} /> Subscribe
    </button>
  );
}
