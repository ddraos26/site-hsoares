import { Suspense } from 'react';
import { AdminShell } from '@/components/admin-shell';
import CampaignsClient from '@/app/admin/campaigns-client';
import { getCachedAdminCampaignsSnapshot } from '@/lib/admin/server-snapshot-cache';
import { getDefaultCampaignsRange } from '@/lib/admin/campaigns-overview';

export const metadata = {
  title: 'Campanhas | Admin',
  robots: { index: false, follow: false }
};

export default async function AdminCampaignsPage() {
  const initialRange = getDefaultCampaignsRange();
  let initialData = null;

  try {
    initialData = await getCachedAdminCampaignsSnapshot(initialRange);
  } catch (error) {
    console.error('admin campaigns preload error', error);
  }

  return (
    <AdminShell
      section="campaigns"
      title="Campanhas"
      description="Google Ads, captação do site, eficiência de mídia e decisões práticas para escalar ou revisar."
    >
      <Suspense fallback={<p className="dashboard-card-empty">Montando o mapa de campanhas...</p>}>
        <CampaignsClient initialData={initialData} initialRange={initialRange} />
      </Suspense>
    </AdminShell>
  );
}
