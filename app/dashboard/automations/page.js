import { AdminShell } from '@/components/admin-shell';
import OperationsClient from '@/app/admin/operations-client';
import { getCachedAdminOperationalSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Automações | Dashboard',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function DashboardAutomationsPage() {
  let initialData = null;

  try {
    initialData = await getCachedAdminOperationalSnapshot();
  } catch (error) {
    console.error('dashboard automations preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="automations"
      title="Automações"
      description="Regras reais que transformam leitura em ação: criam tarefa, aprovam fluxo, movem fila e fecham ciclo."
    >
      <OperationsClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} view="automations" />
    </AdminShell>
  );
}

