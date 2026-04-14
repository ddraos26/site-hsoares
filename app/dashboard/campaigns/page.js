import { Suspense } from 'react';
import { AdminShell } from '@/components/admin-shell';
import CampaignsClient from '@/app/admin/campaigns-client';
import { getCachedAdminCampaignsSnapshot } from '@/lib/admin/server-snapshot-cache';
import { getDefaultCampaignsRange } from '@/lib/admin/campaigns-overview';

export const metadata = {
  title: 'Campanhas | Dashboard',
  robots: { index: false, follow: false }
};

export default async function DashboardCampaignsPage() {
  const initialRange = getDefaultCampaignsRange();
  let initialData = null;

  try {
    initialData = await getCachedAdminCampaignsSnapshot(initialRange);
  } catch (error) {
    console.error('dashboard campaigns preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="campaigns"
      title="Campanhas"
      description="Leitura consolidada de aquisição, CTR, cliques, leads, eficiência e indícios de escala ou revisão."
    >
      <Suspense fallback={<p className="dashboard-card-empty">Montando o mapa de campanhas...</p>}>
        <CampaignsClient apiBase="/api/dashboard" initialData={initialData} initialRange={initialRange} />
      </Suspense>
    </AdminShell>
  );
}
