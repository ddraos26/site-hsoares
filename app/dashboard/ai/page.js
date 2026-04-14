import { AdminShell } from '@/components/admin-shell';
import AdminInsightsClient from '@/app/admin/insights-client';
import { getAdminAiInsightsSnapshot } from '@/lib/admin/ai-control-center';

export const metadata = {
  title: 'IA / Insights | Dashboard',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function DashboardAiPage() {
  let initialData = null;

  try {
    initialData = await getAdminAiInsightsSnapshot();
  } catch (error) {
    console.error('dashboard insights preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="insights"
      title="IA / Insights"
      description="Diagnósticos, hipóteses, recomendações e narrativas automáticas para comercial, mídia, SEO e páginas."
    >
      <AdminInsightsClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} />
    </AdminShell>
  );
}
