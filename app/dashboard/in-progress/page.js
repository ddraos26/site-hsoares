import { AdminShell } from '@/components/admin-shell';
import OperationsClient from '@/app/admin/operations-client';
import { getCachedAdminOperationalSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Executando | Dashboard',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function DashboardInProgressPage() {
  let initialData = null;

  try {
    initialData = await getCachedAdminOperationalSnapshot();
  } catch (error) {
    console.error('dashboard in-progress preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="in-progress"
      title="Executando"
      description="Tudo o que já foi iniciado e ainda não terminou, para nada se perder entre começo e conclusão."
    >
      <OperationsClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} view="in-progress" />
    </AdminShell>
  );
}

