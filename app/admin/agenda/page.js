import { AdminShell } from '@/components/admin-shell';
import AgendaClient from '@/app/admin/agenda-client';

export const metadata = {
  title: 'Agenda | Admin',
  robots: { index: false, follow: false }
};

export default function AdminAgendaPage() {
  return (
    <AdminShell
      section="agenda"
      title="Agenda comercial"
      description="Retornos vencidos, próximos contatos e gargalos operacionais da fila comercial."
    >
      <AgendaClient />
    </AdminShell>
  );
}
