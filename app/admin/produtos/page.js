import { Suspense } from 'react';
import { AdminShell } from '@/components/admin-shell';
import ProductsClient from '@/app/admin/products-client';
import { getCachedAdminProductsSnapshot } from '@/lib/admin/server-snapshot-cache';
import { getDefaultProductsRange } from '@/lib/admin/products-overview';

export const metadata = {
  title: 'Produtos | Admin',
  robots: { index: false, follow: false }
};

export default async function AdminProductsPage() {
  const initialRange = getDefaultProductsRange();
  let initialData = null;

  try {
    initialData = await getCachedAdminProductsSnapshot(initialRange);
  } catch (error) {
    console.error('admin products preload error', error);
  }

  return (
    <AdminShell
      section="products"
      title="Produtos"
      description="Leitura de performance por produto, conversão comercial e tração das páginas de seguro."
    >
      <Suspense fallback={<p className="dashboard-card-empty">Montando o mapa de produtos...</p>}>
        <ProductsClient initialData={initialData} initialRange={initialRange} />
      </Suspense>
    </AdminShell>
  );
}
