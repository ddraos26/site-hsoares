import { AdminShell } from '@/components/admin-shell';
import SeoClient from '@/app/admin/seo-client';
import { getCachedSearchConsoleOpportunitySnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'SEO | Admin',
  robots: { index: false, follow: false }
};

export default async function AdminSeoPage() {
  let initialData = null;

  try {
    initialData = await getCachedSearchConsoleOpportunitySnapshot();
  } catch (error) {
    console.error('admin seo preload error', error);
  }

  return (
    <AdminShell
      section="seo"
      title="SEO"
      description="Queries, páginas orgânicas, oportunidades, indexação e prioridade editorial com foco comercial."
    >
      <SeoClient initialData={initialData} />
    </AdminShell>
  );
}
