import { AdminShell } from '@/components/admin-shell';
import ProductsClient from '@/app/admin/products-client';

export const metadata = {
  title: 'Produtos | Admin',
  robots: { index: false, follow: false }
};

export default function AdminProductsPage() {
  return (
    <AdminShell
      section="products"
      title="Produtos"
      description="Leitura de performance por produto, conversão comercial e tração das páginas de seguro."
    >
      <ProductsClient />
    </AdminShell>
  );
}
