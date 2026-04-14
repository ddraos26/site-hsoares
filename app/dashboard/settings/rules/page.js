import { AdminShell } from '@/components/admin-shell';
import AdminRulesClient from '@/app/admin/rules-client';

export const metadata = {
  title: 'Regras | Dashboard',
  robots: { index: false, follow: false }
};

export default function DashboardSettingsRulesPage() {
  return (
    <AdminShell
      basePath="/dashboard"
      section="rules"
      title="Regras de negócio"
      description="Thresholds, automações, severidade e critérios que orientam as classificações e recomendações do sistema."
    >
      <AdminRulesClient apiBase="/api/dashboard" />
    </AdminShell>
  );
}
