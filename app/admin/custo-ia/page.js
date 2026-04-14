import { AdminShell } from '@/components/admin-shell';
import AdminAiCostClient from '@/app/admin/ai-cost-client';
import { getCachedAdminDecisionEngineSnapshot } from '@/lib/admin/server-snapshot-cache';
import { getAdminAiReadinessSnapshot } from '@/lib/admin/ai-readiness';

export const metadata = {
  title: 'Controle IA | Admin',
  robots: { index: false, follow: false }
};

export default async function AdminAiCostPage() {
  let initialData = null;

  try {
    const [snapshot, aiReadiness] = await Promise.all([
      getCachedAdminDecisionEngineSnapshot(),
      getAdminAiReadinessSnapshot()
    ]);
    initialData = {
      checkedAt: snapshot.checkedAt,
      cost: snapshot.cost,
      promptBundle: snapshot.promptBundle,
      aiReadiness
    };
  } catch (error) {
    console.error('admin ai cost preload error', error);
  }

  return (
    <AdminShell
      section="ai-cost"
      title="Controle de custo da IA"
      description="Uso de modelos, custo por workflow, limites, orçamento e eficiência da camada de inteligência."
    >
      <AdminAiCostClient initialData={initialData} />
    </AdminShell>
  );
}
