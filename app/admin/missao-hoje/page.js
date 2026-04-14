import { AdminShell } from '@/components/admin-shell';
import MissionClient from '@/app/admin/mission-client';
import { getAdminAiCockpitSnapshot } from '@/lib/admin/ai-control-center';

export const metadata = {
  title: 'Missão de Hoje | Admin',
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = 'force-dynamic';

export default async function AdminMissionPage() {
  let initialData = null;

  try {
    initialData = await getAdminAiCockpitSnapshot();
  } catch (error) {
    console.error('admin mission preload error', error);
  }

  return (
    <AdminShell
      section="mission"
      title="Missão de Hoje"
      description="Resumo do dia, ações recomendadas, riscos, oportunidades e tudo o que precisa de você agora."
    >
      <MissionClient initialData={initialData} />
    </AdminShell>
  );
}
