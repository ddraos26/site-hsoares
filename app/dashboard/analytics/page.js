import { AdminShell } from '@/components/admin-shell';
import AnalyticsClient from '@/app/admin/analytics-client';
import { getCachedBehaviorIntelligenceSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Analytics / Comportamento | Dashboard',
  robots: { index: false, follow: false }
};

export default async function DashboardAnalyticsPage() {
  let initialData = null;

  try {
    initialData = await getCachedBehaviorIntelligenceSnapshot();
  } catch (error) {
    console.error('dashboard analytics preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="analytics"
      title="Analytics / Comportamento"
      description="Usuários, sessões, canais, jornadas, eventos-chave e comportamento por dispositivo e produto."
    >
      <AnalyticsClient apiBase="/api/dashboard" initialData={initialData} />
    </AdminShell>
  );
}
