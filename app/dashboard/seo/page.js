import { AdminShell } from '@/components/admin-shell';
import SeoClient from '@/app/admin/seo-client';
import { getCachedSearchConsoleOpportunitySnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'SEO | Dashboard',
  robots: { index: false, follow: false }
};

export default async function DashboardSeoPage() {
  let initialData = null;

  try {
    initialData = await getCachedSearchConsoleOpportunitySnapshot();
  } catch (error) {
    console.error('dashboard seo preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="seo"
      title="SEO"
      description="Queries, páginas orgânicas, CTR, oportunidade, indexação e prioridade editorial com foco comercial."
    >
      <SeoClient apiBase="/api/dashboard" initialData={initialData} />
    </AdminShell>
  );
}
