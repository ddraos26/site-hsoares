import { AdminShell } from '@/components/admin-shell';
import CopilotClient from '../copilot-client';
import { getAdminAiCockpitSnapshot } from '@/lib/admin/ai-control-center';

export const metadata = {
  title: 'Centro de Decisão | Admin',
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = 'force-dynamic';

export default async function AdminCopilotoPage({ searchParams }) {
  let initialData = null;
  const resolvedSearchParams = await searchParams;
  const guide = typeof resolvedSearchParams?.guide === 'string' ? resolvedSearchParams.guide : '';

  try {
    initialData = await getAdminAiCockpitSnapshot();
  } catch (error) {
    console.error('admin copilot preload error', error);
  }

  return (
    <AdminShell
      section="copilot"
      title="Centro de decisão"
      description="Seu segundo cérebro operacional: o que priorizar hoje, onde está o desperdício, o que merece escala e quais ações pedem aprovação."
    >
      <CopilotClient initialData={initialData} guide={guide} />
    </AdminShell>
  );
}
