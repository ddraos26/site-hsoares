'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value || 0));

function openAutomationCard(router, href, basePath) {
  if (!href) return;
  router.push(resolveDashboardHref(href, basePath));
}

function getAutomationCardProps(router, href, basePath) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: () => openAutomationCard(router, href, basePath),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openAutomationCard(router, href, basePath);
      }
    }
  };
}

function MetricCard({ label, value, helper, tone = 'blue', href, router, basePath }) {
  return (
    <article className={`intelligence-metric-card intelligence-metric-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getAutomationCardProps(router, href, basePath)}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

export default function AdminAutomationsClient({ apiBase = '/api/admin', initialData = null, basePath = '/admin' }) {
  const router = useRouter();
  const endpoint = `${apiBase}/automations`;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [runningCycle, setRunningCycle] = useState(false);

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
        setError(err.message || 'Falha ao carregar automações.');
      } finally {
        setLoading(false);
      }
    };
    void load();
    return undefined;
  }, [endpoint, initialData]);

  const handleRunCycle = async () => {
    setRunningCycle(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-job-cycle' }),
        cache: 'no-store'
      });
      const payload = await response.json();

      if (!response.ok || payload?.error) {
        throw new Error(payload?.detail || payload?.error || 'Falha ao rodar o ciclo automático.');
      }

      setData({
        checkedAt: payload.checkedAt,
        automations: payload.automations,
        jobs: payload.jobs,
        operations: payload.operations,
        mission: payload.mission,
        approvals: payload.approvals,
        guardrails: payload.guardrails,
        cost: payload.cost
      });
    } catch (err) {
      setError(err.message || 'Falha ao rodar o ciclo automático.');
    } finally {
      setRunningCycle(false);
    }
  };

  if (loading) return <p className="dashboard-card-empty">Montando o módulo de automações...</p>;
  if (error) return <p className="dashboard-error">{error}</p>;
  if (!data) return <p className="dashboard-card-empty">Sem dados para automações.</p>;

  const operations = data.operations || data.automations?.operations || { summary: {}, focus: {}, items: [] };
  const operationQueueCount = (operations.summary?.ready || 0) + (operations.summary?.running || 0);
  const guardrails = data.guardrails;
  const jobs = data.jobs || { summary: {}, focus: {}, items: [] };

  return (
    <div className="intelligence-shell">
      <section className="intelligence-hero intelligence-hero--analytics">
        <div className="intelligence-hero-main">
          <p className="eyebrow">Modo consultivo</p>
          <h3>Leitura, checklist e sugestões claras. Nada aqui altera o site, a mídia ou a operação sozinho.</h3>
          <p>{data.mission.summary}</p>

          <div className="intelligence-pill-row">
            <span className="intelligence-chip intelligence-chip--success">IA so recomenda</span>
            <span className={`intelligence-chip intelligence-chip--${data.cost.policy.useEconomicMode ? 'warning' : 'blue'}`}>
              Modo de IA: {data.cost.currentModeLabel}
            </span>
            <span className="intelligence-chip intelligence-chip--purple">Aprovações pendentes: {data.approvals.pending.length}</span>
            <span className="intelligence-chip intelligence-chip--success">Sugestões abertas: {operationQueueCount}</span>
            <span className="intelligence-chip intelligence-chip--blue">Jobs recentes: {jobs.summary?.total || 0}</span>
            <span className="intelligence-chip intelligence-chip--warning">Guardrails: {guardrails?.profile?.label || 'Conservador'}</span>
          </div>
        </div>
      </section>

      <section className="intelligence-metric-grid">
        <MetricCard
          label="Leituras ativas"
          value={formatNumber(data.automations.summary.activeAutomations)}
          helper="Camadas observando e sugerindo"
          tone="green"
          href="/dashboard/automations"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Fila pronta"
          value={formatNumber(operationQueueCount)}
          helper="Ações com destino e próximo passo"
          tone="gold"
          href="/dashboard/automations"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Tarefas geradas"
          value={formatNumber(data.automations.summary.generatedTasks)}
          helper="Checklist automático do dia"
          tone="blue"
          href="/dashboard/tasks"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Jobs rodados"
          value={formatNumber(jobs.summary?.total || 0)}
          helper="Ciclos e rotinas persistidos"
          tone="blue"
          href="/dashboard/logs"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Precisam aprovação"
          value={formatNumber(data.automations.summary.approvalsRequired)}
          helper="Ações sensíveis aguardando você"
          tone="purple"
          href="/dashboard/approvals"
          router={router}
          basePath={basePath}
        />
      </section>

      <section className="intelligence-grid-2">
        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Orquestração</span>
              <h3>Jobs automáticos do sistema</h3>
            </div>
            <button type="button" className="button button--primary" onClick={() => void handleRunCycle()} disabled={runningCycle}>
              {runningCycle ? 'Rodando ciclo...' : 'Rodar ciclo agora'}
            </button>
          </div>
          <div className="intelligence-list">
            <div className="intelligence-stat-row">
              <div>
                <strong>Último ciclo completo</strong>
                <small>{jobs.focus?.lastCycle?.summary || 'Ainda não há ciclo completo registrado.'}</small>
              </div>
              <b>{jobs.focus?.lastCycle?.status || 'sem dado'}</b>
            </div>
            {jobs.items?.length ? (
              jobs.items.slice(0, 6).map((item) => (
                <div key={item.id} className={`intelligence-list-card intelligence-list-card--${item.status === 'failed' ? 'danger' : item.status === 'degraded' ? 'warning' : 'success'}`}>
                  <strong>{item.label}</strong>
                  <p>{item.summary}</p>
                  <small>{item.status} · {item.triggerType} · {item.finishedAt}</small>
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">Os próximos jobs automáticos aparecerão aqui assim que rodarem.</p>
            )}
          </div>
        </article>

        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Fila de sugestões</span>
              <h3>O que a IA já estruturou para você revisar</h3>
            </div>
          </div>
          <div className="intelligence-list">
            {operations.items?.length ? (
              operations.items.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className={`intelligence-list-card intelligence-list-card--${item.tone} admin-actionable-card`}
                  {...getAutomationCardProps(router, item.contextHref || item.operationHref || '/dashboard/automations', basePath)}
                >
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  {item.dispatchPacket?.brief ? <p>{item.dispatchPacket.brief}</p> : null}
                  <small>{item.statusLabel} · {item.executionModeLabel}</small>
                  {item.dispatchPacket ? (
                    <small>
                      {item.dispatchPacket.connectorStatusLabel} · {item.dispatchPacket.readinessLabel} · {item.dispatchPacket.command}
                    </small>
                  ) : null}
                  {item.dispatchPacket?.guardrails ? (
                    <small>
                      {item.dispatchPacket.guardrails.mode === 'external_safe'
                        ? 'Execução externa liberada'
                        : item.dispatchPacket.guardrails.mode === 'assist_only'
                          ? 'Execução assistida'
                          : 'Execução bloqueada'} · {item.dispatchPacket.guardrails.summary}
                    </small>
                  ) : null}
                  {item.result?.executionArtifact?.type === 'site-mutation' ? (
                    <small>
                      Mutação segura do site · Escopo: {(item.result.executionArtifact.targetPaths || []).join(', ') || 'sem escopo'}
                    </small>
                  ) : null}
                  {item.result?.executionArtifact?.type === 'site-patch-preview' ? (
                    <small>
                      Preview de patch superficial · Escopo: {(item.result.executionArtifact.targetPaths || []).join(', ') || 'sem escopo'}
                    </small>
                  ) : null}
                  {item.result?.executionArtifact?.type === 'site-patch-published' ? (
                    <small>
                      Patch superficial publicado · Escopo: {(item.result.executionArtifact.targetPaths || []).join(', ') || 'sem escopo'}
                    </small>
                  ) : null}
                  <div className="admin-inline-actions">
                    <a
                      className="button button--ghost"
                      href={resolveDashboardHref(item.contextHref || item.operationHref || '/dashboard/automations', basePath)}
                      onClick={(event) => event.stopPropagation()}
                    >
                      Abrir contexto
                    </a>
                    {item.result?.executionArtifact?.type === 'site-patch-preview' ? (
                      <a
                        className="button button--ghost"
                        href={item.result?.executionArtifact?.previewUrl || item.result?.previewHref || item.siteHref || '/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Abrir preview
                      </a>
                    ) : null}
                    {item.siteHref ? (
                      <a
                        className="button button--ghost"
                        href={item.result?.appliedHref || item.siteHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {item.result?.executionArtifact?.type === 'site-patch-published' ? 'Abrir página publicada' : 'Abrir página'}
                      </a>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">Nenhuma sugestão aberta ainda.</p>
            )}
          </div>
        </article>

        <article className="intelligence-panel intelligence-panel--soft">
          <div className="intelligence-panel-head">
            <div>
              <span>Última entrega</span>
              <h3>{operations.focus?.lastCompleted?.title || 'Sem entrega concluída'}</h3>
            </div>
          </div>
          <div className="intelligence-list">
            <div
              className="intelligence-stat-row admin-actionable-card"
              {...getAutomationCardProps(router, operations.focus?.lastCompleted?.operationHref || '/dashboard/history', basePath)}
            >
              <div>
                <strong>{operations.focus?.lastCompleted?.statusLabel || 'Sem execução encerrada'}</strong>
                <small>{operations.focus?.lastCompleted?.description || 'A próxima operação concluída aparecerá aqui.'}</small>
              </div>
              <b>{formatNumber(operations.summary?.completed || 0)}</b>
            </div>
            <div
              className="intelligence-stat-row admin-actionable-card"
              {...getAutomationCardProps(router, operations.focus?.lastFailure?.operationHref || '/dashboard/history', basePath)}
            >
              <div>
                <strong>Falhas e bloqueios</strong>
                <small>{operations.focus?.lastFailure?.description || 'Sem falha recente na fila operacional.'}</small>
              </div>
              <b>{formatNumber((operations.summary?.failed || 0) + (operations.summary?.blocked || 0))}</b>
            </div>
          </div>
        </article>
      </section>

      <section className="intelligence-grid-2">
        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Alertas automáticos</span>
              <h3>O que o sistema detectou sozinho</h3>
            </div>
          </div>
          <div className="intelligence-list">
            {data.automations.alerts.length ? (
              data.automations.alerts.map((item) => (
                <div
                  key={item.id}
                  className={`intelligence-list-card intelligence-list-card--${item.tone} admin-actionable-card`}
                  {...getAutomationCardProps(router, item.requiresApproval ? '/dashboard/approvals' : '/dashboard/decision-center', basePath)}
                >
                  <strong>{item.title}</strong>
                  <p>{item.diagnosis}</p>
                  <small>{item.recommendation}</small>
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">Nenhum alerta automático ativo neste recorte.</p>
            )}
          </div>
        </article>

        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Tarefas automáticas</span>
              <h3>Checklist gerado para hoje</h3>
            </div>
          </div>
          <div className="intelligence-list">
            {data.automations.tasks.length ? (
              data.automations.tasks.map((item) => (
                <div
                  key={item.id}
                  className="intelligence-stat-row admin-actionable-card"
                  {...getAutomationCardProps(router, '/dashboard/tasks', basePath)}
                >
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.recommendation}</small>
                  </div>
                  <b>{item.priority}</b>
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">Sem tarefas automáticas neste recorte.</p>
            )}
          </div>
        </article>
      </section>

      <section className="intelligence-grid-3">
        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Semáforo de produtos</span>
              <h3>Reclassificação</h3>
            </div>
          </div>
          <div className="intelligence-list">
            {data.automations.reclassifications.products.length ? (
              data.automations.reclassifications.products.map((item) => (
                <div
                  key={item.label}
                  className="intelligence-stat-row admin-actionable-card"
                  {...getAutomationCardProps(router, '/dashboard/products', basePath)}
                >
                  <div>
                    <strong>{item.label}</strong>
                    <small>Score {item.score}</small>
                  </div>
                  <b>{item.status}</b>
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">Sem reclassificação de produtos agora.</p>
            )}
          </div>
        </article>

        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Semáforo de páginas</span>
              <h3>Reclassificação</h3>
            </div>
          </div>
          <div className="intelligence-list">
            {data.automations.reclassifications.pages.length ? (
              data.automations.reclassifications.pages.map((item) => (
                <div
                  key={item.label}
                  className="intelligence-stat-row admin-actionable-card"
                  {...getAutomationCardProps(router, '/dashboard/pages', basePath)}
                >
                  <div>
                    <strong>{item.label}</strong>
                    <small>Score {item.score}</small>
                  </div>
                  <b>{item.status}</b>
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">Sem reclassificação de páginas agora.</p>
            )}
          </div>
        </article>

        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Semáforo de campanhas</span>
              <h3>Reclassificação</h3>
            </div>
          </div>
          <div className="intelligence-list">
            {data.automations.reclassifications.campaigns.length ? (
              data.automations.reclassifications.campaigns.map((item) => (
                <div
                  key={item.label}
                  className="intelligence-stat-row admin-actionable-card"
                  {...getAutomationCardProps(router, '/dashboard/campaigns', basePath)}
                >
                  <div>
                    <strong>{item.label}</strong>
                    <small>Score {item.score}</small>
                  </div>
                  <b>{item.status}</b>
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">Sem reclassificação de campanhas agora.</p>
            )}
          </div>
        </article>
      </section>

      <section className="intelligence-grid-2">
        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Execuções</span>
              <h3>O que o sistema já fez</h3>
            </div>
          </div>
          <div className="intelligence-list">
            {data.automations.executions.length ? (
              data.automations.executions.map((item) => (
                <div
                  key={item.id}
                  className={`intelligence-list-card intelligence-list-card--${item.status === 'warning' ? 'warning' : 'success'} admin-actionable-card`}
                  {...getAutomationCardProps(router, '/dashboard/history', basePath)}
                >
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <small>{item.executedAt}</small>
                </div>
              ))
            ) : (
              <p className="dashboard-card-empty">Sem execuções registradas neste recorte.</p>
            )}
          </div>
        </article>

        <article className="intelligence-panel intelligence-panel--soft admin-actionable-card" {...getAutomationCardProps(router, '/admin/regras', basePath)}>
          <div className="intelligence-panel-head">
            <div>
              <span>Políticas</span>
              <h3>Automações de IA e economia</h3>
            </div>
          </div>
          <div className="intelligence-bullet-list">
            <div>
              <strong>Resumo diário automático</strong>
              <p>{data.automations.policies.summaryDaily ? 'Ativo' : 'Desligado'}</p>
            </div>
            <div>
              <strong>Resumo semanal automático</strong>
              <p>{data.automations.policies.summaryWeekly ? 'Ativo' : 'Desligado'}</p>
            </div>
            <div>
              <strong>Ranqueamento de oportunidades</strong>
              <p>{data.automations.policies.rankOpportunities ? 'Ativo' : 'Desligado'}</p>
            </div>
            <div>
              <strong>Modo econômico</strong>
              <p>{data.automations.policies.economicMode ? 'Ligado por política de custo' : 'Não necessário no momento'}</p>
            </div>
            <div>
              <strong>Parar análises não essenciais</strong>
              <p>{data.automations.policies.stopNonEssential ? 'Ativado' : 'Ainda liberado'}</p>
            </div>
            <div>
              <strong>Perfil de execução</strong>
              <p>{guardrails?.profile?.label || 'Conservador'}</p>
            </div>
            <div>
              <strong>Régua de pausa em campanha</strong>
              <p>R$ {formatNumber(guardrails?.policy?.campaign?.minimumSpendForPause || 0)} e {formatNumber(guardrails?.policy?.campaign?.minimumClicksForPause || 0)} cliques sem conversão.</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
