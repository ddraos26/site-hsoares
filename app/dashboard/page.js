import { AdminShell } from '@/components/admin-shell';
import OperationsClient from '@/app/admin/operations-client';
import { getCachedAdminOperationalSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Hoje | Dashboard',
  robots: { index: false, follow: false }
};

export default async function DashboardHomePage() {
  let initialData = null;

  try {
    initialData = await getCachedAdminOperationalSnapshot();
  } catch (error) {
    console.error('dashboard home preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="today"
      title="Hoje"
      description="Se você abrir o admin agora, precisa saber exatamente o que fazer nos próximos 30 minutos."
    >
      <OperationsClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} view="today" />
    </AdminShell>
  );
}
