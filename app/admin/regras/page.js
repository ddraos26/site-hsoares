import { AdminShell } from '@/components/admin-shell';
import AdminRulesClient from '@/app/admin/rules-client';

export const metadata = {
  title: 'Regras | Admin',
  robots: { index: false, follow: false }
};

export default function AdminRulesPage() {
  return (
    <AdminShell
      section="rules"
      title="Regras de negócio"
      description="Thresholds, pesos, critérios de prioridade, governança comercial e parâmetros do motor de decisão."
    >
      <AdminRulesClient />
    </AdminShell>
  );
}
