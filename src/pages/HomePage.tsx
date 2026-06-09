// HomePage — the public CV. Fetches the profile and renders it, with loading/empty/error states
// (/frontend/ux-states). No auth (Phase 1 is read-only).
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';
import { useProfile } from '../hooks/useProfile';
import { ProfileView } from '../components/ProfileView';

export function HomePage() {
  const { data: profile, isLoading, isError } = useProfile();

  return (
    <ContentLayout header={<Header variant="h1">tadeumendonca.io</Header>}>
      {isLoading && (
        <Container>
          <Box textAlign="center" padding="l">
            <Spinner size="large" /> <Box variant="span">Loading profile…</Box>
          </Box>
        </Container>
      )}

      {isError && (
        <Alert type="error" header="Could not load the profile">
          Please try again later.
        </Alert>
      )}

      {!isLoading && !isError && !profile && (
        <Container>
          <Box textAlign="center" color="text-body-secondary" padding="l">
            No profile yet.
          </Box>
        </Container>
      )}

      {profile && <ProfileView profile={profile} />}
    </ContentLayout>
  );
}
