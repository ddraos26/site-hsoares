import { AdminShell } from '@/components/admin-shell';
import AnalyticsClient from '@/app/admin/analytics-client';
import { getCachedBehaviorIntelligenceSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Analytics | Admin',
  robots: { index: false, follow: false }
};

export default async function AdminAnalyticsPage() {
  let initialData = null;

  try {
    initialData = await getCachedBehaviorIntelligenceSnapshot();
  } catch (error) {
    console.error('admin analytics preload error', error);
  }

  return (
    <AdminShell
      section="analytics"
      title="Analytics / Comportamento"
      description="Usuários, sessões, canais, jornadas, eventos-chave e comportamento por dispositivo e produto."
    >
      <AnalyticsClient initialData={initialData} />
    </AdminShell>
  );
}
