import { AdminShell } from '@/components/admin-shell';
import DashboardClient from './dashboard-client';

export const metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return (
    <AdminShell
      section="dashboard"
      title="Dashboard comercial"
      description="Leitura rápida da operação, páginas com mais tração e presença atual no site."
    >
      <DashboardClient />
    </AdminShell>
  );
}
