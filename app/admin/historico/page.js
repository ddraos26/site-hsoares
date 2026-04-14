import { AdminShell } from '@/components/admin-shell';
import { HistoryPanels } from '@/components/admin/admin-memory-panels';
import { getAdminHistorySnapshot } from '@/lib/admin/history-overview';

export const metadata = {
  title: 'Histórico & Logs | Admin',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function AdminHistoryPage() {
  const data = await getAdminHistorySnapshot();

  return (
    <AdminShell
      section="history"
      title="Feitos"
      description="Memória simples do que foi sugerido, decidido, registrado e do que ainda precisa ser revisto."
    >
      <HistoryPanels data={data} basePath="/admin" />
    </AdminShell>
  );
}
