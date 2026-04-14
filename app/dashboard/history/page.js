import { AdminShell } from '@/components/admin-shell';
import { HistoryPanels } from '@/components/admin/admin-memory-panels';
import { getAdminHistorySnapshot } from '@/lib/admin/history-overview';

export const metadata = {
  title: 'Histórico | Dashboard',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function DashboardHistoryPage() {
  const data = await getAdminHistorySnapshot();

  return (
    <AdminShell
      basePath="/dashboard"
      section="history"
      title="Histórico"
      description="Memória operacional do sistema com decisões, tasks, registros e evolução da inteligência."
    >
      <HistoryPanels data={data} basePath="/dashboard" />
    </AdminShell>
  );
}
