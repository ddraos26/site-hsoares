import { formatDateTime } from '@/lib/admin/history-overview';

export function HistoryPanels({ data, basePath = '/admin' }) {
  const timeline = data.timeline || [];
  const summary = data.summary || {};

  return (
    <div className="cockpit-shell">
      <section className="ops-hero ops-hero--mission">
        <div className="ops-hero-main">
          <p className="eyebrow">Histórico operacional</p>
          <h3>O admin agora guarda memória real do que foi sugerido, decidido e acompanhado</h3>
          <p>
            Essa área consolida movimentações de leads, tarefas, aprovações, registros do sistema e saúde operacional para você revisar o que já aconteceu e o que ainda merece atenção.
          </p>
        </div>

        <aside className="ops-focus-card">
          <span>Saúde de integração</span>
          <strong>{data.integrations.stageLabel}</strong>
          <p>{data.integrations.stageDescription}</p>
          <div className="ops-focus-meta">
            <div>
              <small>Leads</small>
              <b>{summary.leadMovements || 0}</b>
            </div>
            <div>
              <small>Tasks</small>
              <b>{summary.taskMovements || 0}</b>
            </div>
            <div>
              <small>Aprovações</small>
              <b>{summary.approvals || 0}</b>
            </div>
          </div>
        </aside>
      </section>

      <section className="ops-metric-grid">
        <article className="ops-metric-card ops-metric-card--premium">
          <span>Movimentos de leads</span>
          <strong>{summary.leadMovements || 0}</strong>
          <small>Eventos operacionais recentes registrados no banco.</small>
        </article>
        <article className="ops-metric-card ops-metric-card--warning">
          <span>Tasks rastreadas</span>
          <strong>{summary.taskMovements || 0}</strong>
          <small>Últimos estados persistidos da fila do dia.</small>
        </article>
        <article className="ops-metric-card ops-metric-card--success">
          <span>Aprovações</span>
          <strong>{summary.approvals || 0}</strong>
          <small>Decisões já guardadas com histórico.</small>
        </article>
        <article className="ops-metric-card ops-metric-card--blue">
          <span>Registros do sistema</span>
          <strong>{summary.automationRuns || 0}</strong>
          <small>Registros recentes de jobs, regras e acompanhamentos.</small>
        </article>
        <article className="ops-metric-card ops-metric-card--premium">
          <span>Jobs do sistema</span>
          <strong>{summary.jobs || 0}</strong>
          <small>Rotinas persistidas de missão, fila e revisão.</small>
        </article>
        <article className="ops-metric-card ops-metric-card--warning">
          <span>Reviews abertas</span>
          <strong>{summary.reviewBacklog || 0}</strong>
          <small>Sugestões acompanhadas para medir impacto.</small>
        </article>
        <article className="ops-metric-card ops-metric-card--success">
          <span>Deu certo</span>
          <strong>{summary.successfulFeedbacks || 0}</strong>
          <small>Ações que você confirmou que funcionaram.</small>
        </article>
        <article className="ops-metric-card ops-metric-card--warning">
          <span>Nao deu certo</span>
          <strong>{summary.failedFeedbacks || 0}</strong>
          <small>Ações que precisam ser revistas.</small>
        </article>
        <article className="ops-metric-card ops-metric-card--blue">
          <span>Ideias rejeitadas</span>
          <strong>{summary.rejectedIdeas || 0}</strong>
          <small>Recomendações que você decidiu não seguir.</small>
        </article>
      </section>

      <section className="ops-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Motor recorrente</span>
              <h3>Jobs e ciclos do sistema</h3>
            </div>
          </div>
          {data.jobRuns.length ? (
            <div className="task-history-list">
              {data.jobRuns.map((item) => (
                <a key={item.id} className="task-history-row admin-actionable-card" href={`${basePath}/automacoes`}>
                  <div>
                    <strong>{item.jobKey}</strong>
                    <small>{item.summary || 'Job concluído sem detalhe adicional.'}</small>
                  </div>
                  <small>{item.status} · {formatDateTime(item.finishedAt || item.startedAt)}</small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Os próximos ciclos registrados aparecerão aqui.</p>
          )}
        </article>

        <article className="ops-panel ops-panel--soft">
          <div className="ops-panel-head">
            <div>
              <span>Cadeia da sugestão</span>
              <h3>Decisão, registro e revisão</h3>
            </div>
          </div>
          {data.executionChains.length ? (
            <div className="task-history-list">
              {data.executionChains.map((item) => (
                <a key={item.id} className="task-history-row admin-actionable-card" href={item.href || `${basePath}/automacoes`}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                    <small>{item.operationStatus} · {item.reviewLabel}</small>
                  </div>
                  <small>{formatDateTime(item.createdAt)}</small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">As próximas cadeias de sugestão aparecerão aqui com memória completa.</p>
          )}
        </article>
      </section>

      <section className="ops-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Timeline</span>
              <h3>Últimos movimentos do sistema</h3>
            </div>
          </div>

          {timeline.length ? (
            <div className="task-history-list">
              {timeline.map((item) => (
                <a key={item.id} className="task-history-row admin-actionable-card" href={item.href || `${basePath}/historico`}>
                  <div>
                    <strong>{item.eyebrow} · {item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                  <small>{formatDateTime(item.createdAt)}</small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Ainda não há eventos relevantes no histórico.</p>
          )}
        </article>

        <article className="ops-panel ops-panel--soft">
          <div className="ops-panel-head">
            <div>
              <span>Missões recentes</span>
              <h3>Resumo do que já foi priorizado</h3>
            </div>
          </div>

          {data.missions.length ? (
            <div className="task-history-list">
              {data.missions.map((item) => (
                <div key={item.id} className="task-history-row">
                  <div>
                    <strong>{item.topPriority || 'Missão registrada'}</strong>
                    <small>{item.summary}</small>
                  </div>
                  <small>{formatDateTime(item.createdAt)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">As próximas missões aparecerão aqui assim que forem geradas.</p>
          )}
        </article>
      </section>

      <section className="ops-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Fila decidida</span>
              <h3>Aprovações com memória</h3>
            </div>
          </div>
          {data.latestApprovals.length ? (
            <div className="task-history-list">
              {data.latestApprovals.map((item) => (
                <div key={`${item.id}-${item.createdAt}`} className="task-history-row">
                  <div>
                    <strong>{item.title || 'Aprovação registrada'}</strong>
                    <small>{item.executionDetail || item.rationale || 'Sem justificativa adicional.'}</small>
                  </div>
                  <small>{item.status === 'approved' ? 'Aprovada' : 'Rejeitada'} · {formatDateTime(item.createdAt)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Nenhuma aprovação registrada ainda.</p>
          )}
        </article>

        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Fila executada</span>
              <h3>Estados recentes das tasks</h3>
            </div>
          </div>
          {data.latestTasks.length ? (
            <div className="task-history-list">
              {data.latestTasks.map((item) => (
                <a key={`${item.id}-${item.createdAt}`} className="task-history-row admin-actionable-card" href={item.href || `${basePath}/tasks`}>
                  <div>
                    <strong>{item.title || 'Task registrada'}</strong>
                    <small>{item.note || 'Sem detalhe adicional.'}</small>
                  </div>
                  <small>
                    {item.actionType === 'rejected'
                      ? 'ideia rejeitada'
                      : item.actionType === 'feedback'
                        ? item.outcome === 'yes'
                          ? 'deu certo'
                          : 'nao deu certo'
                        : item.status === 'done'
                          ? 'feito'
                          : item.status}
                    {' · '}
                    {formatDateTime(item.createdAt)}
                  </small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Nenhuma task persistida ainda.</p>
          )}
        </article>
      </section>

      <section className="ops-grid">
        <article className="ops-panel ops-panel--soft">
          <div className="ops-panel-head">
            <div>
              <span>Operações prontas</span>
              <h3>Pacotes de contexto e handoff</h3>
            </div>
          </div>
          {data.operations?.items?.length ? (
            <div className="task-history-list">
              {data.operations.items.slice(0, 8).map((item) => (
                <a
                  key={item.id}
                  className="task-history-row admin-actionable-card"
                  href={item.contextHref || item.operationHref || `${basePath}/automacoes`}
                >
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {item.dispatchPacket?.connectorStatusLabel || item.statusLabel} · {item.dispatchPacket?.command || item.executionModeLabel}
                    </small>
                    <small>{item.dispatchPacket?.handoffText || item.description}</small>
                  </div>
                  <small>{formatDateTime(item.updatedAt || item.createdAt)}</small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">As próximas operações prontas aparecerão aqui assim que surgirem.</p>
          )}
        </article>
      </section>
    </div>
  );
}

export function LogsPanels({ data, basePath = '/dashboard' }) {
  const pendingIntegrations = data.integrationHealth.pending || [];

  return (
    <div className="cockpit-shell">
      <section className="ops-hero ops-hero--campaigns">
        <div className="ops-hero-main">
          <p className="eyebrow">Logs técnicos</p>
          <h3>Saúde de integrações, uso de IA e registros do sistema em um lugar só</h3>
          <p>
            Essa área deixa o admin menos “mágico” e mais confiável: você enxerga onde o sistema só leu, onde ele só organizou contexto, onde a IA consumiu custo e o que ainda está pendente de integração.
          </p>
        </div>

        <aside className="ops-focus-card">
          <span>Stage atual</span>
          <strong>{data.integrationHealth.stageLabel}</strong>
          <p>{data.integrationHealth.stageDescription}</p>
          <div className="ops-focus-meta">
            <div>
              <small>Integrações pendentes</small>
              <b>{pendingIntegrations.length}</b>
            </div>
            <div>
              <small>Registros</small>
              <b>{data.automationRuns.length}</b>
            </div>
            <div>
              <small>Chamadas IA</small>
              <b>{data.aiUsage.length}</b>
            </div>
          </div>
        </aside>
      </section>

      <section className="ops-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Integrações</span>
              <h3>O que ainda pede ligação ou revisão</h3>
            </div>
          </div>
          {pendingIntegrations.length ? (
            <div className="task-history-list">
              {pendingIntegrations.map((item) => (
                <a key={item.key} className="task-history-row admin-actionable-card" href={`${basePath}/settings`}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.nextAction || item.reason}</small>
                  </div>
                  <small>{item.statusLabel}</small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Nenhuma integração crítica pendente agora.</p>
          )}
        </article>

        <article className="ops-panel ops-panel--soft">
          <div className="ops-panel-head">
            <div>
              <span>AI usage</span>
              <h3>Uso recente de IA</h3>
            </div>
          </div>
          {data.aiUsage.length ? (
            <div className="task-history-list">
              {data.aiUsage.map((item) => (
                <a key={item.id} className="task-history-row admin-actionable-card" href={`${basePath}/settings/ai-budget`}>
                  <div>
                    <strong>{item.workflow}</strong>
                    <small>{item.model} · modo {item.mode}</small>
                  </div>
                  <small>R$ {Number(item.estimatedCost || 0).toFixed(2)} · {formatDateTime(item.createdAt)}</small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Sem chamadas de IA recentes neste ambiente.</p>
          )}
        </article>
      </section>

      <section className="ops-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Registros</span>
              <h3>Movimentos recentes do sistema</h3>
            </div>
          </div>
          {data.automationRuns.length ? (
            <div className="task-history-list">
              {data.automationRuns.map((item) => (
                <a key={item.id} className="task-history-row admin-actionable-card" href={`${basePath}/automations`}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                  <small>{item.status} · {formatDateTime(item.createdAt)}</small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Sem registros persistidos ainda.</p>
          )}
        </article>

        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Jobs</span>
              <h3>Rotinas recentes do sistema</h3>
            </div>
          </div>
          {data.jobRuns.length ? (
            <div className="task-history-list">
              {data.jobRuns.map((item) => (
                <a key={item.id} className="task-history-row admin-actionable-card" href={`${basePath}/automations`}>
                  <div>
                    <strong>{item.jobKey}</strong>
                    <small>{item.summary || 'Job concluído sem detalhe adicional.'}</small>
                  </div>
                  <small>{item.status} · {formatDateTime(item.finishedAt || item.startedAt)}</small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Sem jobs recentes neste ambiente.</p>
          )}
        </article>
      </section>

      <section className="ops-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Revisões</span>
              <h3>Impacto após a sugestão</h3>
            </div>
          </div>
          {data.executionChains.length ? (
            <div className="task-history-list">
              {data.executionChains.map((item) => (
                <a key={item.id} className="task-history-row admin-actionable-card" href={item.href || `${basePath}/history`}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.reviewLabel}</small>
                    <small>{item.reviewNote || item.detail}</small>
                  </div>
                  <small>{formatDateTime(item.createdAt)}</small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Sem revisões em aberto.</p>
          )}
        </article>

        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Leads</span>
              <h3>Atividade operacional recente</h3>
            </div>
          </div>
          {data.leadActivities.length ? (
            <div className="task-history-list">
              {data.leadActivities.map((item) => (
                <a key={item.id} className="task-history-row admin-actionable-card" href={`${basePath}/leads?lead=${encodeURIComponent(item.leadId)}`}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.detail || 'Movimento operacional registrado.'}</small>
                  </div>
                  <small>{formatDateTime(item.createdAt)}</small>
                </a>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Sem atividade de lead recente.</p>
          )}
        </article>
      </section>
    </div>
  );
}
