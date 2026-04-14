import { AdminShell } from '@/components/admin-shell';
import AdminApprovalsClient from '@/app/admin/approvals-client';
import { getAdminAiApprovalsSnapshot } from '@/lib/admin/ai-control-center';

export const metadata = {
  title: 'Aprovações | Admin',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function AdminApprovalsPage({ searchParams }) {
  let initialData = null;
  const resolvedSearchParams = await searchParams;
  const guide = typeof resolvedSearchParams?.guide === 'string' ? resolvedSearchParams.guide : '';

  try {
    initialData = await getAdminAiApprovalsSnapshot();
  } catch (error) {
    console.error('admin approvals preload error', error);
  }

  return (
    <AdminShell
      section="approvals"
      title="Decisões"
      description="Aqui você só decide o que o sistema pode seguir ou não. Nada de estudar o painel inteiro."
    >
      <AdminApprovalsClient initialData={initialData} guide={guide} />
    </AdminShell>
  );
}
