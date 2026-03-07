import { AdminShell } from '@/components/admin-shell';
import TeamClient from '@/app/admin/team-client';

export const metadata = {
  title: 'Equipe | Admin',
  robots: { index: false, follow: false }
};

export default function AdminTeamPage() {
  return (
    <AdminShell
      section="team"
      title="Equipe"
      description="Distribuição de carteira, produtividade e acompanhamento por responsável."
    >
      <TeamClient />
    </AdminShell>
  );
}
