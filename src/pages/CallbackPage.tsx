// OAuth redirect landing (/frontend/authentication). Amplify processes the ?code= exchange
// automatically on load and emits a Hub auth event; we hydrate the store and route on home. Covers
// both the event path and the already-processed path (init runs immediately too).
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hub } from 'aws-amplify/utils';
import Box from '@cloudscape-design/components/box';
import Spinner from '@cloudscape-design/components/spinner';
import { useAuth } from '../auth/authStore';

export function CallbackPage() {
  const navigate = useNavigate();
  const init = useAuth((s) => s.init);

  useEffect(() => {
    const finish = async (to: string) => {
      await init();
      navigate(to, { replace: true });
    };
    const unsub = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect') void finish('/feed');
      if (payload.event === 'signInWithRedirect_failure') void finish('/');
    });
    // If the code was already exchanged before this mounted, hydrate + leave.
    void (async () => {
      await init();
      if (useAuth.getState().status === 'authenticated') navigate('/feed', { replace: true });
    })();
    return unsub;
  }, [init, navigate]);

  return (
    <Box textAlign="center" padding="xxl">
      <Spinner size="large" /> Signing you in…
    </Box>
  );
}
