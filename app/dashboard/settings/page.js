import { AdminShell } from '@/components/admin-shell';
import AdminConfiguracoesClient from '@/app/admin/configuracoes-client';
import { getCachedAdminIntegrationSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Configurações | Dashboard',
  robots: { index: false, follow: false }
};

export default async function DashboardSettingsPage() {
  let initialData = null;

  try {
    initialData = await getCachedAdminIntegrationSnapshot();
  } catch (error) {
    console.error('dashboard settings preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="settings"
      title="Configurações e integrações"
      description="Centro de prontidão do sistema: o que já alimenta o cockpit, o que falta conectar e o que isso destrava."
    >
      <AdminConfiguracoesClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} />
    </AdminShell>
  );
}
