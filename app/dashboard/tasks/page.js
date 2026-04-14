import { AdminShell } from '@/components/admin-shell';
import TasksClient from '@/app/admin/tasks-client';
import { getCachedAdminTasksSnapshot } from '@/lib/admin/server-snapshot-cache';

export const metadata = {
  title: 'Tasks | Dashboard',
  robots: { index: false, follow: false }
};

export default async function DashboardTasksPage() {
  let initialData = null;

  try {
    initialData = await getCachedAdminTasksSnapshot();
  } catch (error) {
    console.error('dashboard tasks preload error', error);
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="tasks"
      title="Fila de Tarefas"
      description="Checklist operacional consolidado, vindo de missão diária, automações, aprovações, integrações e fila comercial."
    >
      <TasksClient apiBase="/api/dashboard" basePath="/dashboard" initialData={initialData} />
    </AdminShell>
  );
}
