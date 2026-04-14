'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DailyChecklistPanel, DailyChecklistSummary } from '@/components/admin/daily-checklist-panel';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';
import { formatPageLabel } from '@/lib/admin/page-presentation';

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value || 0));
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
const formatCurrency = (value) =>
  value == null
    ? 'Conectar mídia'
    : new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 2
      }).format(Number(value || 0));

function openAdminCard(router, href, basePath) {
  if (!href) return;
  router.push(resolveDashboardHref(href, basePath));
}

function getInteractiveCardProps(router, href, basePath) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: () => openAdminCard(router, href, basePath),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openAdminCard(router, href, basePath);
      }
    }
  };
}

function DeltaBadge({ delta }) {
  if (!delta || delta.percent == null) {
    return <span className="exec-delta exec-delta--flat">sem base</span>;
  }

  const tone = delta.diff > 0 ? 'up' : delta.diff < 0 ? 'down' : 'flat';
  const signal = delta.diff > 0 ? '+' : '';
  return <span className={`exec-delta exec-delta--${tone}`}>{signal}{delta.percent}%</span>;
}

function KpiCard({ label, value, helper, delta, tone = 'blue', href, router, basePath }) {
  const interactiveProps = getInteractiveCardProps(router, href, basePath);

  return (
    <article className={`exec-kpi-card exec-kpi-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...interactiveProps}>
      <span>{label}</span>
      <strong>{value}</strong>
      <div className="exec-kpi-foot">
        <small>{helper}</small>
        <DeltaBadge delta={delta} />
      </div>
    </article>
  );
}

function ComparisonCard({ title, rows, href, router, basePath }) {
  const interactiveProps = getInteractiveCardProps(router, href, basePath);

  return (
    <article className={`exec-panel ${href ? 'admin-actionable-card' : ''}`} {...interactiveProps}>
      <div className="exec-panel-head">
        <div>
          <span>Comparativo</span>
          <h3>{title}</h3>
        </div>
      </div>

      <div className="exec-comparison-list">
        {rows.map((row) => (
          <div key={row.label}>
            <div>
              <strong>{row.label}</strong>
              <small>{row.value}</small>
            </div>
            <DeltaBadge delta={row.delta} />
          </div>
        ))}
      </div>
    </article>
  );
}

function LeaderCard({ label, item, type = 'best', href, router, basePath }) {
  const interactiveProps = getInteractiveCardProps(router, href, basePath);

  return (
    <article className={`exec-leader-card exec-leader-card--${type} ${href ? 'admin-actionable-card' : ''}`} {...interactiveProps}>
      <span>{label}</span>
      {item ? (
        <>
          <strong>{item.label || (item.pagePath ? formatPageLabel(item.pagePath) : item.slug)}</strong>
          <p>
            {formatNumber(item.leads || 0)} leads · {formatPercent(item.leadRate || 0)} lead rate
          </p>
        </>
      ) : (
        <>
          <strong>Sem massa crítica</strong>
          <p>Ainda não há dado suficiente nesse recorte.</p>
        </>
      )}
    </article>
  );
}

function PriorityAction({ item, href, router, basePath }) {
  const interactiveProps = getInteractiveCardProps(router, href, basePath);

  return (
    <div className={`exec-priority-item exec-priority-item--${item.tone} ${href ? 'admin-actionable-card' : ''}`} {...interactiveProps}>
      <span>{item.bucket}</span>
      <strong>{item.title}</strong>
      <p>{item.recommendation}</p>
    </div>
  );
}

function RefreshPriorityItem({ item, router, basePath }) {
  const interactiveProps = getInteractiveCardProps(router, item.href, basePath);

  return (
    <div className={`exec-refresh-item exec-refresh-item--${item.statusTone || 'premium'} ${item.href ? 'admin-actionable-card' : ''}`} {...interactiveProps}>
      <div className="exec-refresh-head">
        <span>{item.entityType === 'product' ? 'Produto' : 'Página'}</span>
        <b>{item.priorityLabel}</b>
      </div>
      <strong>{item.title}</strong>
      <p>{item.reason}</p>
      <small>{item.signals}</small>
      <div className="exec-refresh-meta">
        <small>{item.statusLabel}</small>
        <small>{item.ageLabel} · nova leitura em {item.cadenceLabel}</small>
      </div>
    </div>
  );
}

function PageRankingItem({ item, router, basePath }) {
  const interactiveProps = getInteractiveCardProps(router, item.href, basePath);

  return (
    <div className={`exec-page-rank-item exec-page-rank-item--${item.tone || 'premium'} ${item.href ? 'admin-actionable-card' : ''}`} {...interactiveProps}>
      <div className="exec-page-rank-head">
        <span>{item.statusLabel}</span>
        <b>Score {item.priorityScore}</b>
      </div>
      <strong>{item.label}</strong>
      <p>{item.recommendation || item.headline || 'Essa página já está no radar principal do dashboard.'}</p>
      <div className="exec-page-rank-meta">
        <small>{item.views} visitas</small>
        <small>{item.leads} leads</small>
        <small>{formatPercent(item.leadRate)} conversão · {item.priorityLabel}</small>
      </div>
    </div>
  );
}

function PageBucketCard({ eyebrow, title, description, items, emptyText, router, basePath, tone = 'premium' }) {
  return (
    <article className={`exec-page-bucket exec-page-bucket--${tone}`}>
      <div className="exec-page-bucket-head">
        <div>
          <span>{eyebrow}</span>
          <h4>{title}</h4>
        </div>
        <small>{description}</small>
      </div>
      <div className="exec-page-rank-list">
        {items?.length ? items.map((item) => (
          <PageRankingItem key={item.pagePath} item={item} router={router} basePath={basePath} />
        )) : <p className="dashboard-card-empty">{emptyText}</p>}
      </div>
    </article>
  );
}

export default function DashboardClient({ apiBase = '/api/admin', initialData = null, basePath = '/admin' }) {
  const router = useRouter();
  const endpoint = `${apiBase}/executive-dashboard`;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      primeAdminJsonCache(endpoint, initialData);
      setData(initialData);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminJson(endpoint);

        if (response?.error) {
          throw new Error(response.detail || response.error);
        }

        setData(response);
      } catch (err) {
        setError(err.message || 'Falha ao carregar o dashboard executivo.');
      } finally {
        setLoading(false);
      }
    };

    void load();
    return undefined;
  }, [endpoint, initialData]);

  if (loading) {
    return <p className="dashboard-card-empty">Montando o dashboard executivo...</p>;
  }

  if (error) {
    return <p className="dashboard-error">{error}</p>;
  }

  if (!data) {
    return <p className="dashboard-card-empty">Ainda não há dados suficientes para o dashboard executivo.</p>;
  }

  const executionCenter = data.executionCenter || {};
  const operations = data.operations || { summary: {}, focus: {}, items: [] };
  const nextOperation = operations.focus?.nextOperation || null;
  const aiRuntime = data.aiRuntime || {};
  const autonomy = aiRuntime.autonomy || null;
  const nextCentralAction = data.centralPriorities?.actions?.[0] || null;
  const secondaryActions = data.centralPriorities?.actions?.slice(1, 3) || [];
  const businessFlow = data.businessFlow || {};
  const auditPriorities = data.auditPriorities || { items: [] };
  const pageRanking = data.pageRanking || { items: [] };
  const firstAuditPriority = businessFlow.firstAuditPriority || auditPriorities.items?.[0] || null;
  const checklistSummary = data.dailyChecklist?.summary || {};
  const topSeoOpportunity =
    data.opportunities?.find((item) => item?.query) ||
    (data.centralPriorities?.bestOpportunity?.query ? data.centralPriorities.bestOpportunity : null);
  const topAlert = data.alerts?.[0] || null;
  const heroSignals = [
    {
      label: 'Rotina de hoje',
      tone: 'success',
      value: checklistSummary.total ? `${checklistSummary.completed || 0}/${checklistSummary.total}` : 'Sem rotina fechada',
      detail:
        checklistSummary.pending != null
          ? `${checklistSummary.pending} pendencias para fechar o dia`
          : 'A rotina ainda esta sendo organizada'
    },
    {
      label: 'Prioridade de venda',
      tone: 'warning',
      value: nextCentralAction?.priority || data.centralPriorities.productToPrioritize?.priority || 'Media',
      detail:
        nextCentralAction?.bucket
          ? `${nextCentralAction.bucket} puxando o dia`
          : 'A frente com mais impacto subiu para o topo'
    },
    {
      label: 'Depois do principal',
      tone: 'premium',
      value: firstAuditPriority?.title || 'Sem urgencia agora',
      detail:
        firstAuditPriority?.cadenceLabel
          ? `A IA volta em ${firstAuditPriority.cadenceLabel}`
          : 'O restante segue estavel por enquanto'
    }
  ];
  const guidanceSteps = [
    {
      title: 'Principal',
      description: businessFlow.headline || data.commandCenter?.title || 'A IA já separou a frente principal do dia para você.'
    },
    {
      title: 'Motivo',
      description: businessFlow.whyNow || nextCentralAction?.diagnosis || data.commandCenter?.recommendation || 'Entenda o que está segurando o crescimento antes de reagir.'
    },
    {
      title: 'Depois disso',
      description: firstAuditPriority ? `Se sobrar energia hoje, a próxima releitura da IA deve voltar para ${firstAuditPriority.title.toLowerCase()}.` : 'Depois do principal, siga para a próxima rota que ainda trava crescimento.'
    }
  ];

  return (
    <div className="exec-shell">
      <section className="exec-hero">
        <div className="exec-hero-main">
          <p className="eyebrow">Resumo comercial de hoje</p>
          <h3>{data.commandCenter.title}</h3>
          <p>{data.commandCenter.diagnosis}</p>

          <div className="exec-hero-signal-row">
            {heroSignals.map((signal) => (
              <article key={signal.label} className={`exec-hero-signal-card exec-hero-signal-card--${signal.tone || 'neutral'}`}>
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
                <small>{signal.detail}</small>
              </article>
            ))}
          </div>

          {nextCentralAction ? (
            <article
              className="exec-hero-primary admin-actionable-card"
              {...getInteractiveCardProps(router, nextCentralAction.href || '/admin/copiloto', basePath)}
            >
              <span>{businessFlow.actionLabel || 'Frente principal do dia'}</span>
              <strong>{businessFlow.headline || nextCentralAction.title}</strong>
              <p>{businessFlow.nextStep || nextCentralAction.recommendation || nextCentralAction.reason}</p>
              <small>{businessFlow.whyNow || data.commandCenter.recommendation || 'Comece aqui para destravar o que mais pesa em clique, lead ou venda hoje.'}</small>
            </article>
          ) : null}

          {secondaryActions.length ? (
            <div className="exec-priority-list exec-priority-list--hero-secondary">
              {secondaryActions.map((item) => (
                <PriorityAction
                  key={item.id}
                  item={item}
                  href={item.href || '/admin/copiloto'}
                  router={router}
                  basePath={basePath}
                />
              ))}
            </div>
          ) : null}
        </div>

        <aside className="exec-hero-side">
          <DailyChecklistSummary apiBase={apiBase} basePath={basePath} initialData={data.dailyChecklist || null} />

          <article className="exec-hero-status-card admin-actionable-card" {...getInteractiveCardProps(router, '/admin/insights', basePath)}>
            <span>Leitura comercial da IA</span>
            <strong>{autonomy?.label || 'IA acompanhando o negocio'}</strong>
            <p>{autonomy?.summary || aiRuntime.recommendation || 'A IA segue acompanhando o negocio para organizar o que merece sua atencao primeiro.'}</p>
            <div className="exec-hero-status-grid">
              <div>
                <small>Ritmo</small>
                <b>{aiRuntime.costModeLabel || 'Sem leitura'}</b>
              </div>
              <div>
                <small>Uso do mes</small>
                <b>{aiRuntime.budgetUsagePercent != null ? `${Number(aiRuntime.budgetUsagePercent || 0).toFixed(1)}%` : '—'}</b>
              </div>
              <div>
                <small>Proxima frente</small>
                <b>{firstAuditPriority?.title || 'Sem urgencia agora'}</b>
              </div>
              <div>
                <small>Volta prevista</small>
                <b>{firstAuditPriority?.cadenceLabel || 'Dentro da meta'}</b>
              </div>
            </div>
            <small className="exec-hero-status-note">
              {businessFlow.auditSummary || 'A IA escolhe onde voltar primeiro misturando impacto em venda com tempo desde a ultima leitura.'}
            </small>
          </article>
        </aside>
      </section>

      <section className="exec-page-ranking-shell">
        <article className="exec-panel exec-panel--page-ranking">
          <div className="exec-panel-head">
            <div>
              <span>Ranking das páginas</span>
              <h3>{pageRanking.headline || 'Quais páginas estão jogando melhor hoje'}</h3>
            </div>
          </div>

          {pageRanking.champion ? (
            <div className="exec-page-champion admin-actionable-card" {...getInteractiveCardProps(router, pageRanking.champion.href, basePath)}>
              <div className="exec-page-champion-copy">
                <b className="exec-page-champion-badge">Pagina campea do dia</b>
                <span>Página campeã do dia</span>
                <strong>{pageRanking.champion.label}</strong>
                <p>{pageRanking.champion.recommendation || pageRanking.champion.headline || 'Essa página está liderando o jogo hoje.'}</p>
              </div>
              <div className="exec-page-champion-stats">
                <div>
                  <small>Status</small>
                  <b>{pageRanking.champion.statusLabel}</b>
                </div>
                <div>
                  <small>Score</small>
                  <b>{pageRanking.champion.priorityScore}</b>
                </div>
                <div>
                  <small>Visitas</small>
                  <b>{formatNumber(pageRanking.champion.views)}</b>
                </div>
                <div>
                  <small>Leads</small>
                  <b>{formatNumber(pageRanking.champion.leads)}</b>
                </div>
                <div>
                  <small>Conversão</small>
                  <b>{formatPercent(pageRanking.champion.leadRate)}</b>
                </div>
                <div>
                  <small>Momento</small>
                  <b>{pageRanking.champion.priorityLabel}</b>
                </div>
              </div>
            </div>
          ) : (
            <p className="dashboard-card-empty">Ainda não há páginas suficientes para destacar uma campeã do dia.</p>
          )}

          <div className="exec-page-bucket-grid">
            <PageBucketCard
              eyebrow="Melhores páginas"
              title="Já estão dando resultado"
              description="As páginas que já estão respondendo melhor agora."
              items={pageRanking.bestPages || []}
              emptyText="Ainda não há páginas com resposta comercial forte no recorte atual."
              router={router}
              basePath={basePath}
              tone="success"
            />
            <PageBucketCard
              eyebrow="Tráfego sem lead"
              title="Precisam de ajuda"
              description="Recebem atenção, mas ainda estão deixando lead na mesa."
              items={pageRanking.trafficWithoutLead || []}
              emptyText="Nenhuma página importante está queimando tráfego sem lead agora."
              router={router}
              basePath={basePath}
              tone="danger"
            />
            <PageBucketCard
              eyebrow="Prontas para escalar"
              title="Valem mais distribuição"
              description="Convertem bem e podem receber mais força com controle."
              items={pageRanking.readyToScale || []}
              emptyText="Ainda não apareceu uma página claramente pronta para escala."
              router={router}
              basePath={basePath}
              tone="premium"
            />
          </div>
        </article>
      </section>

      <section className="exec-grid-2">
        <article
          className="exec-panel admin-actionable-card"
          {...getInteractiveCardProps(router, topSeoOpportunity?.href || '/dashboard/seo', basePath)}
        >
          <div className="exec-panel-head">
            <div>
              <span>SEO que pode virar venda</span>
              <h3>{topSeoOpportunity?.query ? `Atacar "${topSeoOpportunity.query}"` : topSeoOpportunity?.title || 'Sem brecha orgânica dominante agora'}</h3>
            </div>
          </div>
          <div className="exec-alert-list">
            <div className="exec-alert-card exec-alert-card--success">
              <strong>Por que apareceu</strong>
              <p>
                {topSeoOpportunity?.query
                  ? 'Essa query já mostra procura real e pode virar clique qualificado se a página responder melhor.'
                  : topSeoOpportunity?.description || 'Quando o Search Console mostrar uma brecha mais forte, ela sobe aqui.'}
              </p>
              <small>
                {topSeoOpportunity?.query
                  ? 'Search Console + IA comercial estão usando esse sinal para subir a melhor frente orgânica do momento.'
                  : 'Assim que aparecer uma brecha orgânica forte, ela entra aqui com contexto comercial.'}
              </small>
            </div>
            <div className="exec-alert-card">
              <strong>O que fazer</strong>
              <p>{topSeoOpportunity?.recommendation || 'Abrir o SEO e decidir a próxima melhoria de conteúdo, title, meta ou página de apoio.'}</p>
              <small>
                {topSeoOpportunity?.query
                  ? 'Abra o SEO para trabalhar essa query com mais chance de virar acesso e lead.'
                  : 'Esse espaço vira o atalho do SEO assim que a IA encontrar um alvo orgânico melhor.'}
              </small>
            </div>
          </div>
        </article>

        <article
          className="exec-panel admin-actionable-card"
          {...getInteractiveCardProps(router, topAlert?.href || '/dashboard/decision-center', basePath)}
        >
          <div className="exec-panel-head">
            <div>
              <span>Gargalo do momento</span>
              <h3>{topAlert?.title || 'Nenhum bloqueio forte agora'}</h3>
            </div>
          </div>
          <div className="exec-alert-list">
            <div className="exec-alert-card exec-alert-card--danger">
              <strong>O que está segurando venda</strong>
              <p>{topAlert?.description || 'Não apareceu um bloqueio dominante acima do restante no momento.'}</p>
              <small>{topAlert?.impact || 'Se surgir um gargalo comercial forte, ele sobe aqui.'}</small>
            </div>
            <div className="exec-alert-card">
              <strong>Leitura rápida</strong>
              <p>
                {topAlert
                  ? 'Esse é o principal ponto perdendo tração agora. Vale tratar antes das frentes secundárias.'
                  : 'O topo do funil e a conversão estão relativamente estáveis no recorte atual.'}
              </p>
              <small>{topAlert ? 'Abra esse contexto para corrigir a perda antes de distribuir mais energia.' : 'Nesse cenário, siga a ordem comercial normal do dashboard.'}</small>
            </div>
          </div>
        </article>
      </section>

      <section className="focus-guidance admin-actionable-card">
        <div className="focus-guidance-main">
          <h4>Como o dia se organiza</h4>
          <p>
            {businessFlow.whyNow || data.commandCenter.diagnosis || 'A IA está separando primeiro o que mexe mais em receita, depois o que precisa de nova leitura e por último o resto.'}
          </p>
          <div className="focus-guidance-meta">
            <div>
              <strong>{formatNumber(data.centralPriorities.actions.length || 0)}</strong>
              <span>Frentes abertas hoje</span>
            </div>
            <div>
              <strong>{nextCentralAction?.priority || data.centralPriorities.productToPrioritize?.priority || 'Média'}</strong>
              <span>Pressão comercial</span>
            </div>
            <div>
              <strong>{firstAuditPriority?.title || data.centralPriorities.productToPrioritize?.label || 'Sem destaque'} </strong>
              <span>Próxima releitura da IA</span>
            </div>
          </div>
        </div>
        <div className="focus-steps">
          {guidanceSteps.map((step) => (
            <article key={step.title} className="focus-step">
              <span>{step.title}</span>
              <strong>{step.description}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="exec-grid-2">
        <DailyChecklistPanel
          apiBase={apiBase}
          basePath={basePath}
          initialData={data.dailyChecklist || null}
          compact
          title="Checklist do dia"
          eyebrow="Rotina"
        />
      </section>

      <section className="exec-kpi-grid">
        <KpiCard
          label="Visitas hoje"
          value={formatNumber(data.kpis.visitsToday)}
          helper="Tráfego observado no site"
          delta={data.comparisons.todayVsYesterday.visits}
          tone="blue"
          chartItems={[
            { label: 'H', value: data.comparisons.todayVsYesterday.visits.current },
            { label: '7d', value: data.comparisons.last7VsPrevious7.visits.current },
            { label: '30d', value: data.comparisons.last30VsPrevious30.visits.current }
          ]}
          href="/dashboard/analytics"
          router={router}
          basePath={basePath}
        />
        <KpiCard
          label="Leads hoje"
          value={formatNumber(data.kpis.leadsToday)}
          helper="Captação comercial do dia"
          delta={data.comparisons.todayVsYesterday.leads}
          tone="green"
          chartItems={[
            { label: 'H', value: data.comparisons.todayVsYesterday.leads.current },
            { label: '7d', value: data.comparisons.last7VsPrevious7.leads.current },
            { label: '30d', value: data.comparisons.last30VsPrevious30.leads.current }
          ]}
          href="/admin/leads"
          router={router}
          basePath={basePath}
        />
        <KpiCard
          label="Cliques no WhatsApp"
          value={formatNumber(data.kpis.whatsappClicksToday)}
          helper="Sinal comercial direto"
          delta={data.comparisons.todayVsYesterday.whatsappClicks}
          tone="gold"
          chartItems={[
            { label: 'H', value: data.comparisons.todayVsYesterday.whatsappClicks.current },
            { label: '7d', value: data.comparisons.last7VsPrevious7.whatsappClicks.current },
            { label: '30d', value: data.comparisons.last30VsPrevious30.whatsappClicks.current }
          ]}
          href="/admin/leads"
          router={router}
          basePath={basePath}
        />
        <KpiCard
          label="Gasto em anúncios"
          value={formatCurrency(data.kpis.adSpendToday)}
          helper={data.kpis.adSpendToday == null ? 'Leitura diária entra quando Meta/Google Ads estiverem conectados' : 'Investimento pago observado hoje'}
          delta={null}
          tone="purple"
          chartItems={[
            { label: 'Hoje', value: data.kpis.adSpendToday || 0 },
            { label: 'Pago', value: data.kpis.paidTrafficToday || 0 },
            { label: 'Org', value: data.kpis.organicTrafficToday || 0 }
          ]}
          href="/dashboard/campaigns"
          router={router}
          basePath={basePath}
        />
        <KpiCard
          label="Tráfego orgânico"
          value={formatNumber(data.kpis.organicTrafficToday)}
          helper="Busca orgânica identificada"
          delta={null}
          tone="green"
          chartItems={[
            { label: 'Hoje', value: data.kpis.organicTrafficToday || 0 },
            { label: '7d', value: data.comparisons.last7VsPrevious7.visits.current },
            { label: '30d', value: data.comparisons.last30VsPrevious30.visits.current }
          ]}
          href="/dashboard/seo"
          router={router}
          basePath={basePath}
        />
        <KpiCard
          label="CPL hoje"
          value={data.kpis.costPerLeadToday == null ? 'Aguardando mídia' : formatCurrency(data.kpis.costPerLeadToday)}
          helper="Custo por lead do dia"
          delta={null}
          tone="blue"
          chartItems={[
            { label: 'Leads', value: data.kpis.leadsToday || 0 },
            { label: 'Pago', value: data.kpis.paidTrafficToday || 0 },
            { label: 'Org', value: data.kpis.organicTrafficToday || 0 }
          ]}
          href="/dashboard/campaigns"
          router={router}
          basePath={basePath}
        />
      </section>

      <section className="exec-grid-2">
        <article className="exec-panel">
          <div className="exec-panel-head">
            <div>
              <span>Fila de releitura da IA</span>
              <h3>{auditPriorities.headline || 'Onde a IA deve voltar primeiro'}</h3>
            </div>
          </div>
          <div className="exec-refresh-list">
            {auditPriorities.items?.length ? auditPriorities.items.slice(0, 4).map((item) => (
              <RefreshPriorityItem key={item.id} item={item} router={router} basePath={basePath} />
            )) : <p className="dashboard-card-empty">As leituras principais ainda estão dentro da janela segura.</p>}
          </div>
        </article>

        <article className="exec-panel admin-actionable-card" {...getInteractiveCardProps(router, '/dashboard/history', basePath)}>
          <div className="exec-panel-head">
            <div>
              <span>Rastro da IA</span>
              <h3>{executionCenter.headline || 'Sem registro recente'}</h3>
            </div>
          </div>
          <div className="exec-alert-list">
            <div className="exec-alert-card exec-alert-card--success">
              <strong>Registros concluídos</strong>
              <p>{formatNumber(executionCenter.successfulRuns || 0)} decisões e acompanhamentos já foram registrados.</p>
              <small>Inclui contexto aprovado, histórico salvo e próximo passo rastreado.</small>
            </div>
            <div className="exec-alert-card exec-alert-card--warning">
              <strong>Acompanhamentos abertos</strong>
              <p>{formatNumber(executionCenter.pendingReviews || 0)} revisões seguem vivas para medir impacto.</p>
              <small>O sistema volta para checar resultado, não só sugere e some.</small>
            </div>
            <div className="exec-alert-card exec-alert-card--danger">
              <strong>Pontos bloqueados</strong>
              <p>{formatNumber((executionCenter.pendingApprovals || 0) + (executionCenter.failedRuns || 0))} itens ainda travam fluxo.</p>
              <small>Somam decisões suas que ainda faltam e registros que pedem correção.</small>
            </div>
          </div>
        </article>
      </section>

      <section className="exec-panel exec-panel--secondary">
        <div className="exec-panel-head">
          <div>
            <span>Leitura analítica</span>
            <h3>Comparativos para aprofundar a decisão</h3>
          </div>
        </div>
        <div className="exec-comparison-grid">
        <ComparisonCard
          title="Hoje vs ontem"
          rows={[
            { label: 'Visitas', value: formatNumber(data.comparisons.todayVsYesterday.visits.current), delta: data.comparisons.todayVsYesterday.visits },
            { label: 'Leads', value: formatNumber(data.comparisons.todayVsYesterday.leads.current), delta: data.comparisons.todayVsYesterday.leads },
            { label: 'WhatsApp', value: formatNumber(data.comparisons.todayVsYesterday.whatsappClicks.current), delta: data.comparisons.todayVsYesterday.whatsappClicks },
            { label: 'Conversão', value: formatPercent(data.comparisons.todayVsYesterday.conversionRate.current), delta: data.comparisons.todayVsYesterday.conversionRate },
            { label: 'CTR', value: formatPercent(data.comparisons.todayVsYesterday.ctr.current), delta: data.comparisons.todayVsYesterday.ctr }
          ]}
          href="/dashboard/analytics"
          router={router}
          basePath={basePath}
        />
        <ComparisonCard
          title="Últimos 7 dias vs 7 anteriores"
          rows={[
            { label: 'Visitas', value: formatNumber(data.comparisons.last7VsPrevious7.visits.current), delta: data.comparisons.last7VsPrevious7.visits },
            { label: 'Leads', value: formatNumber(data.comparisons.last7VsPrevious7.leads.current), delta: data.comparisons.last7VsPrevious7.leads },
            { label: 'WhatsApp', value: formatNumber(data.comparisons.last7VsPrevious7.whatsappClicks.current), delta: data.comparisons.last7VsPrevious7.whatsappClicks },
            { label: 'Conversão', value: formatPercent(data.comparisons.last7VsPrevious7.conversionRate.current), delta: data.comparisons.last7VsPrevious7.conversionRate },
            { label: 'CTR', value: formatPercent(data.comparisons.last7VsPrevious7.ctr.current), delta: data.comparisons.last7VsPrevious7.ctr }
          ]}
          href="/dashboard/analytics"
          router={router}
          basePath={basePath}
        />
        <ComparisonCard
          title="Últimos 30 dias vs 30 anteriores"
          rows={[
            { label: 'Visitas', value: formatNumber(data.comparisons.last30VsPrevious30.visits.current), delta: data.comparisons.last30VsPrevious30.visits },
            { label: 'Leads', value: formatNumber(data.comparisons.last30VsPrevious30.leads.current), delta: data.comparisons.last30VsPrevious30.leads },
            { label: 'WhatsApp', value: formatNumber(data.comparisons.last30VsPrevious30.whatsappClicks.current), delta: data.comparisons.last30VsPrevious30.whatsappClicks },
            { label: 'Conversão', value: formatPercent(data.comparisons.last30VsPrevious30.conversionRate.current), delta: data.comparisons.last30VsPrevious30.conversionRate },
            { label: 'CTR', value: formatPercent(data.comparisons.last30VsPrevious30.ctr.current), delta: data.comparisons.last30VsPrevious30.ctr }
          ]}
          href="/dashboard/analytics"
          router={router}
          basePath={basePath}
        />
        </div>
      </section>

      <section className="exec-leader-grid">
        <LeaderCard
          label={`Melhor produto · ${data.leaderboards.windowLabel}`}
          item={data.leaderboards.bestProduct}
          type="best"
          href={data.leaderboards.bestProduct?.slug ? `/admin/leads?product=${encodeURIComponent(data.leaderboards.bestProduct.slug)}` : '/dashboard/products'}
          router={router}
          basePath={basePath}
        />
        <LeaderCard
          label={`Pior produto · ${data.leaderboards.windowLabel}`}
          item={data.leaderboards.worstProduct}
          type="worst"
          href={data.leaderboards.worstProduct?.slug ? `/admin/leads?product=${encodeURIComponent(data.leaderboards.worstProduct.slug)}` : '/dashboard/products'}
          router={router}
          basePath={basePath}
        />
        <LeaderCard label={`Melhor página · ${data.leaderboards.windowLabel}`} item={data.leaderboards.bestPage} type="best" href="/dashboard/pages" router={router} basePath={basePath} />
        <LeaderCard label={`Pior página · ${data.leaderboards.windowLabel}`} item={data.leaderboards.worstPage} type="worst" href="/dashboard/pages" router={router} basePath={basePath} />
        <LeaderCard label={`Melhor campanha · ${data.leaderboards.windowLabel}`} item={data.leaderboards.bestCampaign} type="best" href="/dashboard/campaigns" router={router} basePath={basePath} />
        <LeaderCard label={`Pior campanha · ${data.leaderboards.windowLabel}`} item={data.leaderboards.worstCampaign} type="worst" href="/dashboard/campaigns" router={router} basePath={basePath} />
      </section>

    </div>
  );
}
