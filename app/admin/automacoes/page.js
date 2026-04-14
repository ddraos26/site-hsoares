import { AdminShell } from '@/components/admin-shell';
import AdminAutomationsClient from '@/app/admin/automations-client';
import { getCachedAdminDecisionEngineSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Sugestões do Sistema | Admin',
  robots: { index: false, follow: false }
};

export default async function AdminAutomationsPage() {
  let initialData = null;

  try {
    const snapshot = await getCachedAdminDecisionEngineSnapshot();
    initialData = {
      checkedAt: snapshot.checkedAt,
      automations: snapshot.automations,
      jobs: snapshot.jobs,
      operations: snapshot.operations,
      mission: snapshot.mission,
      approvals: snapshot.approvals,
      guardrails: snapshot.guardrails,
      cost: snapshot.cost
    };
  } catch (error) {
    console.error('admin automations preload error', error);
  }

  return (
    <AdminShell
      section="automations"
      title="Sugestões do sistema"
      description="Leitura automatizada, checklist do dia e recomendações claras. Nada aqui executa mudança no site ou na mídia sozinho."
    >
      <AdminAutomationsClient initialData={initialData} />
    </AdminShell>
  );
}
