import { AdminShell } from '@/components/admin-shell';
import OperationsClient from '@/app/admin/operations-client';
import { getCachedAdminOperationalSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Fazer Agora | Dashboard',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function DashboardQueuePage() {
  let initialData = null;

  try {
    initialData = await getCachedAdminOperationalSnapshot();
  } catch (error) {
    console.error('dashboard queue preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="queue"
      title="Fazer Agora"
      description="Fila prática com no máximo cinco itens e contexto suficiente para sair da recomendação e ir para a execução."
    >
      <OperationsClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} view="queue" />
    </AdminShell>
  );
}

