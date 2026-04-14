'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuidePanel } from '@/components/admin/admin-guide-panel';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { formatPageLabel } from '@/lib/admin/page-presentation';

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value || 0));
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2
  }).format(Number(value || 0));

function openAdminRoute(router, path) {
  if (!path) return;
  router.push(path);
}

function toneLabel(tone) {
  return (
    {
      success: 'Bom',
      warning: 'Atenção',
      danger: 'Urgente',
      premium: 'Oportunidade'
    }[tone] || 'Neutro'
  );
}

function MetricPill({ label, value, tone = 'neutral' }) {
  return (
    <div className={`cockpit-metric-pill cockpit-metric-pill--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProductHealthCard({ item, basePath, router }) {
  return (
    <article className={`cockpit-product-card cockpit-product-card--${item.emphasis}`}>
      <div className="cockpit-product-top">
        <div>
          <p>{item.label}</p>
          <h4>{item.narrative.headline}</h4>
        </div>
        <span className={`cockpit-status-chip cockpit-status-chip--${item.healthTone}`}>{item.healthLabel}</span>
      </div>

      <div className="cockpit-score-row">
        <div className="cockpit-score-ring">
          <strong>{item.healthScore}</strong>
          <small>score</small>
        </div>
        <div className="cockpit-score-bars">
          <div>
            <span>Tráfego</span>
            <b>{formatNumber(item.views)}</b>
          </div>
          <div>
            <span>Cliques</span>
            <b>{formatNumber(item.clicks)}</b>
          </div>
          <div>
            <span>Leads</span>
            <b>{formatNumber(item.leads)}</b>
          </div>
        </div>
      </div>

      <div className="cockpit-progress">
        <div style={{ width: `${Math.min(item.healthScore, 100)}%` }} />
      </div>

      <div className="cockpit-product-meta">
        <span>CTR {formatPercent(item.clickRate)}</span>
        <span>Lead rate {formatPercent(item.leadRate)}</span>
        <span>{item.priority}</span>
      </div>

      <p>{item.narrative.reason}</p>
      <small>{item.narrative.recommendation}</small>

      <div className="cockpit-card-actions">
        <button type="button" className="button button--ghost" onClick={() => openAdminRoute(router, resolveDashboardHref('/admin/produtos', basePath))}>
          Ver produto
        </button>
        <button type="button" className="button button--primary" onClick={() => openAdminRoute(router, resolveDashboardHref('/admin/paginas', basePath))}>
          Ver página
        </button>
      </div>
    </article>
  );
}

function ActionCard({ item, basePath, router }) {
  return (
    <article className={`cockpit-decision-card cockpit-decision-card--${item.tone}`}>
      <div className="cockpit-decision-head">
        <div>
          <span>{item.bucket}</span>
          <h4>{item.title}</h4>
        </div>
        <strong>{item.priority}</strong>
      </div>

      <p>{item.diagnosis}</p>

      <div className="cockpit-diagnosis-grid">
        <div>
          <small>Motivo</small>
          <strong>{item.reason}</strong>
        </div>
        <div>
          <small>Próxima ação</small>
          <strong>{item.recommendation}</strong>
        </div>
        <div>
          <small>Impacto</small>
          <strong>{item.impact}</strong>
        </div>
      </div>

      <div className="cockpit-card-actions">
        <button type="button" className="button button--ghost" onClick={() => openAdminRoute(router, resolveDashboardHref(item.href, basePath))}>
          {item.actionLabel}
        </button>
      </div>
    </article>
  );
}

function ApprovalCard({ item, basePath, router }) {
  return (
    <article className="cockpit-approval-card">
      <div className="cockpit-approval-head">
        <div>
          <span>Aprovação</span>
          <h4>{item.title}</h4>
        </div>
        <strong>{item.risk}</strong>
      </div>
      <p>{item.reason}</p>
      <small>{item.recommendation}</small>
      {item.aiGuidance ? <small>{item.aiGuidance.verdict}: {item.aiGuidance.whyNow || item.aiGuidance.expectedUpside}</small> : null}
      <div className="cockpit-approval-foot">
        <span>{item.impact}</span>
        <button type="button" className="button button--ghost" onClick={() => openAdminRoute(router, resolveDashboardHref(item.href, basePath))}>
          {item.actionLabel}
        </button>
      </div>
    </article>
  );
}

function AutomationCard({ item }) {
  return (
    <article className={`cockpit-automation-card cockpit-automation-card--${item.status}`}>
      <div className="cockpit-automation-head">
        <div>
          <span>{item.statusLabel}</span>
          <h4>{item.title}</h4>
        </div>
        <strong>{item.status === 'active' ? 'Auto' : item.status === 'ready' ? 'Ready' : 'Block'}</strong>
      </div>
      <p>{item.description}</p>
      <small>{item.effect}</small>
    </article>
  );
}

function InsightList({ title, eyebrow, items, emptyText }) {
  return (
    <article className="cockpit-panel">
      <div className="cockpit-panel-head">
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
        </div>
      </div>

      {items.length ? (
        <div className="cockpit-stack-list">
          {items.map((item) => (
            <div key={item.title || item.query} className="cockpit-mini-insight">
              <strong>{item.title || item.query}</strong>
              <p>{item.description || `${formatNumber(item.impressions)} impressões · posição ${item.position}`}</p>
              <small>{item.impact || item.value || `CTR ${formatPercent(item.ctr)}`}</small>
            </div>
          ))}
        </div>
      ) : (
        <p className="dashboard-card-empty">{emptyText}</p>
      )}
    </article>
  );
}

export default function CopilotClient({ apiBase = '/api/admin', basePath = '/admin', initialData = null, guide = '' }) {
  const router = useRouter();
  const endpoint = `${apiBase}/executive-cockpit`;
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
        setError(err.message || 'Falha ao carregar o centro de decisão.');
      } finally {
        setLoading(false);
      }
    };

    void load();
    return undefined;
  }, [endpoint, initialData]);

  if (loading) {
    return <p className="dashboard-card-empty">Montando o centro de decisão do dia...</p>;
  }

  if (error) {
    return <p className="dashboard-error">{error}</p>;
  }

  if (!data) {
    return <p className="dashboard-card-empty">Ainda não há dados suficientes para o cockpit.</p>;
  }

  const aiNarrative = data.aiNarrative || null;
  const firstAction = data.actionQueue?.[0] || null;
  const guideTitle =
    guide === 'decision-workflow'
      ? 'Passo a passo para usar o Centro de Decisão'
      : 'Como transformar analise em acao';
  const guideDescription =
    guide === 'decision-workflow'
      ? 'Essa tela nao e para voce ficar preso em metricas. Ela serve para escolher a proxima acao e ir para a tela certa.'
      : 'Use o Centro de Decisão para escolher o rumo e sair rapido para a execucao.';

  return (
    <div className="cockpit-shell">
      <section className="cockpit-hero">
        <div className="cockpit-hero-main">
          <p className="eyebrow">Centro de decisão</p>
          <h3>{aiNarrative?.missionHeadline || data.commandCenter.title}</h3>
          <p>{aiNarrative?.missionNarrative || data.commandCenter.diagnosis}</p>

          <div className="cockpit-hero-grid">
            <div className="cockpit-hero-block">
              <small>Motivo</small>
              <strong>{data.commandCenter.why}</strong>
            </div>
            <div className="cockpit-hero-block">
              <small>Recomendação</small>
              <strong>{aiNarrative?.decisionNarrative || data.commandCenter.recommendation}</strong>
            </div>
            <div className="cockpit-hero-block">
              <small>Impacto</small>
              <strong>{data.commandCenter.impact}</strong>
            </div>
          </div>
        </div>

        <div className="cockpit-hero-side">
          <div className="cockpit-confidence-card">
            <span>{aiNarrative?.source?.status === 'live' ? 'IA ativa' : 'IA em espera'}</span>
            <strong>{data.commandCenter.confidence}</strong>
            <small>{aiNarrative?.decisionNarrative || data.integrations.summary.stageDescription}</small>
          </div>

          <div className="cockpit-pill-grid">
            <MetricPill label="Score médio" value={data.summary.averageHealthScore} tone="blue" />
            <MetricPill label="Leads core" value={formatNumber(data.summary.totalCoreLeads)} tone="green" />
            <MetricPill label="Aprovações" value={formatNumber(data.summary.approvalsWaiting)} tone="gold" />
            <MetricPill label="Automações" value={formatNumber(data.summary.automationCoverage)} tone="purple" />
          </div>
        </div>
      </section>

      <AdminGuidePanel
        eyebrow="Modo guiado"
        title={guideTitle}
        description={guideDescription}
        tone="blue"
        steps={[
          {
            title: 'Comece por "O que fazer hoje"',
            description: 'Essa lista e a fila de decisao principal. Nao tente interpretar todos os blocos da tela ao mesmo tempo.'
          },
          {
            title: 'Abra a primeira acao relevante',
            description: 'Use o botao do card para ir direto para Leads, Aprovações, Campanhas ou a frente que realmente precisa de voce.'
          },
          {
            title: 'Se houver caneta humana, volte para Aprovações',
            description: 'Tudo que for sensivel financeiramente ou operacionalmente passa por la.'
          },
          {
            title: 'Depois de agir, retorne aqui so para pegar a proxima frente',
            description: 'O cockpit deve servir como central de escolha, nao como pagina para ficar parado analisando.'
          }
        ]}
      >
        {firstAction?.href ? (
          <button
            type="button"
            className="button button--primary"
            onClick={() => openAdminRoute(router, resolveDashboardHref(firstAction.href, basePath))}
          >
            Abrir próxima ação
          </button>
        ) : null}
      </AdminGuidePanel>

      {aiNarrative?.topActions?.length ? (
        <section className="cockpit-panel">
          <div className="cockpit-panel-head">
            <div>
              <span>Leitura da IA</span>
              <h3>Top 3 ações estratégicas agora</h3>
            </div>
          </div>
          <div className="cockpit-stack-list">
            {aiNarrative.topActions.map((item) => (
              <div key={item} className="cockpit-mini-insight cockpit-mini-insight--premium">
                <strong>{item}</strong>
                <p>{aiNarrative.decisionNarrative || data.commandCenter.recommendation}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="cockpit-products-strip">
            {data.products.map((item) => (
              <ProductHealthCard key={item.slug} item={item} basePath={basePath} router={router} />
            ))}
      </section>

      <section className="cockpit-layout">
        <article className="cockpit-panel cockpit-panel--primary">
          <div className="cockpit-panel-head">
            <div>
              <span>O que fazer hoje</span>
              <h3>Fila de decisão com diagnóstico, motivo e próxima ação</h3>
            </div>
          </div>

          <div className="cockpit-action-list">
            {data.actionQueue.map((item) => (
              <ActionCard key={item.id} item={item} basePath={basePath} router={router} />
            ))}
          </div>
        </article>

        <div className="cockpit-side-stack">
          <article className="cockpit-panel">
            <div className="cockpit-panel-head">
              <div>
                <span>Fila crítica</span>
                <h3>Aprovações pendentes</h3>
              </div>
            </div>

            {data.approvals.length ? (
              <div className="cockpit-stack-list">
            {data.approvals.map((item) => (
              <ApprovalCard key={item.id} item={item} basePath={basePath} router={router} />
            ))}
              </div>
            ) : (
              <p className="dashboard-card-empty">Sem aprovações críticas pendentes no momento.</p>
            )}
          </article>

          <article className="cockpit-panel">
            <div className="cockpit-panel-head">
              <div>
                <span>Segundo cérebro</span>
                <h3>Automações e leituras ativas</h3>
              </div>
            </div>

            <div className="cockpit-stack-list">
              {data.automations.map((item) => (
                <AutomationCard key={item.key} item={item} />
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="cockpit-grid-3">
        <InsightList
          title="Onde o dinheiro escapa"
          eyebrow="Vazamentos"
          items={data.moneyLeaks}
          emptyText="Nenhum vazamento relevante detectado neste ciclo."
        />

        <InsightList
          title="O que vale escalar"
          eyebrow="Oportunidades"
          items={data.growthMoves}
          emptyText="Ainda não há uma alavanca clara para escala imediata."
        />

        <article className="cockpit-panel">
          <div className="cockpit-panel-head">
            <div>
              <span>SEO estratégico</span>
              <h3>Oportunidades orgânicas</h3>
            </div>
            <span className={`cockpit-status-chip cockpit-status-chip--${data.seo.status === 'connected' ? 'success' : data.seo.status === 'partial' ? 'warning' : 'danger'}`}>
              {data.seo.statusLabel}
            </span>
          </div>

          {data.seo.opportunities.length ? (
            <div className="cockpit-stack-list">
              {data.seo.opportunities.map((item) => (
                <div key={item.query} className="cockpit-mini-insight cockpit-mini-insight--premium">
                  <strong>{item.query}</strong>
                  <p>
                    {formatNumber(item.impressions)} impressões, {formatNumber(item.clicks)} cliques e posição {item.position}.
                  </p>
                  <small>CTR {formatPercent(item.ctr)}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="cockpit-mini-insight">
              <strong>Sem oportunidade orgânica pronta</strong>
              <p>{data.seo.reason}</p>
            </div>
          )}
        </article>
      </section>

      <section className="cockpit-grid-2">
        <article className="cockpit-panel">
          <div className="cockpit-panel-head">
            <div>
              <span>Mídia e orçamento</span>
              <h3>Radar financeiro</h3>
            </div>
          </div>

          <div className="cockpit-stack-list">
            <div className="cockpit-mini-insight">
              <strong>{formatCurrency(data.media.summary.totalSpend)} em mídia conectada</strong>
              <p>
                {formatNumber(data.media.summary.totalClicks)} cliques, {formatNumber(data.media.summary.totalConversions)} conversões e CTR geral de{' '}
                {formatPercent(data.media.summary.overallCtr)}.
              </p>
              <small>{formatNumber(data.media.summary.connectedMediaSources)} fonte(s) de mídia conectada(s).</small>
            </div>

            {data.media.bestCampaign ? (
              <div className="cockpit-mini-insight cockpit-mini-insight--success">
                <strong>{data.media.bestCampaign.name}</strong>
                <p>{data.media.bestCampaign.sourceTitle} é a campanha paga mais promissora agora.</p>
                <small>
                  {formatCurrency(data.media.bestCampaign.spend)} gastos · {formatNumber(data.media.bestCampaign.conversions)} conversões
                </small>
              </div>
            ) : null}

            {data.media.worstCampaign ? (
              <div className="cockpit-mini-insight cockpit-mini-insight--danger">
                <strong>{data.media.worstCampaign.name}</strong>
                <p>Esta é a campanha com maior risco de desperdício imediato.</p>
                <small>
                  {formatCurrency(data.media.worstCampaign.spend)} gastos · {formatNumber(data.media.worstCampaign.clicks)} cliques
                </small>
              </div>
            ) : null}
          </div>
        </article>

        <article className="cockpit-panel">
          <div className="cockpit-panel-head">
            <div>
              <span>Infra do cockpit</span>
              <h3>Maturidade das integrações</h3>
            </div>
          </div>

          <div className="cockpit-stage-card">
            <strong>{data.integrations.summary.stageLabel}</strong>
            <p>{data.integrations.summary.stageDescription}</p>
            <small>{data.integrations.summary.nextUnlockDescription}</small>
          </div>

          <div className="cockpit-integration-list">
            {data.integrations.items.map((item) => (
              <div key={item.key} className={`cockpit-integration-item cockpit-integration-item--${item.status}`}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.statusLabel}</p>
                </div>
                <small>{item.nextAction || item.reason}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="cockpit-footer-grid">
        <article className="cockpit-panel">
          <div className="cockpit-panel-head">
            <div>
              <span>Resumo executivo</span>
              <h3>O que o sistema está vendo agora</h3>
            </div>
          </div>

          <div className="cockpit-summary-grid">
            <div>
              <small>Tráfego core</small>
              <strong>{formatNumber(data.summary.totalCoreViews)}</strong>
            </div>
            <div>
              <small>Cliques core</small>
              <strong>{formatNumber(data.summary.totalCoreClicks)}</strong>
            </div>
            <div>
              <small>Leads core</small>
              <strong>{formatNumber(data.summary.totalCoreLeads)}</strong>
            </div>
            <div>
              <small>Oportunidades SEO</small>
              <strong>{formatNumber(data.summary.organicOpportunities)}</strong>
            </div>
          </div>
        </article>

        <article className="cockpit-panel">
          <div className="cockpit-panel-head">
            <div>
              <span>Top páginas</span>
              <h3>Rotas mais quentes do período</h3>
            </div>
          </div>

          <div className="cockpit-top-pages">
            {data.topPages.slice(0, 6).map((item) => (
              <div key={item.pagePath}>
                <strong>{formatPageLabel(item.pagePath)}</strong>
                <small>{formatNumber(item.views)} visualizações</small>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
