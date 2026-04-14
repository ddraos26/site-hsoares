import { AdminShell } from '@/components/admin-shell';
import { DetailExecutionPanel } from '@/components/admin/detail-execution-panel';
import { decodePageDetailId } from '@/lib/admin/detail-route';
import { getAdminPageDetailSnapshot } from '@/lib/admin/entity-detail-overview';
import { formatPageLabel } from '@/lib/admin/page-presentation';

export const metadata = {
  title: 'Detalhe da página | Dashboard',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

function formatDateTime(value) {
  if (!value) return 'Sem registro';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getAuditSourceCopy(source) {
  if (source?.status === 'live') {
    return {
      label: source.label || 'IA ativa',
      detail: 'Leitura comercial pronta para orientar o proximo ajuste'
    };
  }

  return {
    label: source?.label || 'IA em nova leitura',
    detail: 'O painel continua analisando essa pagina e atualiza a recomendacao assim que fechar a leitura'
  };
}

export default async function DashboardPageDetailPage({ params }) {
  const routeParams = await params;
  const pagePath = decodePageDetailId(routeParams?.id);
  const data = await getAdminPageDetailSnapshot(pagePath);

  if (!data) {
    return (
      <AdminShell
        basePath="/dashboard"
        section="pages"
        title="Página"
        description="Não encontramos leitura suficiente dessa página no recorte atual."
      >
        <p className="dashboard-card-empty">Essa página ainda não tem leitura suficiente para abrir o detalhe executivo.</p>
      </AdminShell>
    );
  }

  const pageLabel = formatPageLabel(data.page.pagePath);
  const aiAudit = data.aiAudit || null;
  const sourceMeta = getAuditSourceCopy(aiAudit?.source);

  return (
    <AdminShell
      basePath="/dashboard"
      section="pages"
      title={pageLabel}
      description="Estamos olhando somente para esta pagina, para entender como ela esta hoje e o que fazer nela agora."
    >
      <div className="cockpit-shell">
        <section className="ops-hero ops-hero--pages">
          <div className="ops-hero-main">
            <p className="eyebrow">Onde voce esta</p>
            <h3>{pageLabel}</h3>
            <p>
              Voce esta olhando a <b>{pageLabel}</b>. URL monitorada: <b>{data.page.pagePath}</b>. Aqui o foco e entender como ela esta hoje, se ela traz lead e qual o proximo passo certo.
            </p>
          </div>

          <aside className="ops-focus-card">
            <span>Resumo da pagina</span>
            <strong>{data.page.decision.headline}</strong>
            <p>{data.page.decision.diagnosis.summary}</p>
            <div className="ops-focus-meta">
              <div>
                <small>Visitas</small>
                <b>{data.page.views}</b>
              </div>
              <div>
                <small>Leads</small>
                <b>{data.page.leads}</b>
              </div>
              <div>
                <small>Lead rate</small>
                <b>{formatPercent(data.page.leadRate || 0)}</b>
              </div>
            </div>
          </aside>
        </section>

        <section className="ops-metric-grid ops-metric-grid--entity">
          <article className="ops-metric-card ops-metric-card--blue ops-metric-card--stat">
            <span>Visitas</span>
            <strong>{data.page.views}</strong>
            <small>Pessoas que entraram nesta pagina no recorte atual.</small>
          </article>
          <article className="ops-metric-card ops-metric-card--success ops-metric-card--stat">
            <span>Leads</span>
            <strong>{data.page.leads}</strong>
            <small>Quantos leads essa pagina gerou nesse recorte.</small>
          </article>
          <article className="ops-metric-card ops-metric-card--warning ops-metric-card--stat">
            <span>Conversao</span>
            <strong>{formatPercent(data.page.leadRate || 0)}</strong>
            <small>Taxa atual de lead desta pagina.</small>
          </article>
          <article className="ops-metric-card ops-metric-card--premium ops-metric-card--summary">
            <span>O que fazer agora</span>
            <strong>{aiAudit?.summary || data.page.decision.recommendation.summary}</strong>
            <small>Acao principal recomendada para esta pagina agora.</small>
          </article>
        </section>

        <section className="ops-panel ops-panel--ai-summary">
          <div className="ops-panel-head">
            <div>
              <span>Leitura da IA</span>
              <h3>O que falta nesta pagina para vender mais</h3>
            </div>
          </div>
          <p className="ops-panel-lead">{aiAudit?.summary || data.page.decision.recommendation.summary}</p>
          <div className="ops-inline-grid">
            <div className="ops-inline-card ops-inline-card--goal">
              <span>Objetivo comercial</span>
              <div className="ops-inline-row">
                <strong>{aiAudit?.salesGoal || 'Gerar mais clique, lead e oportunidade comercial.'}</strong>
                <small>o resultado que vale perseguir nesta pagina agora</small>
              </div>
            </div>
            <div className="ops-inline-card ops-inline-card--source">
              <span>Leitura de hoje</span>
              <div className="ops-inline-row">
                <strong>{sourceMeta.label}</strong>
                <small>{sourceMeta.detail}</small>
              </div>
            </div>
            <div className="ops-inline-card ops-inline-card--impact">
              <span>Ganho esperado</span>
              <div className="ops-inline-row">
                <strong>{aiAudit?.expectedResult || data.page.decision.recommendation.impact || 'Mais clareza para decidir o que mexer primeiro.'}</strong>
                <small>o que tende a melhorar depois dos ajustes</small>
              </div>
            </div>
            <div className="ops-inline-card ops-inline-card--signal">
              <span>Forca do sinal</span>
              <div className="ops-inline-row">
                <strong>{aiAudit?.confidence || 'media'}</strong>
                <small>nivel atual de clareza para mexer com seguranca</small>
              </div>
            </div>
          </div>
        </section>

        <section className="ops-grid">
          <article className="ops-panel ops-panel--outside">
            <div className="ops-panel-head">
              <div>
                <span>Fora da pagina</span>
                <h3>Front-end que o cliente enxerga</h3>
              </div>
            </div>
            <p className="ops-panel-lead">{aiAudit?.outsidePage?.diagnosis || 'A camada visivel ainda nao esta ajudando o visitante a confiar e agir com clareza.'}</p>
            <div className="ops-inline-grid">
              <div className="ops-inline-card ops-inline-card--problem">
                <span>O que esta faltando</span>
                <div className="ops-inline-row">
                  <strong>{aiAudit?.outsidePage?.missing || 'Mais clareza de promessa, prova de valor, CTA e contato visivel.'}</strong>
                  <small>o que trava clique, confianca e pedido de contato no front-end</small>
                </div>
              </div>
              <div className="ops-inline-card ops-inline-card--conversion">
                <span>Conversao</span>
                <div className="ops-inline-row">
                  <strong>{aiAudit?.conversion?.diagnosis || 'A pagina ainda precisa conduzir melhor para o clique e o contato.'}</strong>
                  <small>{aiAudit?.conversion?.action || 'Reforcar hero, CTA e prova para reduzir friccao.'}</small>
                </div>
              </div>
              <div className="ops-inline-card ops-inline-card--action">
                <span>Onde mexer primeiro</span>
                <div className="ops-inline-row">
                  <strong>{aiAudit?.outsidePage?.action || 'Reorganizar hero, prova, CTA e contato visivel.'}</strong>
                  <small>primeiro ajuste visual para fazer a pagina vender melhor</small>
                </div>
              </div>
            </div>
          </article>

          <article className="ops-panel ops-panel--soft ops-panel--inside">
            <div className="ops-panel-head">
              <div>
                <span>Dentro da pagina</span>
                <h3>Back-end, SEO e captura</h3>
              </div>
            </div>
            <p className="ops-panel-lead">{aiAudit?.insidePage?.diagnosis || 'A base interna ainda pode sustentar melhor acesso, indexacao e captura.'}</p>
            <div className="ops-inline-grid">
              <div className="ops-inline-card ops-inline-card--problem">
                <span>O que esta faltando</span>
                <div className="ops-inline-row">
                  <strong>{aiAudit?.insidePage?.missing || 'Mais base de SEO, tracking e captura confiavel.'}</strong>
                  <small>o que trava descoberta, indexacao e captura com consistencia</small>
                </div>
              </div>
              <div className="ops-inline-card ops-inline-card--acquisition">
                <span>Mais acesso</span>
                <div className="ops-inline-row">
                  <strong>{aiAudit?.acquisition?.diagnosis || 'SEO e distribuicao ainda podem trazer mais gente certa.'}</strong>
                  <small>{aiAudit?.acquisition?.action || 'Melhorar base tecnica e discoverability da pagina.'}</small>
                </div>
              </div>
              <div className="ops-inline-card ops-inline-card--action">
                <span>Onde mexer primeiro</span>
                <div className="ops-inline-row">
                  <strong>{aiAudit?.insidePage?.action || 'Ajustar title, meta, tracking e captura da pagina.'}</strong>
                  <small>primeiro ajuste interno para destravar trafego e lead</small>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="ops-grid">
          <article className="ops-panel">
            <div className="ops-panel-head">
              <div>
                <span>Diagnóstico</span>
                <h3>O que está acontecendo nesta página</h3>
              </div>
            </div>
            <p>{data.page.decision.diagnosis.summary}</p>
            <ul className="command-layer-list">
              {data.page.decision.diagnosis.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </article>

          <article className="ops-panel ops-panel--soft">
            <div className="ops-panel-head">
              <div>
                <span>O que foi encontrado</span>
                <h3>O que a IA encontrou nesta pagina</h3>
              </div>
            </div>
            <div className="task-history-list">
              <div className="task-history-row">
                <div>
                  <strong>Title</strong>
                  <small>{aiAudit?.observed?.title || 'Sem title detectado'}</small>
                </div>
                <small>SEO</small>
              </div>
              <div className="task-history-row">
                <div>
                  <strong>H1</strong>
                  <small>{aiAudit?.observed?.h1 || 'Sem H1 detectado'}</small>
                </div>
                <small>Hero</small>
              </div>
              <div className="task-history-row">
                <div>
                  <strong>Meta description</strong>
                  <small>{aiAudit?.observed?.metaDescription || 'Sem meta description detectada'}</small>
                </div>
                <small>Snippet</small>
              </div>
              <div className="task-history-row">
                <div>
                  <strong>Contato e destino</strong>
                  <small>{aiAudit?.observed?.contactSignalSummary || 'Sem leitura clara dos pontos de contato.'}</small>
                </div>
                <small>Contato</small>
              </div>
              <div className="task-history-row">
                <div>
                  <strong>Sinais de CTA</strong>
                  <small>{aiAudit?.observed?.ctaSignalSummary || 'Sem leitura estrutural adicional.'}</small>
                </div>
                <small>HTML</small>
              </div>
              <div className="task-history-row">
                <div>
                  <strong>Search Console</strong>
                  <small>{aiAudit?.observed?.searchConsole || 'Sem leitura forte do Search Console.'}</small>
                </div>
                <small>Fora</small>
              </div>
              <div className="task-history-row">
                <div>
                  <strong>Sinais comportamentais</strong>
                  <small>
                    CTA principal {data.behavioralSignals.primaryClicks} · CTA secundário {data.behavioralSignals.secondaryClicks} · WhatsApp {data.behavioralSignals.whatsappClicks} · Scroll {data.behavioralSignals.scrollRelevant}
                  </small>
                </div>
                <small>Uso</small>
              </div>
            </div>
          </article>
        </section>

        <section>
          <DetailExecutionPanel
            entityType="pagina"
            entityLabel={data.page.pagePath}
            title={data.page.decision.automation.title}
            description={data.page.decision.automation.summary}
            nextStep={data.page.decision.automation.nextStep}
            task={data.execution.mainTask}
            operation={data.execution.latestOperation}
          />
        </section>

        <section className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Origens</span>
              <h3>Como o tráfego chega nessa página</h3>
            </div>
          </div>
          {data.trafficSources.length ? (
            <div className="task-history-list">
              {data.trafficSources.map((item) => (
                <div key={item.label} className="task-history-row">
                  <div>
                    <strong>{item.label}</strong>
                    <small>Fonte de aquisição recente</small>
                  </div>
                  <small>{item.sessions} sessões</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Sem origem identificada suficiente para essa página.</p>
          )}
        </section>

        <section className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Checklist de crescimento</span>
              <h3>Checklist fixo desta pagina para crescer venda</h3>
            </div>
          </div>
          <ul className="command-layer-list">
            {(aiAudit?.nextActions || [data.page.decision.recommendation.summary]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Leads recentes</span>
              <h3>Base comercial usada para sustentar a leitura</h3>
            </div>
          </div>
          {data.recentLeads.length ? (
            <div className="task-history-list">
              {data.recentLeads.map((item) => (
                <a key={item.id} className="task-history-row admin-actionable-card" href={`/admin/leads?lead=${encodeURIComponent(item.id)}`}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.status} · {item.owner} · {item.productSlug}</small>
                  </div>
                  <small>{formatDateTime(item.createdAt)}</small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Ainda não há leads recentes ligados diretamente a essa página.</p>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
