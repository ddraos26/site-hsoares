import { AdminShell } from '@/components/admin-shell';
import AdminAiCostClient from '@/app/admin/ai-cost-client';
import { aiUsagePolicy } from '@/lib/admin/ai-usage-policy';
import { getCachedAdminDecisionEngineSnapshot } from '@/lib/admin/server-snapshot-cache';
import { getAdminAiReadinessSnapshot } from '@/lib/admin/ai-readiness';

export const metadata = {
  title: 'Controle de IA | Dashboard',
  robots: { index: false, follow: false }
};

export default async function DashboardSettingsAiBudgetPage() {
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
      aiUsagePolicy,
      aiReadiness
    };
  } catch (error) {
    console.error('dashboard ai cost preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="ai-cost"
      title="Controle de custo da IA"
      description="Orçamento, workflows, consumo e política de modo econômico para manter a IA útil e sob controle."
    >
      <AdminAiCostClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} />
    </AdminShell>
  );
}
