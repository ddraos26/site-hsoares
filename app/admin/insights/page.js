import { AdminShell } from '@/components/admin-shell';
import AdminInsightsClient from '@/app/admin/insights-client';
import { getAdminAiInsightsSnapshot } from '@/lib/admin/ai-control-center';

export const metadata = {
  title: 'IA / Insights | Admin',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function AdminInsightsPage() {
  let initialData = null;

  try {
    initialData = await getAdminAiInsightsSnapshot();
  } catch (error) {
    console.error('admin insights preload error', error);
  }

  return (
    <AdminShell
      section="insights"
      title="IA / Insights"
      description="Diagnósticos, hipóteses, recomendações e narrativas automáticas para comercial, mídia, SEO e páginas."
    >
      <AdminInsightsClient initialData={initialData} />
    </AdminShell>
  );
}
