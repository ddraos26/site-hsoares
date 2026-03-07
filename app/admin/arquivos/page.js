import { AdminShell } from '@/components/admin-shell';
import FilesClient from '@/app/admin/files-client';

export const metadata = {
  title: 'Arquivos | Admin',
  robots: { index: false, follow: false }
};

export default function AdminFilesPage() {
  return (
    <AdminShell
      section="files"
      title="Arquivos recebidos"
      description="Central de anexos enviados nos formulários, com busca por lead, produto e período."
    >
      <FilesClient />
    </AdminShell>
  );
}
