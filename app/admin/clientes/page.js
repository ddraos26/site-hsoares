import { AdminShell } from '@/components/admin-shell';
import { FutureModule } from '@/components/admin/future-module';

export const metadata = {
  title: 'Clientes | Admin',
  robots: { index: false, follow: false }
};

export default function AdminClientesPage() {
  return (
    <AdminShell
      section="clients"
      title="Clientes"
      description="Módulo futuro alimentado pelo SegurosX para relacionamento e carteira do cliente final."
    >
      <FutureModule
        eyebrow="Integração futura"
        title="Base de clientes integrada ao SegurosX"
        description="Essa área deve centralizar clientes da H Soares com visão de apólices, histórico, documentos e oportunidades de renovação. O site não será a fonte principal desses dados; o SegurosX será o sistema mestre."
        entities={[
          'Cliente e dependentes',
          'Dados cadastrais consolidados',
          'Histórico de apólices e propostas',
          'Documentos e anexos do cliente',
          'Situação comercial e próximos contatos'
        ]}
        views={[
          'Lista de clientes com busca e filtros',
          'Ficha completa do cliente',
          'Apólices vinculadas',
          'Pendências cadastrais',
          'Histórico de atendimento e renovações'
        ]}
        requirements={[
          'API segura do SegurosX para leitura de clientes',
          'Relacionamento cliente x apólices x propostas',
          'Permissão por perfil interno',
          'Webhook ou sincronização para atualização contínua'
        ]}
      />
    </AdminShell>
  );
}
