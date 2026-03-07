import { AdminShell } from '@/components/admin-shell';
import { FutureModule } from '@/components/admin/future-module';

export const metadata = {
  title: 'Renovações | Admin',
  robots: { index: false, follow: false }
};

export default function AdminRenovacoesPage() {
  return (
    <AdminShell
      section="renewals"
      title="Renovações"
      description="Módulo futuro para vigiar vencimentos, renovações e oportunidades da carteira, puxado do SegurosX."
    >
      <FutureModule
        eyebrow="Integração futura"
        title="Pipeline de renovações"
        description="Essa área deve antecipar vencimentos de apólices e organizar a fila comercial de renovação por produto, cliente, imobiliária e seguradora."
        entities={[
          'Apólices a vencer',
          'Janela de renovação',
          'Status de abordagem',
          'Responsável comercial',
          'Propostas emitidas e fechamento'
        ]}
        views={[
          'Calendário de vencimentos',
          'Fila de renovação por prioridade',
          'Detalhe da renovação',
          'Comparativo de proposta',
          'Histórico de retenção/perda'
        ]}
        requirements={[
          'Vigências reais vindas do SegurosX',
          'Relacionamento com cliente e apólice',
          'Sinalização de vencimento configurável',
          'Regras comerciais por produto'
        ]}
      />
    </AdminShell>
  );
}
