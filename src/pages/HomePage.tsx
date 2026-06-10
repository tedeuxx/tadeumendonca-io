// Profile page (the public CV, at /profile). Fetches the profile and renders it, with
// loading/empty/error states (/frontend/ux-states). No auth (read-only).
import { useProfile } from '../hooks/useProfile';
import { ProfileView } from '../components/ProfileView';
import { ColumnHeader, CenterLoader, Notice, Empty } from '../components/Column';

export function HomePage() {
  const { data: profile, isLoading, isError } = useProfile();

  return (
    <div>
      <ColumnHeader title="Profile" />
      {isLoading && <CenterLoader />}
      {isError && <Notice>Could not load the profile. Please try again later.</Notice>}
      {!isLoading && !isError && !profile && <Empty>No profile yet.</Empty>}
      {profile && <ProfileView profile={profile} />}
    </div>
  );
}
