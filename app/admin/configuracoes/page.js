import { AdminShell } from '@/components/admin-shell';

const publicEmail = 'contato@hsoaresseguros.com.br';
const internalLeadAlert = 'rodolfohsoaresseguros@gmail.com';
const publicWhatsapp = '(11) 9 7206-4288';

export const metadata = {
  title: 'Configurações | Admin',
  robots: { index: false, follow: false }
};

export default function AdminConfiguracoesPage() {
  return (
    <AdminShell
      section="settings"
      title="Configurações"
      description="Referências operacionais do site, e-mail transacional atual e próximos passos de infraestrutura."
    >
      <div className="admin-stack">
        <div className="admin-panel-grid">
          <section className="admin-card">
            <div className="admin-card-head">
              <h2>Contato público</h2>
              <span>Frente comercial</span>
            </div>
            <div className="admin-detail-list">
              <div className="admin-detail-row"><span>E-mail público</span><b>{publicEmail}</b></div>
              <div className="admin-detail-row"><span>WhatsApp principal</span><b>{publicWhatsapp}</b></div>
              <div className="admin-detail-row"><span>CNPJ</span><b>11.194.245.0001-13</b></div>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-head">
              <h2>Leads do site</h2>
              <span>Envio transacional</span>
            </div>
            <div className="admin-detail-list">
              <div className="admin-detail-row"><span>Destino atual</span><b>{internalLeadAlert}</b></div>
              <div className="admin-detail-row"><span>Reply-to público</span><b>{publicEmail}</b></div>
              <div className="admin-detail-row"><span>Remetente atual</span><b>onboarding@resend.dev</b></div>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-head">
              <h2>Infraestrutura</h2>
              <span>Estado atual</span>
            </div>
            <div className="admin-detail-list">
              <div className="admin-detail-row"><span>Site</span><b>Vercel</b></div>
              <div className="admin-detail-row"><span>Banco</span><b>Neon Postgres</b></div>
              <div className="admin-detail-row"><span>DNS atual</span><b>Wix</b></div>
            </div>
          </section>
        </div>

        <section className="admin-card admin-future-hero">
          <p className="eyebrow">Próxima etapa técnica</p>
          <h3>Migração controlada de DNS + Resend</h3>
          <p>
            Quando o DNS sair da Wix para o Registro.br, o projeto pode validar o domínio no Resend e trocar o remetente
            para <b>noreply@hsoaresseguros.com.br</b>, mantendo o e-mail corporativo da Porto/SkyMail intacto.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
