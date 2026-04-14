import { AdminShell } from '@/components/admin-shell';
import AdminConfiguracoesClient from '../configuracoes-client';
import { getCachedAdminIntegrationSnapshot } from '@/lib/admin/server-snapshot-cache';
import { getAdminAiReadinessSnapshot } from '@/lib/admin/ai-readiness';

export const metadata = {
  title: 'Configurações e integrações | Admin',
  robots: { index: false, follow: false }
};

export default async function AdminConfiguracoesPage() {
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
    console.error('admin settings preload error', error);
  }

  return (
    <AdminShell
      section="settings"
      title="Configurações e integrações"
      description="Centro de prontidão do admin: o que já alimenta o cockpit, o que falta conectar e o que isso destrava no copiloto comercial."
    >
      <AdminConfiguracoesClient initialData={initialData} />
    </AdminShell>
  );
}
