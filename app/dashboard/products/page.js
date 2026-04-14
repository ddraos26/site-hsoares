import { Suspense } from 'react';
import { AdminShell } from '@/components/admin-shell';
import ProductsClient from '@/app/admin/products-client';
import { getCachedAdminProductsSnapshot } from '@/lib/admin/server-snapshot-cache';
import { getDefaultProductsRange } from '@/lib/admin/products-overview';

export const metadata = {
  title: 'Produtos | Dashboard',
  robots: { index: false, follow: false }
};

export default async function DashboardProductsPage() {
  const initialRange = getDefaultProductsRange();
  let initialData = null;

  try {
    initialData = await getCachedAdminProductsSnapshot(initialRange);
  } catch (error) {
    console.error('dashboard products preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="products"
      title="Produtos"
      description="Prioridade comercial, tração, oportunidade, urgência e leitura consolidada dos produtos estratégicos."
    >
      <Suspense fallback={<p className="dashboard-card-empty">Montando o mapa de produtos...</p>}>
        <ProductsClient apiBase="/api/dashboard" initialData={initialData} initialRange={initialRange} />
      </Suspense>
    </AdminShell>
  );
}
