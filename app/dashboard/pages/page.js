import { Suspense } from 'react';
import { AdminShell } from '@/components/admin-shell';
import PagesClient from '@/app/admin/pages-client';
import { getCachedAdminPagesSnapshot } from '@/lib/admin/server-snapshot-cache';
import { getDefaultPagesRange } from '@/lib/admin/pages-overview';

export const metadata = {
  title: 'Páginas | Dashboard',
  robots: { index: false, follow: false }
};

export default async function DashboardPagesPage() {
  const initialRange = getDefaultPagesRange();
  let initialData = null;

  try {
    initialData = await getCachedAdminPagesSnapshot(initialRange);
  } catch (error) {
    console.error('dashboard pages preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="pages"
      title="Páginas"
      description="Saúde das páginas, vazamentos, tráfego, cliques, lead rate e potencial de otimização antes de escalar mídia."
    >
      <Suspense fallback={<p className="dashboard-card-empty">Montando o mapa de páginas...</p>}>
        <PagesClient apiBase="/api/dashboard" initialData={initialData} initialRange={initialRange} />
      </Suspense>
    </AdminShell>
  );
}
