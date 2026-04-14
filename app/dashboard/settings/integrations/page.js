import { AdminShell } from '@/components/admin-shell';
import AdminConfiguracoesClient from '@/app/admin/configuracoes-client';
import { getCachedAdminIntegrationSnapshot } from '@/lib/admin/server-snapshot-cache';
import { getAdminAiReadinessSnapshot } from '@/lib/admin/ai-readiness';

export const metadata = {
  title: 'Integrações | Dashboard',
  robots: { index: false, follow: false }
};

export default async function DashboardSettingsIntegrationsPage() {
  let initialData = null;

  try {
    const [snapshot, aiReadiness] = await Promise.all([
      getCachedAdminIntegrationSnapshot(),
      getAdminAiReadinessSnapshot()
    ]);
    initialData = {
      ...snapshot,
      aiReadiness
    };
  } catch (error) {
    console.error('dashboard integrations preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="settings"
      title="Integrações"
      description="Status das integrações que alimentam o dashboard, com foco em prontidão operacional e leitura comercial."
    >
      <AdminConfiguracoesClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} />
    </AdminShell>
  );
}
