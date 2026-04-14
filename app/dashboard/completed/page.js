import { AdminShell } from '@/components/admin-shell';
import OperationsClient from '@/app/admin/operations-client';
import { getCachedAdminOperationalSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Feitos e Histórico | Dashboard',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function DashboardCompletedPage() {
  let initialData = null;

  try {
    initialData = await getCachedAdminOperationalSnapshot();
  } catch (error) {
    console.error('dashboard completed preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="completed"
      title="Feitos / Histórico"
      description="Tudo o que saiu da fila principal, com sensação clara de progresso, memória operacional e opção de reabrir."
    >
      <OperationsClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} view="completed" />
    </AdminShell>
  );
}

