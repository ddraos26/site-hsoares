import { AdminShell } from '@/components/admin-shell';
import CampaignsClient from '@/app/admin/campaigns-client';

export const metadata = {
  title: 'Campanhas | Admin',
  robots: { index: false, follow: false }
};

export default function AdminCampaignsPage() {
  return (
    <AdminShell
      section="campaigns"
      title="Campanhas"
      description="Performance por UTM, leitura de aquisição e retorno comercial do tráfego."
    >
      <CampaignsClient />
    </AdminShell>
  );
}
