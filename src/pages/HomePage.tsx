// Profile page (the public CV, at /profile). Fetches the profile and renders it, with
// loading/empty/error states (/frontend/ux-states). No auth (read-only).
import { useProfile } from '../hooks/useProfile';
import { ProfileView } from '../components/ProfileView';
import { ColumnHeader, CenterLoader, Notice, Empty } from '../components/Column';

export function HomePage() {
  const { data: profile, isLoading, isError } = useProfile();

  return (
    <div>
      <ColumnHeader title="Quem Sou" />
      {isLoading && <CenterLoader />}
      {isError && <Notice>Não foi possível carregar o perfil. Tente novamente mais tarde.</Notice>}
      {!isLoading && !isError && !profile && <Empty>Perfil ainda não disponível.</Empty>}
      {profile && <ProfileView profile={profile} />}
    </div>
  );
}
