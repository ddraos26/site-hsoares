import { AdminShell } from '@/components/admin-shell';
import PagesClient from '@/app/admin/pages-client';

export const metadata = {
  title: 'Páginas | Admin',
  robots: { index: false, follow: false }
};

export default function AdminPagesPage() {
  return (
    <AdminShell
      section="pages"
      title="Páginas"
      description="Leitura de tráfego, cliques e geração de leads por rota do site."
    >
      <PagesClient />
    </AdminShell>
  );
}
