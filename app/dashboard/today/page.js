import { AdminShell } from '@/components/admin-shell';
import OperationsClient from '@/app/admin/operations-client';
import { getCachedAdminOperationalSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Hoje | Dashboard',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function DashboardTodayPage() {
  let initialData = null;

  try {
    initialData = await getCachedAdminOperationalSnapshot();
  } catch (error) {
    console.error('dashboard today preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="today"
      title="Hoje"
      description="A tela principal do admin: um foco dominante, três secundários e só o que realmente precisa andar agora."
    >
      <OperationsClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} view="today" />
    </AdminShell>
  );
}

