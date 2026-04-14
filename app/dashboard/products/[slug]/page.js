import { AdminShell } from '@/components/admin-shell';
import { DetailExecutionPanel } from '@/components/admin/detail-execution-panel';
import { encodePageDetailId } from '@/lib/admin/detail-route';
import { getAdminProductDetailSnapshot } from '@/lib/admin/entity-detail-overview';
import { formatPageLabel } from '@/lib/admin/page-presentation';

export const metadata = {
  title: 'Detalhe do produto | Dashboard',
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
    detail: 'O painel continua analisando este produto e atualiza a recomendacao assim que fechar a leitura'
  };
}

export default async function DashboardProductDetailPage({ params }) {
  const routeParams = await params;
  const slug = routeParams?.slug;
  const data = await getAdminProductDetailSnapshot(slug);

  if (!data) {
    return (
      <AdminShell
        basePath="/dashboard"
        section="products"
        title={`Produto: ${slug}`}
        description="Não encontramos leitura suficiente desse produto no recorte atual."
      >
        <p className="dashboard-card-empty">Esse produto ainda não tem sinais suficientes para o detalhe executivo.</p>
      </AdminShell>
    );
  }

  const aiAudit = data.aiAudit || null;
  const sourceMeta = getAuditSourceCopy(aiAudit?.source);

  return (
    <AdminShell
      basePath="/dashboard"
      section="products"
      title={data.product.name}
      description="Estamos olhando somente para este produto, para entender como ele vende hoje e o que fazer nele agora."
    >
      <div className="cockpit-shell">
        <section className="ops-hero ops-hero--products">
          <div className="ops-hero-main">
            <p className="eyebrow">Onde voce esta</p>
            <h3>{data.product.name}</h3>
            <p>
              Voce esta dentro do produto <b>{data.product.name}</b>. Aqui a leitura e somente dele: como ele esta hoje, o que trava venda e qual o proximo passo mais forte.
            </p>
          </div>

          <aside className="ops-focus-card">
            <span>Resumo do produto</span>
            <strong>{data.product.decision.headline}</strong>
            <p>{data.product.decision.diagnosis.summary}</p>
            <div className="ops-focus-meta">
              <div>
                <small>Visitas</small>
                <b>{data.product.views}</b>
              </div>
              <div>
                <small>Leads</small>
                <b>{data.product.leads}</b>
              </div>
              <div>
                <small>Lead rate</small>
                <b>{formatPercent(data.product.leadRate || 0)}</b>
              </div>
            </div>
          </aside>
        </section>

        <section className="ops-metric-grid ops-metric-grid--entity">
          <article className="ops-metric-card ops-metric-card--blue ops-metric-card--stat">
            <span>Visitas</span>
            <strong>{data.product.views}</strong>
            <small>Pessoas que chegaram em paginas ligadas a este produto no recorte atual.</small>
          </article>
          <article className="ops-metric-card ops-metric-card--success ops-metric-card--stat">
            <span>Leads</span>
            <strong>{data.product.leads}</strong>
            <small>Quantos leads esse produto gerou nesse recorte.</small>
          </article>
          <article className="ops-metric-card ops-metric-card--warning ops-metric-card--stat">
            <span>Conversao</span>
            <strong>{formatPercent(data.product.leadRate || 0)}</strong>
            <small>Taxa atual de lead do produto.</small>
          </article>
          <article className="ops-metric-card ops-metric-card--premium ops-metric-card--summary">
            <span>O que fazer agora</span>
            <strong>{aiAudit?.summary || data.product.decision.recommendation.summary}</strong>
            <small>Acao principal recomendada para este produto agora.</small>
          </article>
        </section>

        <section className="ops-panel ops-panel--ai-summary">
          <div className="ops-panel-head">
            <div>
              <span>Leitura da IA</span>
              <h3>O que falta neste produto para vender mais</h3>
            </div>
          </div>
          <p className="ops-panel-lead">{aiAudit?.summary || data.product.decision.recommendation.summary}</p>
          <div className="ops-inline-grid">
            <div className="ops-inline-card ops-inline-card--goal">
              <span>Objetivo comercial</span>
              <div className="ops-inline-row">
                <strong>{aiAudit?.salesGoal || 'Ganhar mais acesso, clique e lead para este produto.'}</strong>
                <small>o resultado que vale perseguir neste produto agora</small>
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
                <strong>{aiAudit?.expectedResult || data.product.decision.recommendation.impact || 'Mais clareza para decidir o que mexer primeiro.'}</strong>
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
            <p className="ops-panel-lead">{aiAudit?.outsidePage?.diagnosis || 'A camada visivel do produto ainda nao esta ajudando o visitante a confiar e agir com clareza.'}</p>
            <div className="ops-inline-grid">
              <div className="ops-inline-card ops-inline-card--problem">
                <span>O que esta faltando</span>
                <div className="ops-inline-row">
                  <strong>{aiAudit?.outsidePage?.missing || 'Mais clareza de promessa, prova de valor, CTA e contato visivel.'}</strong>
                  <small>o que trava clique, confianca e pedido de contato nas paginas visiveis</small>
                </div>
              </div>
              <div className="ops-inline-card ops-inline-card--conversion">
                <span>Conversao</span>
                <div className="ops-inline-row">
                  <strong>{aiAudit?.conversion?.diagnosis || 'O produto ainda precisa conduzir melhor para o clique e o contato.'}</strong>
                  <small>{aiAudit?.conversion?.action || 'Reforcar hero, CTA e prova para reduzir friccao.'}</small>
                </div>
              </div>
              <div className="ops-inline-card ops-inline-card--action">
                <span>Onde mexer primeiro</span>
                <div className="ops-inline-row">
                  <strong>{aiAudit?.outsidePage?.action || 'Reorganizar hero, prova, CTA e contato visivel nas paginas do produto.'}</strong>
                  <small>primeiro ajuste visual para fazer o produto vender melhor</small>
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
            <p className="ops-panel-lead">{aiAudit?.insidePage?.diagnosis || 'A base interna do produto ainda pode sustentar melhor acesso, indexacao e captura.'}</p>
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
                  <strong>{aiAudit?.acquisition?.diagnosis || 'SEO e distribuicao ainda podem trazer mais gente certa para este produto.'}</strong>
                  <small>{aiAudit?.acquisition?.action || 'Melhorar base tecnica e discoverability do produto.'}</small>
                </div>
              </div>
              <div className="ops-inline-card ops-inline-card--action">
                <span>Onde mexer primeiro</span>
                <div className="ops-inline-row">
                  <strong>{aiAudit?.insidePage?.action || 'Ajustar title, meta, tracking e captura do produto.'}</strong>
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
                <h3>O que está acontecendo neste produto</h3>
              </div>
            </div>
            <p>{data.product.decision.diagnosis.summary}</p>
            <ul className="command-layer-list">
              {data.product.decision.diagnosis.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </article>

          <article className="ops-panel ops-panel--soft">
            <div className="ops-panel-head">
              <div>
                <span>O que foi encontrado</span>
                <h3>O que a IA encontrou na pagina principal</h3>
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
                <small>SEO</small>
              </div>
              <div className="task-history-row">
                <div>
                  <strong>Sinais do produto</strong>
                  <small>
                    Cliques {data.product.clicks} · Leads {data.product.leads} · Lead rate {formatPercent(data.product.leadRate || 0)}
                  </small>
                </div>
                <small>Uso</small>
              </div>
            </div>
          </article>
        </section>

        <section>
          <DetailExecutionPanel
            entityType="produto"
            entityLabel={data.product.name}
            title={data.product.decision.automation.title}
            description={data.product.decision.automation.summary}
            nextStep={data.product.decision.automation.nextStep}
            task={data.execution.mainTask}
            operation={data.execution.latestOperation}
          />
        </section>

        <section className="ops-grid">
          <article className="ops-panel">
            <div className="ops-panel-head">
              <div>
                <span>Páginas ligadas</span>
                <h3>Onde esse produto realmente converte</h3>
              </div>
            </div>
            {data.relatedPages.length ? (
              <div className="task-history-list">
                {data.relatedPages.map((item) => (
                  <a
                    key={item.pagePath}
                    className="task-history-row admin-actionable-card"
                    href={`/dashboard/pages/${encodePageDetailId(item.pagePath)}`}
                  >
                    <div>
                      <strong>{formatPageLabel(item.pagePath)}</strong>
                      <small>{item.pagePath} · {item.views} views · {item.clicks} cliques · {item.leads} leads</small>
                    </div>
                    <small>{item.leadRate.toFixed(1)}%</small>
                  </a>
                ))}
              </div>
            ) : (
              <p className="dashboard-card-empty">Ainda não há páginas ligadas com leitura suficiente.</p>
            )}
          </article>

          <article className="ops-panel ops-panel--soft">
            <div className="ops-panel-head">
              <div>
                <span>Campanhas ligadas</span>
                <h3>UTMs e campanhas que puxaram esse produto</h3>
              </div>
            </div>
            {data.relatedCampaigns.length ? (
              <div className="task-history-list">
                {data.relatedCampaigns.map((item) => (
                  <div key={`${item.label}-${item.lastSeenAt}`} className="task-history-row">
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.leads} leads · {item.wins} ganhos</small>
                    </div>
                    <small>{formatDateTime(item.lastSeenAt)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dashboard-card-empty">Nenhuma campanha relevante apareceu ligada a esse produto ainda.</p>
            )}
          </article>
        </section>

        <section className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Checklist de crescimento</span>
              <h3>Checklist fixo deste produto para crescer venda</h3>
            </div>
          </div>
          <ul className="command-layer-list">
            {(aiAudit?.nextActions || [data.product.decision.recommendation.summary]).map((item) => (
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
                    <small>{item.status} · {item.owner} · {item.pagePath}</small>
                  </div>
                  <small>{formatDateTime(item.createdAt)}</small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Ainda não há leads recentes ligados diretamente a esse produto.</p>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
