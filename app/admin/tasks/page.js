import { AdminShell } from '@/components/admin-shell';
import TasksClient from '@/app/admin/tasks-client';
import { getCachedAdminTasksSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Tasks | Admin',
  robots: { index: false, follow: false }
};

export default async function AdminTasksPage({ searchParams }) {
  let initialData = null;
  const resolvedSearchParams = await searchParams;
  const guide = typeof resolvedSearchParams?.guide === 'string' ? resolvedSearchParams.guide : '';

  try {
    initialData = await getCachedAdminTasksSnapshot();
  } catch (error) {
    console.error('admin tasks preload error', error);
  }

  return (
    <AdminShell
      section="tasks"
      title="Fazer Agora"
      description="Fila prática do que precisa ser feito agora, sem precisar pensar em qual módulo entrar."
    >
      <TasksClient initialData={initialData} guide={guide} />
    </AdminShell>
  );
}
