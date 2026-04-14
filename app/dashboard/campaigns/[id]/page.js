import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { getAdminCampaignsSnapshot } from '@/lib/admin/campaigns-overview';

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDate(value) {
  if (!value) return 'Sem snapshot';
  const parsed = String(value).includes('T') ? new Date(value) : new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Sem snapshot';
  return parsed.toLocaleDateString('pt-BR');
}

export const metadata = {
  title: 'Detalhe da campanha | Dashboard',
  robots: { index: false, follow: false }
};

export default async function DashboardCampaignDetailPage({ params }) {
  const snapshot = await getAdminCampaignsSnapshot();
  const campaign = snapshot.items.find((item) => String(item.id) === String(params.id));

  if (!campaign) {
    notFound();
  }

  return (
    <AdminShell
      basePath="/dashboard"
      section="campaigns"
      title={campaign.name}
      description="Detalhe tático da campanha com leitura de verba, clique, conversão e sinais do site."
    >
      <div className="campaign-command-shell">
        <section className="ops-hero ops-hero--campaigns">
          <div className="ops-hero-main">
            <p className="eyebrow">Detalhe da campanha</p>
            <h3>{campaign.motion}</h3>
            <p>{campaign.narrative}</p>

            <div className="ops-chip-row">
              <span className="ops-chip ops-chip--premium">ID externo: {campaign.externalId || 'Sem ID externo'}</span>
              <span className="ops-chip ops-chip--success">Produto: {campaign.productName || 'Google Ads'}</span>
              <span className="ops-chip ops-chip--warning">Status: {campaign.statusLabel}</span>
            </div>
          </div>

          <aside className="ops-focus-card">
            <span>Recomendação executiva</span>
            <strong>{campaign.recommendation}</strong>
            <p>O score atual ajuda a decidir se essa campanha merece escala, revisão ou monitoramento mais conservador.</p>
            <div className="ops-focus-meta">
              <div>
                <small>Score</small>
                <b>{campaign.score}</b>
              </div>
              <div>
                <small>CTR</small>
                <b>{formatPercent(campaign.ctr)}</b>
              </div>
              <div>
                <small>CPA</small>
                <b>{campaign.conversions > 0 ? formatCurrency(campaign.cpa) : 'sem CPA'}</b>
              </div>
            </div>
          </aside>
        </section>

        <section className="ops-metric-grid">
          <article className="ops-metric-card ops-metric-card--warning">
            <span>Investimento</span>
            <strong>{formatCurrency(campaign.cost)}</strong>
            <small>Custo total acumulado no recorte.</small>
          </article>
          <article className="ops-metric-card ops-metric-card--blue">
            <span>Impressões</span>
            <strong>{formatNumber(campaign.impressions)}</strong>
            <small>Entrega observada na campanha.</small>
          </article>
          <article className="ops-metric-card ops-metric-card--premium">
            <span>Cliques / CTR</span>
            <strong>{formatNumber(campaign.clicks)} · {formatPercent(campaign.ctr)}</strong>
            <small>Interesse gerado pelo anúncio.</small>
          </article>
          <article className="ops-metric-card ops-metric-card--danger">
            <span>Conversões</span>
            <strong>{formatNumber(campaign.conversions)}</strong>
            <small>CPA: {campaign.conversions > 0 ? formatCurrency(campaign.cpa) : 'sem conversão'}</small>
          </article>
        </section>

        <section className="ops-grid">
          <article className="ops-panel">
            <div className="ops-panel-head">
              <div>
                <span>Leitura financeira</span>
                <h3>Custos e eficiência</h3>
              </div>
            </div>

            <div className="ops-inline-grid">
              <article className="ops-inline-card">
                <span>CPC médio</span>
                <div className="ops-inline-row">
                  <strong>{formatCurrency(campaign.cpc)}</strong>
                  <small>custo por clique</small>
                </div>
              </article>
              <article className="ops-inline-card">
                <span>CPA</span>
                <div className="ops-inline-row">
                  <strong>{campaign.conversions > 0 ? formatCurrency(campaign.cpa) : 'sem CPA'}</strong>
                  <small>custo por conversão</small>
                </div>
              </article>
              <article className="ops-inline-card">
                <span>Último snapshot</span>
                <div className="ops-inline-row">
                  <strong>{formatDate(campaign.lastSnapshotDate)}</strong>
                  <small>captura mais recente</small>
                </div>
              </article>
            </div>
          </article>

          <article className="ops-panel ops-panel--soft">
            <div className="ops-panel-head">
              <div>
                <span>Rastro no site</span>
                <h3>O que o site já capturou</h3>
              </div>
            </div>

            <div className="ops-inline-grid">
              <article className="ops-inline-card">
                <span>Tracking</span>
                <div className="ops-inline-row">
                  <strong>{campaign.trackingLabel || 'Sem match claro'}</strong>
                  <small>fonte / meio / campanha</small>
                </div>
              </article>
              <article className="ops-inline-card">
                <span>Site</span>
                <div className="ops-inline-row">
                  <strong>{formatNumber(campaign.trackingViews)}</strong>
                  <small>visitas ligadas</small>
                </div>
                <div className="ops-inline-row">
                  <strong>{formatNumber(campaign.trackingLeads)}</strong>
                  <small>leads ligados</small>
                </div>
              </article>
            </div>
          </article>
        </section>
      </div>
    </AdminShell>
  );
}
