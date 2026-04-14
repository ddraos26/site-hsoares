import { AdminShell } from '@/components/admin-shell';
import { DailyChecklistPanel } from '@/components/admin/daily-checklist-panel';
import { getAdminDailyChecklistSnapshot } from '@/lib/admin/daily-checklist-store';

export const metadata = {
  title: 'Checklist do Dia | Admin',
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminChecklistPage() {
  let initialData = null;

  try {
    initialData = await getAdminDailyChecklistSnapshot();
  } catch (error) {
    console.error('admin checklist preload error', error);
  }

  return (
    <AdminShell
      section="checklist"
      title="Checklist do Dia"
      description="Uma lista curta e clicavel para voce nao se perder no admin. Marque o que foi feito e siga o foco do dia."
    >
      <DailyChecklistPanel initialData={initialData} />
    </AdminShell>
  );
}
