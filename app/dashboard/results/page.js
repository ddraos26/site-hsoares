import { AdminShell } from '@/components/admin-shell';
import OperationsClient from '@/app/admin/operations-client';
import { getCachedAdminOperationalSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Resultados | Dashboard',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function DashboardResultsPage() {
  let initialData = null;

  try {
    initialData = await getCachedAdminOperationalSnapshot();
  } catch (error) {
    console.error('dashboard results preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="results"
      title="Resultados"
      description="Before/after operacional para fechar o ciclo: executar, sumir da fila, medir e aprender."
    >
      <OperationsClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} view="results" />
    </AdminShell>
  );
}
