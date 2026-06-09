// Subscribe control (/frontend/forms) — shown to authenticated users on the feed. Subscribes the
// signed-in user's email to new-post notifications. Anonymous users see a prompt to sign in.
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import { useAuth } from '../auth/authStore';
import { useSubscribe } from '../hooks/usePostMutations';

export function SubscribeButton() {
  const { status, email, signIn } = useAuth();
  const subscribe = useSubscribe();

  if (status !== 'authenticated') {
    return (
      <Button iconName="notification" onClick={() => void signIn()}>
        Sign in to subscribe
      </Button>
    );
  }
  if (subscribe.isSuccess) {
    return (
      <Box>
        <StatusIndicator type="success">Subscribed — you’ll get new posts by email</StatusIndicator>
      </Box>
    );
  }
  return (
    <Button iconName="notification" loading={subscribe.isPending} onClick={() => email && subscribe.mutate(email)}>
      Subscribe to new posts
    </Button>
  );
}
