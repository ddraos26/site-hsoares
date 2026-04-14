import { AdminShell } from '@/components/admin-shell';
import DashboardClient from './dashboard-client';
import { getCachedExecutiveDashboardSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Dashboard Executivo | Admin',
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminPage() {
  let initialData = null;

  try {
    initialData = await getCachedExecutiveDashboardSnapshot();
  } catch (error) {
    console.error('admin page preload error', error);
  }

  return (
    <AdminShell
      section="dashboard"
      title="Hoje"
      description="Comece aqui. O sistema deve te mostrar o que fazer agora, o que está travando e para onde seguir depois."
    >
      <DashboardClient initialData={initialData} />
    </AdminShell>
  );
}
