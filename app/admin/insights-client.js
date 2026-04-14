'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';
import { buildDashboardPageDetailHref, formatPageLabel } from '@/lib/admin/page-presentation';

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value || 0));

function openInsightCard(router, href, basePath) {
  if (!href) return;
  router.push(resolveDashboardHref(href, basePath));
}

function getInsightCardProps(router, href, basePath) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: () => openInsightCard(router, href, basePath),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openInsightCard(router, href, basePath);
      }
    }
  };
}

function buildProductHref(slug) {
  return slug ? `/dashboard/products/${encodeURIComponent(slug)}` : '/dashboard/products';
}

function buildCampaignHref(value) {
  return value ? `/dashboard/campaigns?q=${encodeURIComponent(value)}` : '/dashboard/campaigns';
}

function resolveSeoHref(item) {
  const page =
    item?.page ||
    item?.pagePath ||
    item?.targetPage ||
    item?.url ||
    item?.evidence?.find?.((entry) => entry?.page || entry?.pagePath)?.page ||
    item?.evidence?.find?.((entry) => entry?.pagePath)?.pagePath;

  return page ? buildDashboardPageDetailHref(page) : '/dashboard/seo';
}

function SummaryCard({ label, value, helper, tone = 'blue', href, router, basePath }) {
  return (
    <article className={`intelligence-metric-card intelligence-metric-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getInsightCardProps(router, href, basePath)}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function resolveInsightHref(item) {
  if (!item) return '/dashboard/decision-center';

  if (item.scopeType === 'page') return buildDashboardPageDetailHref(item.scopeId);
  if (item.scopeType === 'product') return buildProductHref(item.scopeId);
  if (item.scopeType === 'campaign') return buildCampaignHref(item.scopeId);
  if (item.scopeType === 'seo') return resolveSeoHref(item);
  if (item.scopeType === 'operation') return '/dashboard/automations';

  if (item.requiresApproval) return '/dashboard/approvals';
  return '/dashboard/decision-center';
}

export default function AdminInsightsClient({ apiBase = '/api/admin', initialData = null, basePath = '/admin' }) {
  const router = useRouter();
  const endpoint = `${apiBase}/insights`;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      primeAdminJsonCache(endpoint, initialData, 60_000);
      setData(initialData);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminJson(endpoint, { ttlMs: 60_000 });
        if (response?.error) {
          throw new Error(response.detail || response.error);
        }
        setData(response);
      } catch (err) {
        setError(err.message || 'Falha ao carregar IA / Insights.');
      } finally {
        setLoading(false);
      }
    };

    void load();
    return undefined;
  }, [endpoint, initialData]);

  if (loading) return <p className="dashboard-card-empty">Montando o módulo de IA / Insights...</p>;
  if (error) return <p className="dashboard-error">{error}</p>;
  if (!data) return <p className="dashboard-card-empty">Sem dados suficientes para IA / Insights.</p>;

  const executionCenter = data.executionCenter || {};
  const pendingApprovals = data.approvals?.pending || [];
  const approvalHistory = data.approvals?.history || [];
  const automationExecutions = data.automations?.executions || [];
  const operations = data.operations || { summary: {}, focus: {}, items: [] };
  const aiNarrative = data.aiNarrative || null;
  const topPageHref = data.scores.pages[0]?.pagePath ? buildDashboardPageDetailHref(data.scores.pages[0].pagePath) : '/dashboard/pages';
  const topCampaignHref = data.scores.campaigns[0]?.label ? buildCampaignHref(data.scores.campaigns[0].label) : '/dashboard/campaigns';
  const topSeoHref = data.scores.seo[0] ? resolveSeoHref(data.scores.seo[0]) : '/dashboard/seo';

  return (
    <div className="intelligence-shell">
      <section className="intelligence-hero intelligence-hero--seo">
        <div className="intelligence-hero-main">
          <p className="eyebrow">IA / Insights</p>
          <h3>Diagnóstico, motivo, recomendação e impacto em formato executivo</h3>
          <p>{aiNarrative?.dailyNarrative || data.summaries.daily}</p>

          <div className="intelligence-pill-row">
            <span className={`intelligence-chip intelligence-chip--${aiNarrative?.source?.status === 'live' ? 'success' : 'warning'}`}>
              {aiNarrative?.source?.status === 'live' ? 'IA ativa' : 'IA em espera'}
            </span>
            <span className="intelligence-chip intelligence-chip--purple">Resumo diário ativo</span>
            <span className="intelligence-chip intelligence-chip--blue">Resumo semanal pronto</span>
            <span className="intelligence-chip intelligence-chip--success">Top prioridade: {data.mission.topPriority}</span>
            <span className="intelligence-chip intelligence-chip--warning">Aprovações: {pendingApprovals.length}</span>
            <span className="intelligence-chip intelligence-chip--success">Registros ok: {executionCenter.successfulRuns || 0}</span>
          </div>
        </div>

        <aside className="intelligence-hero-side">
          <article className="intelligence-focus-card admin-actionable-card" {...getInsightCardProps(router, '/dashboard/decision-center', basePath)}>
            <span>Resumo semanal</span>
            <strong>{aiNarrative?.dailyHeadline || data.summaries.topPriority}</strong>
            <p>{aiNarrative?.weeklyNarrative || data.summaries.weekly}</p>
          </article>
          {aiNarrative?.topActions?.length ? (
            <article className="intelligence-focus-card intelligence-focus-card--soft admin-actionable-card" {...getInsightCardProps(router, '/dashboard/decision-center', basePath)}>
              <span>Top 3 ações da IA</span>
              <strong>{aiNarrative.topActions[0]}</strong>
              <p>{aiNarrative.topActions.slice(1).join(' ')}</p>
            </article>
          ) : null}
        </aside>
      </section>

      <section className="intelligence-metric-grid">
        <SummaryCard
          label="Insights ativos"
          value={formatNumber(data.insights.length)}
          helper="Diagnósticos prontos para ação"
          tone="purple"
          href="/dashboard/decision-center"
          router={router}
          basePath={basePath}
        />
        <SummaryCard
          label="Produtos scoreados"
          value={formatNumber(data.scores.products.length)}
          helper="ProductOpportunity + ProfitPriority"
          tone="gold"
          href="/dashboard/products"
          router={router}
          basePath={basePath}
        />
        <SummaryCard
          label="Páginas scoreadas"
          value={formatNumber(data.scores.pages.length)}
          helper="Health + Conversion + Urgency"
          tone="blue"
          href="/dashboard/pages"
          router={router}
          basePath={basePath}
        />
        <SummaryCard
          label="Campanhas scoreadas"
          value={formatNumber(data.scores.campaigns.length)}
          helper="Health + Efficiency + Urgency"
          tone="green"
          href="/dashboard/campaigns"
          router={router}
          basePath={basePath}
        />
      </section>

      <section className="intelligence-grid-2">
        <article className="intelligence-panel intelligence-panel--soft">
          <div className="intelligence-panel-head">
            <div>
              <span>Fila operacional</span>
              <h3>Onde a IA já deixou o próximo passo organizado</h3>
            </div>
          </div>
          <div className="intelligence-list">
            {operations.items?.length ? (
              operations.items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className={`intelligence-list-card intelligence-list-card--${item.tone} admin-actionable-card`}
                  {...getInsightCardProps(router, item.contextHref || item.operationHref || '/dashboard/automations', basePath)}
                >
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <small>{item.statusLabel} · {item.executionModeLabel}</small>
                  {item.dispatchPacket ? (
                    <small>{item.dispatchPacket.connectorStatusLabel} · {item.dispatchPacket.readinessLabel}</small>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">A fila operacional ainda não recebeu uma ação aprovada.</p>
            )}
          </div>
        </article>

        <article className="intelligence-panel intelligence-panel--soft admin-actionable-card" {...getInsightCardProps(router, '/dashboard/settings/ai-budget', basePath)}>
          <div className="intelligence-panel-head">
            <div>
              <span>Prompt Builder</span>
              <h3>Estrutura pronta para IA com custo controlado</h3>
            </div>
          </div>

          <div className="intelligence-bullet-list">
            <div>
              <strong>Modo atual</strong>
              <p>{data.promptBundle.mode}</p>
            </div>
            <div>
              <strong>Resumo diário</strong>
              <p>{data.promptBundle.dailySummaryPrompt.maxItems} itens máximos com recorte executivo.</p>
            </div>
            <div>
              <strong>Resumo semanal</strong>
              <p>{data.promptBundle.weeklySummaryPrompt.maxItems} itens máximos para leitura estratégica.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="intelligence-grid-2">
        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Rastro do dia</span>
              <h3>{executionCenter.headline || 'A IA ainda está montando um histórico confiável'}</h3>
            </div>
          </div>
          <div className="intelligence-list">
            <div className="intelligence-stat-row admin-actionable-card" {...getInsightCardProps(router, '/dashboard/history', basePath)}>
              <div>
                <strong>Registros concluídos</strong>
                <small>{executionCenter.successfulRuns || 0} registros operacionais no histórico</small>
              </div>
              <b>{executionCenter.successfulRuns || 0}</b>
            </div>
            <div className="intelligence-stat-row admin-actionable-card" {...getInsightCardProps(router, '/dashboard/approvals', basePath)}>
              <div>
                <strong>Aprovações pendentes</strong>
                <small>{pendingApprovals.length} decisões ainda bloqueiam o próximo passo</small>
              </div>
              <b>{pendingApprovals.length}</b>
            </div>
            <div className="intelligence-stat-row admin-actionable-card" {...getInsightCardProps(router, '/dashboard/tasks', basePath)}>
              <div>
                <strong>Reviews abertas</strong>
                <small>{executionCenter.pendingReviews || 0} acompanhamentos seguem vivos após a sugestão</small>
              </div>
              <b>{executionCenter.pendingReviews || 0}</b>
            </div>
            <div className="intelligence-stat-row admin-actionable-card" {...getInsightCardProps(router, operations.focus?.nextOperation?.contextHref || operations.focus?.nextOperation?.operationHref || '/dashboard/automations', basePath)}>
              <div>
                <strong>Fila operacional</strong>
                <small>{(operations.summary?.ready || 0) + (operations.summary?.running || 0)} ações já têm destino e próximo passo</small>
              </div>
              <b>{(operations.summary?.ready || 0) + (operations.summary?.running || 0)}</b>
            </div>
          </div>
        </article>

        <article className="intelligence-panel intelligence-panel--soft">
          <div className="intelligence-panel-head">
            <div>
              <span>Fila sensível</span>
              <h3>O que a IA já preparou para sua caneta</h3>
            </div>
          </div>
          <div className="intelligence-list">
            {pendingApprovals.length ? (
              pendingApprovals.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="intelligence-list-card intelligence-list-card--warning admin-actionable-card"
                  {...getInsightCardProps(router, '/dashboard/approvals', basePath)}
                >
                  <strong>{item.title}</strong>
                  <p>{item.execution?.summary || item.reason}</p>
                  <small>{item.recommendation}</small>
                </div>
              ))
            ) : approvalHistory.length ? (
              approvalHistory.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="intelligence-list-card intelligence-list-card--success admin-actionable-card"
                  {...getInsightCardProps(router, '/dashboard/history', basePath)}
                >
                  <strong>{item.title}</strong>
                  <p>{item.executionDetail || item.reason}</p>
                  <small>{item.status === 'approved' ? 'Aprovado' : 'Rejeitado'}</small>
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">Nenhuma aprovação sensível registrada ainda.</p>
            )}
          </div>
        </article>
      </section>

      <section className="intelligence-grid-2">
        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Feed de insights</span>
              <h3>O que merece decisão agora</h3>
            </div>
          </div>

          <div className="intelligence-list">
            {data.insights.length ? (
              data.insights.map((item) => (
                <div
                  key={item.id}
                  className={`intelligence-list-card intelligence-list-card--${item.tone} admin-actionable-card`}
                  {...getInsightCardProps(router, resolveInsightHref(item), basePath)}
                >
                  <strong>{item.title}</strong>
                  <p><b>Diagnóstico:</b> {item.diagnosis}</p>
                  <p><b>Motivo:</b> {item.reason}</p>
                  <p><b>Recomendação:</b> {item.recommendation}</p>
                  <small>
                    Prioridade: {item.priority}. Impacto: {item.impactEstimate}. Precisa aprovação: {item.requiresApprovalLabel}.
                  </small>
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">Sem insights ativos neste recorte.</p>
            )}
          </div>
        </article>

      </section>

      <section className="intelligence-grid-2">
        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Produtos prioritários</span>
              <h3>ProductOpportunityScore + ProductProfitPriorityScore</h3>
            </div>
          </div>
          <div className="intelligence-list">
            {data.scores.products.length ? (
              data.scores.products.slice(0, 6).map((item) => (
                <div
                  key={item.slug}
                  className="intelligence-stat-row admin-actionable-card"
                  {...getInsightCardProps(router, item.slug ? buildProductHref(item.slug) : '/dashboard/products', basePath)}
                >
                  <div>
                    <strong>{item.label}</strong>
                    <small>Opportunity {item.opportunityScore} · Profit {item.profitPriorityScore} · Urgency {item.urgencyScore}</small>
                  </div>
                  <b>{item.priorityLabel}</b>
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">Sem produtos scoreados neste recorte.</p>
            )}
          </div>
        </article>

        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Leaders de score</span>
              <h3>Páginas, campanhas e SEO</h3>
            </div>
          </div>
          <div className="intelligence-bullet-list">
            <div className="admin-actionable-card" {...getInsightCardProps(router, topPageHref, basePath)}>
              <strong>Página mais urgente</strong>
              <p>{data.scores.pages[0]?.pagePath ? formatPageLabel(data.scores.pages[0].pagePath) : 'Sem página dominante'}</p>
            </div>
            <div className="admin-actionable-card" {...getInsightCardProps(router, topCampaignHref, basePath)}>
              <strong>Campanha mais urgente</strong>
              <p>{data.scores.campaigns[0]?.label || 'Sem campanha dominante'}</p>
            </div>
            <div className="admin-actionable-card" {...getInsightCardProps(router, topSeoHref, basePath)}>
              <strong>Melhor oportunidade SEO</strong>
              <p>{data.scores.seo[0]?.query || 'Sem query dominante'}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="intelligence-grid-2">
        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Registros operacionais</span>
              <h3>O que já ficou registrado no histórico</h3>
            </div>
          </div>
          <div className="intelligence-list">
            {automationExecutions.length ? (
              automationExecutions.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="intelligence-stat-row admin-actionable-card"
                  {...getInsightCardProps(router, '/dashboard/automations', basePath)}
                >
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                  <b>{item.status}</b>
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">Sem registros recentes neste recorte.</p>
            )}
          </div>
        </article>

        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Prontidão operacional</span>
              <h3>O que está travando ou acelerando a IA</h3>
            </div>
          </div>
          <div className="intelligence-bullet-list">
            <div className="admin-actionable-card" {...getInsightCardProps(router, '/dashboard/history', basePath)}>
              <strong>Resumo executivo</strong>
              <p>{executionCenter.summary || 'Assim que a IA executar mais rotinas, esse resumo fica mais forte.'}</p>
            </div>
            <div className="admin-actionable-card" {...getInsightCardProps(router, '/dashboard/approvals', basePath)}>
              <strong>Última decisão humana</strong>
              <p>{executionCenter.lastApproval?.title || 'Sem aprovação recente'}</p>
            </div>
            <div className="admin-actionable-card" {...getInsightCardProps(router, '/dashboard/automations', basePath)}>
              <strong>Último registro</strong>
              <p>{executionCenter.lastRun?.title || 'Sem registro recente'}</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
