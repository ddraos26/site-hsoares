import { AdminShell } from '@/components/admin-shell';
import CopilotClient from '@/app/admin/copilot-client';
import { getAdminAiCockpitSnapshot } from '@/lib/admin/ai-control-center';

export const metadata = {
  title: 'Centro de Decisão | Dashboard',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function DashboardDecisionCenterPage() {
  let initialData = null;

  try {
    initialData = await getAdminAiCockpitSnapshot();
  } catch (error) {
    console.error('dashboard decision center preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="copilot"
      title="Centro de Decisão"
      description="Diagnóstico, motivo, recomendação, impacto e prioridade organizados para a melhor decisão do dia."
    >
      <CopilotClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} />
    </AdminShell>
  );
}
