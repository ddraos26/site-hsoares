import { AdminShell } from '@/components/admin-shell';
import AdminApprovalsClient from '@/app/admin/approvals-client';
import { getAdminAiApprovalsSnapshot } from '@/lib/admin/ai-control-center';

export const metadata = {
  title: 'Aprovações | Dashboard',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function DashboardApprovalsPage() {
  let initialData = null;

  try {
    initialData = await getAdminAiApprovalsSnapshot();
  } catch (error) {
    console.error('dashboard approvals preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="approvals"
      title="Aprovações"
      description="Fila de ações sensíveis aguardando sua validação antes de qualquer mudança importante."
    >
      <AdminApprovalsClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} />
    </AdminShell>
  );
}
