'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuidePanel } from '@/components/admin/admin-guide-panel';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';
import { normalizeTaskStatus, TASK_STATUS } from '@/lib/admin/task-status';

function openTaskCard(router, href, basePath) {
  if (!href) return;
  router.push(resolveDashboardHref(href, basePath));
}

function openGuideDestination(router, guide, fallbackHref, basePath) {
  if (guide?.destinationKind === 'external' && guide.destinationHref) {
    window.open(guide.destinationHref, '_blank', 'noopener,noreferrer');
    return;
  }

  if (guide?.destinationKind === 'internal' && guide.destinationHref) {
    openTaskCard(router, guide.destinationHref, basePath);
    return;
  }

  if (fallbackHref) {
    openTaskCard(router, fallbackHref, basePath);
  }
}

function getTaskCardProps(router, href, basePath) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: () => openTaskCard(router, href, basePath),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openTaskCard(router, href, basePath);
      }
    }
  };
}

function MetricCard({ label, value, helper, tone = 'blue', href, router, basePath }) {
  return (
    <article className={`ops-metric-card ops-metric-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getTaskCardProps(router, href, basePath)}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function TaskCard({ item, router, basePath, savingId, onStatusChange }) {
  const isSaving = savingId === item.id;
  const guide = item.actionGuide || null;
  const currentStatus = normalizeTaskStatus(item.status);
  const rejectedIdea = item.actionType === 'rejected';
  const hasFeedback = item.actionType === 'feedback' && (item.outcome === 'yes' || item.outcome === 'no');

  return (
    <article className={`task-card task-card--${item.tone || 'blue'} ${item.href ? 'admin-actionable-card' : ''}`} {...getTaskCardProps(router, item.href, basePath)}>
      <div className="task-card-head">
        <div>
          <span>{item.sourceLabel}</span>
          <h4>{item.title}</h4>
        </div>
        <div className="task-card-badges">
          <span className={`task-priority-badge task-priority-badge--${item.tone || 'blue'}`}>{item.priority}</span>
          {item.requiresApproval ? <span className="task-state-chip task-state-chip--warning">Precisa aprovação</span> : null}
          {item.statusLabel ? <span className="task-state-chip">{item.statusLabel}</span> : null}
        </div>
      </div>

      <p>{item.description}</p>

      <div className="task-card-grid">
        <div className="task-inline-card">
          <small>Faça isso agora</small>
          <strong>{item.recommendation}</strong>
        </div>
        <div className="task-inline-card">
          <small>Quem cuida</small>
          <strong>{item.ownerLabel || 'Sem dono'}</strong>
        </div>
        <div className="task-inline-card">
          <small>Onde isso impacta</small>
          <strong>{item.productLabel || item.sourceLabel}</strong>
        </div>
        <div className="task-inline-card">
          <small>Quando olhar</small>
          <strong>{item.dueLabel || 'Hoje'}</strong>
        </div>
      </div>

      {guide ? (
        <div className="cockpit-diagnosis-grid">
          <div>
            <small>Onde fazer</small>
            <strong>{guide.destination}</strong>
            <small>{guide.helper}</small>
          </div>
        </div>
      ) : null}

      {guide?.steps?.length ? (
        <div className="task-history-list">
          {guide.steps.map((step, index) => (
            <div key={`${item.id}-step-${index + 1}`} className="task-history-row">
              <div>
                <strong>Passo {index + 1}</strong>
                <small>{step}</small>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {item.metadata?.length ? (
        <div className="task-meta-row">
          {item.metadata.map((meta) => (
            <span key={meta}>{meta}</span>
          ))}
        </div>
      ) : null}

      <div className="task-card-actions">
        {guide?.buttonLabel ? (
          <button
            type="button"
            className="button button--ghost"
            onClick={(event) => {
              event.stopPropagation();
              openGuideDestination(router, guide, item.href, basePath);
            }}
          >
            {guide.buttonLabel}
          </button>
        ) : item.href ? (
          <button
            type="button"
            className="button button--ghost"
            onClick={(event) => {
              event.stopPropagation();
              openTaskCard(router, item.href, basePath);
            }}
          >
            Abrir contexto
          </button>
        ) : null}

        {currentStatus !== TASK_STATUS.IN_PROGRESS ? (
          <button
            type="button"
            className="button button--ghost"
            disabled={isSaving}
            onClick={(event) => {
              event.stopPropagation();
              void onStatusChange(item, TASK_STATUS.IN_PROGRESS);
            }}
          >
            Em andamento
          </button>
        ) : null}

        {currentStatus !== TASK_STATUS.DONE ? (
          <button
            type="button"
            className="button button--primary"
            disabled={isSaving}
            onClick={(event) => {
              event.stopPropagation();
              void onStatusChange(item, 'done', {
                note: 'Marcado como feito.',
                actionType: 'completed'
              });
            }}
          >
            Marcar como feito
          </button>
        ) : (
          <button
            type="button"
            className="button button--ghost"
            disabled={isSaving}
            onClick={(event) => {
              event.stopPropagation();
              void onStatusChange(item, 'pending');
            }}
          >
            Reabrir
          </button>
        )}

        {!rejectedIdea && currentStatus !== TASK_STATUS.DONE ? (
          <button
            type="button"
            className="button button--ghost"
            disabled={isSaving}
            onClick={(event) => {
              event.stopPropagation();
              void onStatusChange(item, 'done', {
                note: 'Ideia rejeitada pelo admin.',
                actionType: 'rejected'
              });
            }}
          >
            Rejeitar ideia
          </button>
        ) : null}
      </div>

      {currentStatus === TASK_STATUS.DONE ? (
        <div className="task-card-actions">
          {rejectedIdea ? (
            <span className="task-state-chip task-state-chip--warning">Ideia rejeitada</span>
          ) : hasFeedback ? (
            <span className={`task-state-chip ${item.outcome === 'yes' ? 'task-state-chip--success' : 'task-state-chip--warning'}`}>
              {item.outcome === 'yes' ? 'Deu certo' : 'Nao deu certo'}
            </span>
          ) : (
            <>
              <button
                type="button"
                className="button button--primary"
                disabled={isSaving}
                onClick={(event) => {
                  event.stopPropagation();
                  void onStatusChange(item, 'done', {
                    note: 'Acao validada: deu certo.',
                    actionType: 'feedback',
                    outcome: 'yes'
                  });
                }}
              >
                Deu certo
              </button>
              <button
                type="button"
                className="button button--ghost"
                disabled={isSaving}
                onClick={(event) => {
                  event.stopPropagation();
                  void onStatusChange(item, 'done', {
                    note: 'Acao validada: nao deu certo.',
                    actionType: 'feedback',
                    outcome: 'no'
                  });
                }}
              >
                Nao deu certo
              </button>
            </>
          )}
        </div>
      ) : null}

      {item.note ? (
        <div className="cockpit-diagnosis-grid">
          <div>
            <small>Ultimo retorno</small>
            <strong>{item.note}</strong>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function QueuePanel({ title, eyebrow, items, emptyText, router, basePath, savingId, onStatusChange }) {
  return (
    <section className="ops-panel">
      <div className="ops-panel-head">
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
        </div>
      </div>

      {items.length ? (
        <div className="task-list">
          {items.map((item) => (
            <TaskCard
              key={item.id}
              item={item}
              router={router}
              basePath={basePath}
              savingId={savingId}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      ) : (
        <p className="dashboard-card-empty">{emptyText}</p>
      )}
    </section>
  );
}

export default function TasksClient({
  apiBase = '/api/admin',
  basePath = '/admin',
  initialData = null,
  guide = ''
}) {
  const router = useRouter();
  const endpoint = `${apiBase}/tasks`;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [nextFocus, setNextFocus] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAdminJson(endpoint, { ttlMs: 20_000 });
      if (response?.error) throw new Error(response.detail || response.error);
      setData(response);
    } catch (err) {
      setError(err.message || 'Falha ao carregar a fila de tarefas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialData) {
      primeAdminJsonCache(endpoint, initialData, 20_000);
      setData(initialData);
      setLoading(false);
      setError(null);
      return undefined;
    }

    void load();
    return undefined;
  }, [endpoint, initialData]);

  async function handleStatusChange(item, status, options = {}) {
    setSavingId(item.id);
    setNextFocus(null);

    try {
      const response = await fetchAdminJson(endpoint, {
        fetchOptions: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            status,
            note: options.note || '',
            actionType: options.actionType || '',
            outcome: options.outcome || '',
            title: item.title,
            sourceLabel: item.sourceLabel,
            href: item.href,
            priority: item.priority
          })
        }
      });

      if (response?.error) {
        throw new Error(response.detail || response.error);
      }

      setNextFocus(response?.nextFocus || null);
      await load();
    } catch (err) {
      setError(err.message || 'Falha ao atualizar a task.');
    } finally {
      setSavingId(null);
    }
  }

  const heroCopy = useMemo(() => {
    if (!data?.topTask) {
      return {
        title: 'A fila do dia está limpa',
        body: 'Nenhuma task crítica está aberta agora. O sistema segue monitorando leads, aprovações, automações e integrações.'
      };
    }

    return {
      title: data.topTask.title,
      body: data.topTask.description
    };
  }, [data]);

  const firstPendingTask = data?.queue?.pending?.[0] || null;
  const tasksGuideTitle =
    guide === 'task-workflow'
      ? 'Passo a passo para trabalhar a fila sem se perder'
      : 'Como operar esta tela';
  const tasksGuideDescription =
    guide === 'task-workflow'
      ? 'Aqui o objetivo nao e analisar tudo. E pegar a primeira task viva, abrir o contexto e dar baixa quando terminar.'
      : 'Use esta tela como fila de execucao. Ela existe para mostrar a proxima acao e registrar o andamento.';

  if (loading) return <p className="dashboard-card-empty">Montando a fila de tarefas...</p>;
  if (error) return <p className="dashboard-error">{error}</p>;
  if (!data) return <p className="dashboard-card-empty">Sem dados para a fila de tarefas.</p>;

  return (
    <div className="ops-shell">
      <section className="cockpit-hero">
        <div className="cockpit-hero-main">
          <p className="eyebrow">Fazer Agora</p>
          <h3>{heroCopy.title}</h3>
          <p>{heroCopy.body}</p>

          <div className="ops-chip-row">
            <span className="ops-chip ops-chip--warning">Pendentes: {data.summary.pending}</span>
            <span className="ops-chip ops-chip--premium">Em andamento: {data.summary.inProgress || data.summary.doing}</span>
            <span className="ops-chip ops-chip--success">Feitas: {data.summary.done}</span>
            <span className="ops-chip ops-chip--success">Deu certo: {data.summary.successfulFeedbacks || 0}</span>
            <span className="ops-chip ops-chip--warning">Nao deu certo: {data.summary.failedFeedbacks || 0}</span>
            <span className="ops-chip">Ideias rejeitadas: {data.summary.rejectedIdeas || 0}</span>
            <span className={`ops-chip ${data.supportingSignals.economicMode ? 'ops-chip--warning' : 'ops-chip--success'}`}>
              IA: {data.supportingSignals.currentModeLabel}
            </span>
          </div>
        </div>

        {data.topTask ? (
          <aside
            className={`cockpit-confidence-card ${data.topTask?.href ? 'admin-actionable-card' : ''}`}
            {...getTaskCardProps(router, data.topTask?.href || '/admin/missao-hoje', basePath)}
          >
            <span>Foco imediato</span>
            <strong>{data.topTask.recommendation}</strong>
            <small>{`${data.topTask.sourceLabel} · ${data.topTask.priority} · ${data.topTask.dueLabel || 'Hoje'}`}</small>
          </aside>
        ) : (
          <aside className="cockpit-confidence-card">
            <span>IA em análise</span>
            <strong>A IA está trabalhando para novas recomendações.</strong>
            <small>Assim que novas frentes aparecerem, o foco imediato será atualizado.</small>
          </aside>
        )}
      </section>

      <AdminGuidePanel
        eyebrow="Modo guiado"
        title={tasksGuideTitle}
        description={tasksGuideDescription}
        tone="premium"
        steps={[
          {
            title: 'Comece pela primeira task pendente',
            description: 'Olhe o bloco "Fila para executar agora". A primeira task dessa lista e a que merece sua energia primeiro.'
          },
          {
            title: 'Clique em "Abrir contexto"',
            description: 'Esse botao te leva para o lugar certo: Google Ads, Search Console, Analytics, Leads ou VSCode.'
          },
          {
            title: 'Depois marque "Em andamento"',
            description: 'Isso serve para voce nao perder o controle do que ja pegou para fazer.'
          },
          {
            title: 'Quando terminar, clique em "Marcar como feito"',
            description: 'Depois diga se deu certo ou nao. E assim que o admin aprende com voce.'
          }
        ]}
      >
        {firstPendingTask ? (
          <button
            type="button"
            className="button button--primary"
            onClick={() => openGuideDestination(router, firstPendingTask.actionGuide, firstPendingTask.href || '/admin/tasks', basePath)}
          >
            Comecar pela primeira tarefa
          </button>
        ) : null}
      </AdminGuidePanel>

      {nextFocus ? (
        <section className="admin-guide-card admin-guide-card--success">
          <div className="admin-guide-head">
            <div>
              <span>Próxima pendência</span>
              <h3>{nextFocus.title}</h3>
            </div>
          </div>
          <p className="admin-guide-description">{nextFocus.reason}</p>
          <div className="admin-guide-actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => openTaskCard(router, nextFocus.href, basePath)}
            >
              Ir para a próxima frente
            </button>
          </div>
        </section>
      ) : null}

      <section className="ops-metric-grid">
        <MetricCard
          label="Pendentes"
          value={data.summary.pending}
          helper="Fila viva do dia"
          tone="warning"
          href="/admin/tasks"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Urgentes"
          value={data.summary.urgent}
          helper="Exigem atenção agora"
          tone="danger"
          href="/admin/leads"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Aprovações na fila"
          value={data.summary.approvalTasks}
          helper="Dependem do seu aval"
          tone="premium"
          href="/admin/aprovacoes"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Leads operacionais"
          value={data.summary.leadTasks}
          helper="Leads que puxam execução agora"
          tone="blue"
          href="/admin/leads"
          router={router}
          basePath={basePath}
        />
      </section>

      <section className="ops-grid">
        <QueuePanel
          title="Fila para executar agora"
          eyebrow="Pendentes"
          items={data.queue.pending}
          emptyText="Nenhuma task pendente neste momento."
          router={router}
          basePath={basePath}
          savingId={savingId}
          onStatusChange={handleStatusChange}
        />

        <section className="ops-panel ops-panel--soft">
          <div className="ops-panel-head">
            <div>
              <span>Origem da fila</span>
              <h3>Quem está alimentando as tasks</h3>
            </div>
          </div>

          <div className="ops-bar-list">
            {data.breakdown.length ? (
              data.breakdown.map((item) => {
                const maxCount = Math.max(...data.breakdown.map((entry) => entry.count), 1);
                const fill = Math.max(10, Math.round((item.count / maxCount) * 100));

                return (
                  <div
                    key={item.key}
                    className={`ops-bar-row ${item.href ? 'admin-actionable-card' : ''}`}
                    {...getTaskCardProps(router, item.href, basePath)}
                  >
                    <div className="ops-bar-copy">
                      <strong>{item.label}</strong>
                      <small>{item.count} item(ns) nessa frente</small>
                    </div>
                    <div className="ops-bar-track">
                      <div className={`ops-bar-fill ops-bar-fill--${item.tone}`} style={{ width: `${fill}%` }} />
                    </div>
                    <b>{item.count}</b>
                  </div>
                );
              })
            ) : (
              <p className="dashboard-card-empty">Nenhuma origem relevante alimentando a fila agora.</p>
            )}
          </div>

          <div className="ops-inline-grid">
            <div className="ops-inline-card">
              <span>Sinais de operação</span>
              <div className="ops-inline-row">
                <strong>Leads vencidos</strong>
                <b>{data.supportingSignals.leadOverdue}</b>
              </div>
              <div className="ops-inline-row">
                <strong>Leads sem dono</strong>
                <b>{data.supportingSignals.leadUnassigned}</b>
              </div>
              <div className="ops-inline-row">
                <strong>Aprovações pendentes</strong>
                <b>{data.supportingSignals.approvalsPending}</b>
              </div>
            </div>

            <div className="ops-inline-card">
              <span>Automação do dia</span>
              <div className="ops-inline-row">
                <strong>Modo atual</strong>
                <b>{data.supportingSignals.currentModeLabel}</b>
              </div>
              <div className="ops-inline-row">
                <strong>Fila viva</strong>
                <b>{data.summary.pending + data.summary.doing}</b>
              </div>
              <div className="ops-inline-row">
                <strong>Feitas</strong>
                <b>{data.summary.done}</b>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="ops-grid">
        <QueuePanel
          title="Em andamento"
          eyebrow="Operação"
          items={data.queue.doing}
          emptyText="Nenhuma task está em andamento agora."
          router={router}
          basePath={basePath}
          savingId={savingId}
          onStatusChange={handleStatusChange}
        />

        <section className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Concluídas</span>
              <h3>Baixas recentes da fila</h3>
            </div>
          </div>

          {data.queue.done.length ? (
            <div className="task-list">
              {data.queue.done.map((item) => (
                <TaskCard
                  key={item.id}
                  item={item}
                  router={router}
                  basePath={basePath}
                  savingId={savingId}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Nenhuma baixa registrada ainda.</p>
          )}
        </section>
      </section>
    </div>
  );
}
