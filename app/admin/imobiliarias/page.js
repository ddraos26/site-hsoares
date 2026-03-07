import { AdminShell } from '@/components/admin-shell';
import { FutureModule } from '@/components/admin/future-module';

export const metadata = {
  title: 'Imobiliárias | Admin',
  robots: { index: false, follow: false }
};

export default function AdminImobiliariasPage() {
  return (
    <AdminShell
      section="brokers"
      title="Imobiliárias"
      description="Módulo futuro para gestão da carteira de imobiliárias parceiras, puxado do SegurosX e da plataforma operacional."
    >
      <FutureModule
        eyebrow="Integração futura"
        title="Carteira de imobiliárias parceiras"
        description="Essa área deve consolidar produção, leads, análises e histórico das imobiliárias parceiras da H Soares. O dado mestre deve vir do SegurosX e da plataforma operacional própria."
        entities={[
          'Cadastro da imobiliária',
          'Usuários vinculados',
          'Leads e análises de fiança',
          'Produção por período',
          'Histórico de locações e contratos'
        ]}
        views={[
          'Lista de imobiliárias com ranking',
          'Ficha da imobiliária',
          'Produção por seguradora',
          'Análises em andamento',
          'Comercial e relacionamento'
        ]}
        requirements={[
          'Integração SegurosX + plataforma H Soares',
          'Chave única da imobiliária entre sistemas',
          'Permissões por usuário da imobiliária',
          'Métricas de produção sincronizadas'
        ]}
      />
    </AdminShell>
  );
}
