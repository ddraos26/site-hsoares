import { AdminShell } from '@/components/admin-shell';
import { FutureModule } from '@/components/admin/future-module';

export const metadata = {
  title: 'Apólices | Admin',
  robots: { index: false, follow: false }
};

export default function AdminApolicesPage() {
  return (
    <AdminShell
      section="policies"
      title="Apólices"
      description="Módulo futuro para consulta e operação de apólices emitidas, sempre usando o SegurosX como fonte oficial."
    >
      <FutureModule
        eyebrow="Integração futura"
        title="Carteira de apólices sincronizada"
        description="Essa área deve mostrar a carteira real de apólices emitidas pela H Soares, com vigência, seguradora, produto e vínculo com cliente e imobiliária."
        entities={[
          'Número da apólice',
          'Produto e seguradora',
          'Vigência e situação',
          'Cliente e titular',
          'Documentos e comprovantes'
        ]}
        views={[
          'Busca por número de apólice',
          'Lista por produto e vigência',
          'Detalhe completo da apólice',
          'Download de documento',
          'Atalhos para renovação e sinistro'
        ]}
        requirements={[
          'API do SegurosX com apólices em tempo real',
          'Permissão por perfil de acesso',
          'Estrutura de documentos vinculados',
          'Padronização de seguradora, produto e status'
        ]}
      />
    </AdminShell>
  );
}
