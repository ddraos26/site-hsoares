import { AdminShell } from '@/components/admin-shell';
import { DailyChecklistPanel } from '@/components/admin/daily-checklist-panel';
import { getAdminDailyChecklistSnapshot } from '@/lib/admin/daily-checklist-store';

export const metadata = {
  title: 'Checklist do Dia | Dashboard',
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardChecklistPage() {
  let initialData = null;

  try {
    initialData = await getAdminDailyChecklistSnapshot();
  } catch (error) {
    console.error('dashboard checklist preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="checklist"
      title="Checklist do Dia"
      description="Uma lista curta e clicavel para voce nao se perder no dashboard. Marque o que foi feito e siga o foco do dia."
    >
      <DailyChecklistPanel apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} />
    </AdminShell>
  );
}
