import { Suspense } from 'react';
import { AdminShell } from '@/components/admin-shell';
import PagesClient from '@/app/admin/pages-client';
import { getCachedAdminPagesSnapshot } from '@/lib/admin/server-snapshot-cache';
import { getDefaultPagesRange } from '@/lib/admin/pages-overview';

export const metadata = {
  title: 'Páginas | Admin',
  robots: { index: false, follow: false }
};

export default async function AdminPagesPage() {
  const initialRange = getDefaultPagesRange();
  let initialData = null;

  try {
    initialData = await getCachedAdminPagesSnapshot(initialRange);
  } catch (error) {
    console.error('admin pages preload error', error);
  }

  return (
    <AdminShell
      section="pages"
      title="Páginas"
      description="Leitura de tráfego, cliques e geração de leads por rota do site."
    >
      <Suspense fallback={<p className="dashboard-card-empty">Montando o mapa de páginas...</p>}>
        <PagesClient initialData={initialData} initialRange={initialRange} />
      </Suspense>
    </AdminShell>
  );
}
