import { AdminShell } from '@/components/admin-shell';
import OperationsClient from '@/app/admin/operations-client';
import { getCachedAdminOperationalSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Radar | Dashboard',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function DashboardRadarPage() {
  let initialData = null;

  try {
    initialData = await getCachedAdminOperationalSnapshot();
  } catch (error) {
    console.error('dashboard radar preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="radar"
      title="Oportunidades / Radar"
      description="O lugar do talvez depois: promessas reais que ainda não merecem ocupar seus próximos 30 minutos."
    >
      <OperationsClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} view="radar" />
    </AdminShell>
  );
}

