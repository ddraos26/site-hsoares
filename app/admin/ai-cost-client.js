'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2
  }).format(Number(value || 0));

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value || 0));

function openCostCard(router, href, basePath) {
  if (!href) return;
  router.push(resolveDashboardHref(href, basePath));
}

function getCostCardProps(router, href, basePath) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: () => openCostCard(router, href, basePath),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCostCard(router, href, basePath);
      }
    }
  };
}

function MetricCard({ label, value, helper, tone = 'blue', href, router, basePath }) {
  return (
    <article className={`ops-metric-card ops-metric-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getCostCardProps(router, href, basePath)}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

export default function AdminAiCostClient({
  apiBase = '/api/admin',
  basePath = '/admin',
  initialData = null
}) {
  const router = useRouter();
  const endpoint = `${apiBase}/ai-cost`;
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
        if (response?.error) throw new Error(response.detail || response.error);
        setData(response);
      } catch (err) {
        setError(err.message || 'Falha ao carregar custo da IA.');
      } finally {
        setLoading(false);
      }
    };

    void load();
    return undefined;
  }, [endpoint, initialData]);

  if (loading) return <p className="dashboard-card-empty">Montando o controle de custo da IA...</p>;
  if (error) return <p className="dashboard-error">{error}</p>;
  if (!data) return <p className="dashboard-card-empty">Sem dados para custo da IA.</p>;

  const { cost, promptBundle, aiReadiness } = data;
  const aiUsagePolicy = data?.aiUsagePolicy || null;
  const trackingQuality = data?.trackingQuality;
  const currentBudget = Number(cost.monthlyBudgetBrl || 0);
  const totalSpent = Number(cost.totalSpent || 0);
  const usageWidth = currentBudget > 0 ? Math.min(100, (totalSpent / currentBudget) * 100) : 0;
  const activePolicies = [
    cost.policy.reduceFrequency,
    cost.policy.promptCompression,
    cost.policy.stopNonEssential
  ].filter(Boolean).length;
  const maxBudget = Math.max(...Object.values(cost.budgets).map((item) => Number(item.monthlyBudgetBrl || 0)), 1);
  const modeProjectedCost = Number(cost.projectedByMode?.[cost.currentMode] || 0);
  const topWorkflow = cost.workflowUsage[0] || null;
  const heroTitle =
    cost.policy.useEconomicMode
      ? 'A camada de IA já entrou em contenção para preservar orçamento'
      : 'A camada de IA está operando com margem saudável e previsível';

  const operationalCards = useMemo(
    () => [
      {
        title: 'IA / Insights',
        copy: 'Ver onde a camada inteligente realmente está entregando valor narrativo e prioridade.',
        href: '/admin/insights',
        tone: 'premium'
      },
      {
        title: 'Automações',
        copy: 'Entender quais rotinas foram reduzidas, comprimidas ou bloqueadas por política de custo.',
        href: '/admin/automacoes',
        tone: 'warning'
      },
      {
        title: 'Regras',
        copy: 'Calibrar thresholds para depender menos de chamada de modelo quando a regra já resolve.',
        href: '/admin/regras',
        tone: 'success'
      }
    ],
    []
  );

  return (
    <div className="cockpit-shell">
      <section className="ops-hero ops-hero--pages">
        <div className="ops-hero-main">
          <p className="eyebrow">Controle de custo da IA</p>
          <h3>{heroTitle}</h3>
          <p>
            O sistema decide entre econômico, intermediário e premium controlado para manter a IA útil em operação sem transformar custo em vazamento.
          </p>

          <div className="ops-chip-row">
            <span className="ops-chip ops-chip--premium">Modo atual: {cost.currentModeLabel}</span>
            <span className={`ops-chip ops-chip--${cost.policy.useEconomicMode ? 'warning' : 'success'}`}>Uso atual: {cost.usagePercent}%</span>
            <span className="ops-chip ops-chip--warning">Budget do modo: {formatCurrency(currentBudget)}</span>
            <span className={`ops-chip ops-chip--${aiReadiness?.provider?.configured ? 'success' : 'warning'}`}>
              {aiReadiness?.provider?.configured ? 'IA pronta' : 'IA em espera'}
            </span>
          </div>
        </div>

        <aside className="ops-focus-card admin-actionable-card" {...getCostCardProps(router, '/admin/insights', basePath)}>
          <span>Faixa ativa</span>
          <strong>{formatCurrency(totalSpent)}</strong>
          <p>Gasto acumulado no mês com workflows já registrados e auditáveis.</p>
          <div className="ops-focus-meta">
            <div>
              <small>Projeção do modo</small>
              <b>{formatCurrency(modeProjectedCost)}</b>
            </div>
            <div>
              <small>Policies ativas</small>
              <b>{activePolicies}</b>
            </div>
            <div>
              <small>Workflow líder</small>
              <b>{topWorkflow?.workflow || 'Sem uso ainda'}</b>
            </div>
          </div>
        </aside>
      </section>

      <section className="ops-metric-grid">
        <MetricCard
          label="Gasto estimado"
          value={formatCurrency(totalSpent)}
          helper="Somente chamadas registradas neste mês"
          tone="premium"
          href="/admin/custo-ia"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Input tokens"
          value={formatNumber(cost.totalInputTokens)}
          helper="Entrada consumida pela IA"
          tone="blue"
          href="/admin/insights"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Output tokens"
          value={formatNumber(cost.totalOutputTokens)}
          helper="Saída gerada pelos workflows"
          tone="success"
          href="/admin/insights"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Prontidão IA"
          value={`${aiReadiness?.progress?.done || 0}/${aiReadiness?.progress?.total || 0}`}
          helper={aiReadiness?.provider?.statusLabel || 'Sem leitura de prontidão'}
          tone={aiReadiness?.provider?.configured ? 'success' : 'warning'}
          href="/admin/configuracoes"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Tracking"
          value={`${trackingQuality?.healthScore || 0}%`}
          helper={trackingQuality?.statusLabel || 'Sem leitura de tracking'}
          tone={trackingQuality?.status === 'healthy' ? 'success' : 'warning'}
          href="/admin/campanhas"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Logs auditáveis"
          value={formatNumber(cost.recentLogs.length)}
          helper="Chamadas recentes registradas"
          tone="warning"
          href="/admin/historico"
          router={router}
          basePath={basePath}
        />
      </section>

      <section className="ops-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Prontidão da IA</span>
              <h3>Checklist final de ativação</h3>
            </div>
          </div>

          <div className="ops-inline-grid">
            <article className="ops-inline-card">
              <span>Status do provider</span>
              <strong>{aiReadiness?.provider?.statusLabel || 'Sem status'}</strong>
              <p className="admin-card-footnote">{aiReadiness?.nextAction || 'Sem próximo passo no momento.'}</p>
            </article>
            <article className="ops-inline-card">
              <span>Modelo</span>
              <strong>{aiReadiness?.provider?.model || 'gpt-5-mini'}</strong>
              <p className="admin-card-footnote">{aiReadiness?.provider?.baseUrl || 'https://api.openai.com'}</p>
            </article>
            <article className="ops-inline-card">
              <span>Tracking do site</span>
              <strong>{trackingQuality?.statusLabel || 'Sem leitura'}</strong>
              <p className="admin-card-footnote">{trackingQuality?.summary || 'Sem resumo de atribuição disponível.'}</p>
            </article>
          </div>

          <div className="intelligence-bullet-list">
            {(aiReadiness?.checklist || []).map((item) => (
              <div key={item.key}>
                <strong>{item.title}</strong>
                <p>{item.status === 'done' ? 'Pronto' : 'Pendente'} · {item.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Budget por modo</span>
              <h3>Faixas de operação e folga atual</h3>
            </div>
          </div>

          <div className="ops-bar-list">
            {Object.values(cost.budgets).map((item) => {
              const width = Math.max(12, (Number(item.monthlyBudgetBrl || 0) / maxBudget) * 100);
              const tone =
                item.key === 'economic'
                  ? 'warning'
                  : item.key === 'intermediate'
                    ? 'blue'
                    : 'premium';

              return (
                <div key={item.key} className="ops-bar-row">
                  <div className="ops-bar-copy">
                    <strong>{item.label}</strong>
                    <small>{item.key}</small>
                  </div>
                  <div className="ops-bar-track">
                    <div className={`ops-bar-fill ops-bar-fill--${tone}`} style={{ width: `${width}%` }} />
                  </div>
                  <b>{formatCurrency(item.monthlyBudgetBrl)}</b>
                </div>
              );
            })}
          </div>

          <div className="ops-inline-grid">
            <article className="ops-inline-card">
              <span>Uso do mês</span>
              <strong>{formatCurrency(totalSpent)} de {formatCurrency(currentBudget)}</strong>
              <div className="product-command-progress">
                <div className={`product-command-progress-bar product-command-progress-bar--${cost.policy.useEconomicMode ? 'warning' : 'success'}`} style={{ width: `${Math.max(8, usageWidth)}%` }} />
              </div>
            </article>
            <article className="ops-inline-card">
              <span>Prompt bundle</span>
              <strong>{promptBundle.mode}</strong>
              <p className="admin-card-footnote">Resumo diário com {promptBundle.dailySummaryPrompt.maxItems} itens e semanal com {promptBundle.weeklySummaryPrompt.maxItems}.</p>
            </article>
          </div>
        </article>

        <article className="ops-panel ops-panel--soft">
          <div className="ops-panel-head">
            <div>
              <span>Cost Controller</span>
              <h3>Políticas automáticas em vigor</h3>
            </div>
          </div>

          <div className="ops-inline-grid">
            <article className="ops-inline-card">
              <span>Reduzir frequência</span>
              <strong>{cost.policy.reduceFrequency ? 'Ativado' : 'Livre no momento'}</strong>
            </article>
            <article className="ops-inline-card">
              <span>Comprimir prompts</span>
              <strong>{cost.policy.promptCompression ? 'Ativado' : 'Modo completo liberado'}</strong>
            </article>
            <article className="ops-inline-card">
              <span>Parar não essenciais</span>
              <strong>{cost.policy.stopNonEssential ? 'Ativado' : 'Ainda não necessário'}</strong>
            </article>
            <article className="ops-inline-card">
              <span>Workflow com maior gasto</span>
              <strong>{topWorkflow ? `${topWorkflow.workflow} · ${formatCurrency(topWorkflow.estimatedCost)}` : 'Sem uso ainda'}</strong>
            </article>
          </div>
        </article>

        <article className="ops-panel ops-panel--soft">
          <div className="ops-panel-head">
            <div>
              <span>Modo equilibrado</span>
              <h3>Quando a IA volta a ler sem desperdiçar orçamento</h3>
            </div>
          </div>

          <div className="ops-inline-grid">
            <article className="ops-inline-card">
              <span>Dashboard e cockpit</span>
              <strong>{aiUsagePolicy ? `${Math.round(aiUsagePolicy.dashboardLiveTtlMs / 60000)} min` : '60 min'}</strong>
              <p className="admin-card-footnote">A narrativa geral fica estável por uma hora antes de uma nova chamada.</p>
            </article>
            <article className="ops-inline-card">
              <span>Página e produto</span>
              <strong>6h a 24h</strong>
              <p className="admin-card-footnote">As rotas mais importantes vencem antes; as secundárias esperam mais para não gastar sem necessidade.</p>
            </article>
            <article className="ops-inline-card">
              <span>Nova tentativa após falha</span>
              <strong>{aiUsagePolicy ? `${Math.round(aiUsagePolicy.detailFallbackRetryMs / 60000)} min` : '45 min'}</strong>
              <p className="admin-card-footnote">Se a IA falhar, o painel espera um pouco antes de insistir de novo.</p>
            </article>
          </div>
        </article>
      </section>

      <section className="product-command-card-grid">
        {cost.workflowCatalog.map((item) => {
          const tone =
            item.importance === 'Essencial'
              ? 'success'
              : item.importance === 'Alta'
                ? 'warning'
                : 'premium';
          const budgetPercent = currentBudget > 0 ? Math.min(100, (Number(item.projected[cost.currentMode].estimatedMonthlyCost || 0) / currentBudget) * 100) : 0;

          return (
            <article
              key={item.key}
              className={`product-command-card product-command-card--${tone} admin-actionable-card`}
              {...getCostCardProps(router, item.importance === 'Opcional' ? '/admin/regras' : '/admin/insights', basePath)}
            >
              <div className="product-command-top">
                <div>
                  <span>{item.model}</span>
                  <h3>{item.title}</h3>
                </div>
                <b>{item.importance}</b>
              </div>

              <p className="product-command-copy">
                Input médio {formatNumber(item.avgInputTokens)} tokens, output médio {formatNumber(item.avgOutputTokens)} e projeção mensal de {formatCurrency(item.projected[cost.currentMode].estimatedMonthlyCost)} no modo ativo.
              </p>

              <div className="product-command-metrics">
                <span>Econômico {formatCurrency(item.projected.economic.estimatedMonthlyCost)}</span>
                <span>Intermediário {formatCurrency(item.projected.intermediate.estimatedMonthlyCost)}</span>
                <span>Premium {formatCurrency(item.projected.premium.estimatedMonthlyCost)}</span>
              </div>

              <div className="product-command-progress">
                <div className={`product-command-progress-bar product-command-progress-bar--${tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'premium'}`} style={{ width: `${Math.max(10, budgetPercent)}%` }} />
              </div>
            </article>
          );
        })}
      </section>

      <section className="ops-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Uso por workflow</span>
              <h3>O que já está gastando dentro da camada inteligente</h3>
            </div>
          </div>

          {cost.workflowUsage.length ? (
            <div className="ops-bar-list">
              {cost.workflowUsage.map((item) => {
                const width = totalSpent > 0 ? Math.max(12, (Number(item.estimatedCost || 0) / totalSpent) * 100) : 12;

                return (
                  <div key={item.workflow} className="ops-bar-row">
                    <div className="ops-bar-copy">
                      <strong>{item.workflow}</strong>
                      <small>{item.calls} chamadas</small>
                    </div>
                    <div className="ops-bar-track">
                      <div className="ops-bar-fill ops-bar-fill--blue" style={{ width: `${width}%` }} />
                    </div>
                    <b>{formatCurrency(item.estimatedCost)}</b>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="dashboard-card-empty">Ainda não há chamadas registradas. O módulo já está pronto para auditoria assim que os fluxos externos ganharem volume.</p>
          )}
        </article>

        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Próximos ajustes</span>
              <h3>Onde vale mexer para gastar melhor</h3>
            </div>
          </div>

          <div className="ops-action-grid">
            {operationalCards.map((item) => (
              <article
                key={item.title}
                className={`ops-action-card ops-action-card--${item.tone} admin-actionable-card`}
                {...getCostCardProps(router, item.href, basePath)}
              >
                <span>Próximo passo</span>
                <strong>{item.title}</strong>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
