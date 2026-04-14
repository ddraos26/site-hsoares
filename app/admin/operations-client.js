'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminJson, invalidateAdminJsonCache, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';
import {
  AutomationLogCard,
  CompletedHistoryCard,
  ExecutionStepper,
  FocusHeroCard,
  GuidedTaskCard,
  NextStepBanner,
  OperationalEngineAlert,
  OperationalEnginePanel,
  OperationalEngineTimeline,
  QuickActionButton,
  ResultFeedbackCard,
  SystemDidForYouCard
} from '@/components/admin/operational-ui';

function formatDateTime(value) {
  if (!value) return 'Agora';

  try {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Agora';
  }
}

function openResolvedHref(router, href, basePath) {
  if (!href) return;
  router.push(resolveDashboardHref(href, basePath));
}

function openExecutionTarget(router, item, basePath, preferGuide = false) {
  const targetHref = preferGuide ? item.guideHref || item.href : item.contextHref || item.href || item.guideHref;

  if (!targetHref) return;

  if ((preferGuide ? item.guideKind : item.guideKind) === 'external' && String(targetHref).startsWith('http')) {
    window.open(targetHref, '_blank', 'noopener,noreferrer');
    return;
  }

  openResolvedHref(router, targetHref, basePath);
}

function SectionShell({ eyebrow, title, description, children }) {
  return (
    <section className="ops-section-shell">
      <div className="ops-section-shell__head">
        <div>
          {eyebrow ? <span>{eyebrow}</span> : null}
          <h3>{title}</h3>
        </div>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }) {
  return <p className="dashboard-card-empty">{children}</p>;
}

function DailyActionCard({ index, item, onExecute, onContext }) {
  return (
    <article className="ops-daily-action-card">
      <div className="ops-daily-action-card__head">
        <div>
          <small>Ação {index}</small>
          <h4>{item.title}</h4>
        </div>
        <span>{item.estimatedTimeMin} min</span>
      </div>

      <div className="ops-daily-action-card__meta">
        <div>
          <small>Alvo</small>
          <strong>{item.target}</strong>
        </div>
        <div>
          <small>Onde fazer</small>
          <strong>{item.whereToDo}</strong>
        </div>
        <div>
          <small>Tempo estimado</small>
          <strong>{item.estimatedTimeMin} min</strong>
        </div>
      </div>

      <div className="ops-copy-block">
        <small>Motivo</small>
        <p>{item.reason}</p>
      </div>

      <div className="ops-copy-block ops-copy-block--highlight">
        <small>Impacto esperado</small>
        <p>{item.expectedImpact}</p>
      </div>

      <ExecutionStepper steps={item.steps} compact />

      <div className="ops-daily-action-card__actions">
        <QuickActionButton label={item.cta || 'Executar agora'} onClick={onExecute} />
        <QuickActionButton label="Abrir contexto" tone="ghost" onClick={onContext} />
      </div>
    </article>
  );
}

function RoutineLinesCard({ lines = [], stats = [], tone = 'default' }) {
  return (
    <article className={`ops-routine-brief ${tone !== 'default' ? `ops-routine-brief--${tone}` : ''}`}>
      <ul className="ops-routine-lines">
        {lines.map((line, index) => (
          <li key={`${index + 1}-${line}`}>{line}</li>
        ))}
      </ul>

      {stats.length ? (
        <div className="ops-routine-stats">
          {stats.map((item) => (
            <div key={item.label} className="ops-routine-stat">
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function DailyClosureCard({ item }) {
  if (!item) return null;

  return (
    <article className="ops-routine-brief ops-routine-brief--warm">
      <div className="ops-routine-closure">
        <h4>{item.headline}</h4>
        <p>{item.summary}</p>
      </div>

      <div className="ops-routine-stats">
        {(item.stats || []).map((stat) => (
          <div key={stat.label} className="ops-routine-stat">
            <small>{stat.label}</small>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function RadarCard({ item, onOpen }) {
  return (
    <article className="ops-radar-card">
      <div className="ops-radar-card__head">
        <div>
          <small>{item.sourceLabel}</small>
          <h4>{item.title}</h4>
        </div>
        <span>{item.signalLabel}</span>
      </div>
      <p>{item.reason}</p>
      <div className="ops-copy-block ops-copy-block--highlight">
        <small>Impacto potencial</small>
        <p>{item.expectedImpact}</p>
      </div>
      <QuickActionButton label="Ver contexto" tone="ghost" onClick={onOpen} />
    </article>
  );
}

function AutomationRuleCard({ item }) {
  return (
    <article className="ops-rule-card">
      <div className="ops-rule-card__head">
        <div>
          <small>Regra</small>
          <h4>{item.name}</h4>
        </div>
        <div className="ops-rule-card__badges">
          <span className={`ops-status-chip ${item.enabled ? 'ops-status-chip--done' : 'ops-status-chip--blocked'}`}>
            {item.enabled ? 'Ativa' : 'Pausada'}
          </span>
          <span className="ops-status-chip ops-status-chip--pending">{item.mode}</span>
        </div>
      </div>

      <div className="ops-copy-block">
        <small>Disparo</small>
        <p>{item.trigger}</p>
      </div>

      <div className="ops-copy-block">
        <small>Condição</small>
        <p>{item.conditionDescription}</p>
      </div>

      <div className="ops-copy-block ops-copy-block--highlight">
        <small>Ação</small>
        <p>{item.actionDescription}</p>
      </div>
    </article>
  );
}

function CompletionModal({ task, outcome, comment, onOutcomeChange, onCommentChange, onCancel, onConfirm, saving }) {
  if (!task) return null;

  return (
    <div className="ops-modal-backdrop" role="presentation">
      <div className="ops-modal" role="dialog" aria-modal="true" aria-labelledby="ops-complete-title">
        <div className="ops-modal__head">
          <div>
            <small>Finalizar tarefa</small>
            <h3 id="ops-complete-title">{task.title}</h3>
          </div>
        </div>

        <p className="ops-modal__description">Deu certo?</p>

        <div className="ops-modal__choices">
          {[
            ['yes', 'Sim'],
            ['partial', 'Parcial'],
            ['no', 'Não']
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`ops-modal__choice ${outcome === value ? 'is-active' : ''}`}
              onClick={() => onOutcomeChange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="ops-modal__field">
          <span>Comentário opcional</span>
          <textarea value={comment} onChange={(event) => onCommentChange(event.target.value)} rows={4} />
        </label>

        <div className="ops-modal__actions">
          <QuickActionButton label="Cancelar" tone="ghost" onClick={onCancel} disabled={saving} />
          <QuickActionButton label="Salvar e agendar leitura" onClick={onConfirm} disabled={saving} />
        </div>
      </div>
    </div>
  );
}

function ReopenModal({
  task,
  reason,
  priority,
  comment,
  onReasonChange,
  onPriorityChange,
  onCommentChange,
  onCancel,
  onConfirm,
  saving
}) {
  if (!task) return null;

  return (
    <div className="ops-modal-backdrop" role="presentation">
      <div className="ops-modal" role="dialog" aria-modal="true" aria-labelledby="ops-reopen-title">
        <div className="ops-modal__head">
          <div>
            <small>Reabrir tarefa</small>
            <h3 id="ops-reopen-title">{task.title}</h3>
          </div>
        </div>

        <p className="ops-modal__description">Qual o motivo da nova rodada?</p>

        <div className="ops-modal__choices">
          {[
            'não deu certo',
            'deu parcial',
            'quero testar nova abordagem',
            'ainda preciso mexer nisso'
          ].map((value) => (
            <button
              key={value}
              type="button"
              className={`ops-modal__choice ${reason === value ? 'is-active' : ''}`}
              onClick={() => onReasonChange(value)}
            >
              {value}
            </button>
          ))}
        </div>

        <label className="ops-modal__field">
          <span>Ajuste de prioridade</span>
          <select value={priority} onChange={(event) => onPriorityChange(event.target.value)}>
            <option value="">Manter prioridade atual</option>
            <option value="Urgente">Urgente</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </label>

        <label className="ops-modal__field">
          <span>Comentário opcional</span>
          <textarea value={comment} onChange={(event) => onCommentChange(event.target.value)} rows={4} />
        </label>

        <div className="ops-modal__actions">
          <QuickActionButton label="Cancelar" tone="ghost" onClick={onCancel} disabled={saving} />
          <QuickActionButton label="Criar nova rodada" onClick={onConfirm} disabled={saving} />
        </div>
      </div>
    </div>
  );
}

export default function OperationsClient({
  view = 'today',
  apiBase = '/api/dashboard',
  basePath = '/dashboard',
  initialData = null
}) {
  const router = useRouter();
  const endpoint = `${apiBase}/operations`;
  const tasksEndpoint = `${apiBase}/tasks`;
  const automationsEndpoint = `${apiBase}/automations`;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [engineRunning, setEngineRunning] = useState(false);
  const [engineLogOpen, setEngineLogOpen] = useState(view === 'automations');
  const [engineTechnicalMode, setEngineTechnicalMode] = useState(false);
  const [engineFilter, setEngineFilter] = useState('all');
  const [completionTask, setCompletionTask] = useState(null);
  const [completionOutcome, setCompletionOutcome] = useState('yes');
  const [completionComment, setCompletionComment] = useState('');
  const [reopenTask, setReopenTask] = useState(null);
  const [reopenReason, setReopenReason] = useState('não deu certo');
  const [reopenPriority, setReopenPriority] = useState('');
  const [reopenComment, setReopenComment] = useState('');

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAdminJson(endpoint, { ttlMs: 15_000 });
      if (response?.error) throw new Error(response.detail || response.error);
      setData(response);
    } catch (err) {
      setError(err.message || 'Falha ao carregar a operação guiada.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialData) {
      primeAdminJsonCache(endpoint, initialData, 15_000);
      setData(initialData);
      setLoading(false);
      return undefined;
    }

    void load();
    return undefined;
  }, [endpoint, initialData]);

  async function mutateTask(item, status, options = {}) {
    setSavingId(item.id);
    setError(null);

    try {
      const response = await fetchAdminJson(tasksEndpoint, {
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
            description: item.reason || item.raw?.description || '',
            recommendation: item.recommendation || item.raw?.recommendation || '',
            sourceType: item.raw?.sourceType || item.sourceType || '',
            sourceLabel: item.sourceLabel,
            targetType: item.targetType || item.raw?.targetType || '',
            targetId: item.targetId || item.raw?.targetId || '',
            targetLabel: item.targetLabel || item.raw?.targetLabel || '',
            href: item.href,
            whereToDo: item.whereToDo || item.raw?.whereToDo || '',
            guideSteps: item.guideSteps || item.raw?.guideSteps || [],
            metadata: item.raw?.metadata || [],
            requiresApproval: item.requiresApproval,
            ownerLabel: item.raw?.ownerLabel || item.actedBy || '',
            dueLabel: item.raw?.dueLabel || '',
            badges: item.badges || item.raw?.badges || [],
            priority: item.raw?.priority || item.priorityLabel || item.priority,
            isAutomatic: item.isAutomatic,
            automationMode: item.automationMode || '',
            sourceTaskId: item.sourceTaskId || null,
            reopenReason: options.reopenReason || '',
            reopenedFromResult: options.reopenedFromResult || '',
            priorityOverride: options.priorityOverride || '',
            payload: item.raw?.payload || {}
          })
        }
      });

      if (response?.error) {
        throw new Error(response.detail || response.error);
      }

      invalidateAdminJsonCache(endpoint);
      await load();
    } catch (err) {
      setError(err.message || 'Falha ao atualizar a tarefa.');
    } finally {
      setSavingId(null);
    }
  }

  async function runCycleNow() {
    setEngineRunning(true);
    setError(null);

    try {
      const response = await fetchAdminJson(automationsEndpoint, {
        fetchOptions: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'run-job-cycle' })
        }
      });

      if (response?.error) {
        throw new Error(response.detail || response.error);
      }

      invalidateAdminJsonCache(endpoint);
      await load();
    } catch (err) {
      setError(err.message || 'Falha ao rodar o ciclo agora.');
    } finally {
      setEngineRunning(false);
    }
  }

  const outcomesByTask = useMemo(
    () => new Map((data?.results?.items || []).map((item) => [item.taskId, item])),
    [data]
  );

  if (loading) return <EmptyState>Montando a operação guiada...</EmptyState>;
  if (error) return <p className="dashboard-error">{error}</p>;
  if (!data) return <EmptyState>Sem dados suficientes para a operação guiada.</EmptyState>;

  const heroTask = data.today.hero;
  const queueItems = data.queue.items || [];
  const inProgressItems = data.inProgress.items || [];
  const completedItems = data.completed.items || [];
  const radarItems = data.radar.items || [];
  const automationRules = data.automations.rules || [];
  const automationLogs = data.automations.logs || [];
  const engine = data.engine || null;
  const engineEvents = engine?.logs?.[engineFilter] || engine?.logs?.all || [];
  const today = data.today || {};
  const resultItems = data.results.items || [];
  const waitingResults = data.results.waiting || [];
  const resultGroups = data.results.groups || {
    waiting: resultItems.filter((item) => item.result === 'waiting'),
    improved: resultItems.filter((item) => item.result === 'positive'),
    neutral: resultItems.filter((item) => item.result === 'neutral'),
    worsened: resultItems.filter((item) => item.result === 'negative')
  };

  return (
    <>
      <div className="ops-workspace">
        <OperationalEngineAlert
          alert={engine?.alert}
          disabled={engineRunning}
          onDetails={() => {
            setEngineTechnicalMode(true);
            setEngineLogOpen(true);
          }}
          onRetry={() => runCycleNow()}
        />

        <OperationalEnginePanel
          engine={engine}
          running={engineRunning}
          logOpen={engineLogOpen}
          technicalMode={engineTechnicalMode}
          onRunNow={() => runCycleNow()}
          onToggleLog={() => setEngineLogOpen((value) => !value)}
          onToggleTechnical={() => setEngineTechnicalMode((value) => !value)}
        />

        <OperationalEngineTimeline
          open={engineLogOpen}
          events={engineEvents}
          filter={engineFilter}
          onFilterChange={setEngineFilter}
        />
      </div>

      {view === 'today' ? (
        <div className="ops-workspace">
          <FocusHeroCard
            hero={heroTask}
            onExecute={() => openExecutionTarget(router, heroTask, basePath, true)}
            onContext={() => openExecutionTarget(router, heroTask, basePath, false)}
          />

          <SectionShell
            eyebrow="Próximos 30 minutos"
            title="3 ações do dia"
            description="Só o que realmente merece energia agora. O resto fica fora da sua frente."
          >
            <div className="ops-daily-actions-grid">
              {(today.dailyActions || []).map((item, index) => (
                <DailyActionCard
                  key={item.id}
                  index={index + 1}
                  item={item}
                  onExecute={() => openExecutionTarget(router, item, basePath, true)}
                  onContext={() => openExecutionTarget(router, item, basePath, false)}
                />
              ))}
            </div>
          </SectionShell>

          <SectionShell
            eyebrow="Automações reais"
            title="O sistema agiu por você"
            description="Aqui ficam só os movimentos que já avançaram a operação sem te pedir interpretação manual."
          >
            {today.systemDid?.length ? (
              <div className="ops-system-grid">
                {today.systemDid.map((item) => (
                  <SystemDidForYouCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState>O motor ainda não registrou uma ação automática relevante neste recorte.</EmptyState>
            )}
          </SectionShell>

          <SectionShell
            eyebrow="Desde ontem"
            title="Resultado desde ontem"
            description="Aqui entra só a leitura curta do que melhorou, travou ou ainda pede paciência."
          >
            <RoutineLinesCard
              lines={today.recentOutcomeSummary?.lines || ['Ainda não houve retorno suficiente desde ontem para mudar o plano do dia.']}
              stats={[
                { label: 'Melhoraram', value: today.recentOutcomeSummary?.groups?.positive?.length || 0 },
                { label: 'Neutras', value: today.recentOutcomeSummary?.groups?.neutral?.length || 0 },
                { label: 'Pioraram', value: today.recentOutcomeSummary?.groups?.negative?.length || 0 },
                { label: 'Aguardando', value: today.recentOutcomeSummary?.groups?.waiting?.length || 0 }
              ]}
            />
          </SectionShell>

          <SectionShell
            eyebrow="Resumo de hoje"
            title="Fechamento do dia"
            description="Um fechamento curto para você sentir o que andou e o que ainda pede atenção."
          >
            <DailyClosureCard item={today.dailyClosure} />
          </SectionShell>

          <SectionShell
            eyebrow="Amanhã"
            title="Preparação de amanhã"
            description="A direção provável do próximo dia já fica clara antes da fila crescer de novo."
          >
            <RoutineLinesCard
              lines={today.nextDayPreview?.lines || ['Amanhã o foco provável continua em otimizar conversão das principais páginas.']}
              tone="cool"
            />
          </SectionShell>
        </div>
      ) : null}

      {view === 'queue' ? (
        <div className="ops-workspace">
          <NextStepBanner
            label="Fazer Agora"
            title={queueItems[0]?.title || 'Nada urgente na fila principal'}
            description={data.queue.helperText}
            actionLabel={queueItems[0] ? 'Abrir primeiro foco' : 'Ver Radar'}
            onAction={() => {
              if (queueItems[0]) {
                openExecutionTarget(router, queueItems[0], basePath, true);
                return;
              }

              openResolvedHref(router, '/dashboard/radar', basePath);
            }}
          />

          <SectionShell
            eyebrow="Ação humana"
            title="Só o que exige você agora"
            description="A fila principal para em 5 itens para não virar outra parede de cards."
          >
            {queueItems.length ? (
              <div className="ops-card-list">
                {queueItems.map((item) => (
                  <GuidedTaskCard
                    key={item.id}
                    item={item}
                    disabled={savingId === item.id}
                    onOpenContext={() => openExecutionTarget(router, item, basePath, false)}
                    onStart={() => mutateTask(item, 'in_progress', { note: 'Tarefa iniciada pelo admin.', actionType: 'started' })}
                    onMarkDone={() => {
                      setCompletionTask(item);
                      setCompletionOutcome('yes');
                      setCompletionComment('');
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState>Nada exige ação humana agora. O sistema limpou a frente principal.</EmptyState>
            )}
          </SectionShell>
        </div>
      ) : null}

      {view === 'in-progress' ? (
        <div className="ops-workspace">
          <NextStepBanner
            label="Execução"
            title={
              inProgressItems[0]
                ? `${inProgressItems.length} item(ns) já foram puxados para execução`
                : 'Nada está em andamento agora'
            }
            description={
              data.inProgress.stalledCount
                ? `${data.inProgress.stalledCount} item(ns) estão parados tempo demais e precisam de retomada.`
                : 'Essa tela existe para você não perder o que já começou.'
            }
          />

          <SectionShell
            eyebrow="Em andamento"
            title="O que já foi pego"
            description="Tudo o que saiu da fila principal e ainda não foi concluído vive aqui."
          >
            {inProgressItems.length ? (
              <div className="ops-card-list">
                {inProgressItems.map((item) => (
                  <GuidedTaskCard
                    key={item.id}
                    item={item}
                    mode="in-progress"
                    disabled={savingId === item.id}
                    onOpenContext={() => openExecutionTarget(router, item, basePath, false)}
                    onContinue={() => openExecutionTarget(router, item, basePath, true)}
                    onMarkDone={() => {
                      setCompletionTask(item);
                      setCompletionOutcome('yes');
                      setCompletionComment('');
                    }}
                    onBackToPending={() => mutateTask(item, 'pending', { note: 'Voltou para a fila principal.', actionType: 'reprioritized' })}
                  />
                ))}
              </div>
            ) : (
              <EmptyState>Nenhuma execução aberta agora.</EmptyState>
            )}
          </SectionShell>
        </div>
      ) : null}

      {view === 'completed' ? (
        <div className="ops-workspace">
          <SectionShell
            eyebrow="Progresso real"
            title="Feitos / Histórico"
            description="Tudo o que foi concluído sai da fila principal e fica aqui como memória operacional."
          >
            <div className="ops-history-groups">
              {[
                ['Feitos hoje', data.completed.groups.today],
                ['Feitos esta semana', data.completed.groups.week],
                ['Feitos este mês', data.completed.groups.month],
                ['Reabertos', data.completed.groups.reopened],
                ['Não deram certo', data.completed.groups.failed]
              ].map(([label, items]) => (
                <div key={label} className="ops-history-group">
                  <div className="ops-history-group__head">
                    <h4>{label}</h4>
                    <span>{items.length}</span>
                  </div>
                  {items.length ? (
                    <div className="ops-history-list">
                      {items.slice(0, 6).map((item) => (
                        <CompletedHistoryCard
                          key={`${label}-${item.id}`}
                          item={{ ...item, completedAt: formatDateTime(item.completedAt || item.actedAt || item.createdAt) }}
                          outcome={outcomesByTask.get(item.id)}
                          disabled={savingId === item.id}
                          onOpenContext={() => openExecutionTarget(router, item, basePath, false)}
                          onReopen={() => {
                            setReopenTask(item);
                            setReopenReason('não deu certo');
                            setReopenPriority('');
                            setReopenComment('');
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState>Nenhum item neste grupo ainda.</EmptyState>
                  )}
                </div>
              ))}
            </div>
          </SectionShell>
        </div>
      ) : null}

      {view === 'radar' ? (
        <div className="ops-workspace">
          <SectionShell
            eyebrow="Talvez depois"
            title="Oportunidades / Radar"
            description="O radar guarda o que é promissor, mas não merece poluir os próximos 30 minutos."
          >
            {radarItems.length ? (
              <div className="ops-radar-grid">
                {radarItems.map((item) => (
                  <RadarCard key={item.id} item={item} onOpen={() => openResolvedHref(router, item.href, basePath)} />
                ))}
              </div>
            ) : (
              <EmptyState>Sem itens estacionados no radar agora.</EmptyState>
            )}
          </SectionShell>
        </div>
      ) : null}

      {view === 'automations' ? (
        <div className="ops-workspace">
          <SectionShell
            eyebrow="Motor automático"
            title="Automações que fazem a operação andar"
            description="As regras abaixo transformam leitura em ação prática, com ou sem aprovação."
          >
            <div className="ops-rule-grid">
              {automationRules.map((item) => (
                <AutomationRuleCard key={item.id} item={item} />
              ))}
            </div>
          </SectionShell>

          <SectionShell
            eyebrow="Execuções recentes"
            title="O que já rodou sozinho"
            description="Quando a automação atua, ela aparece aqui com memória curta e objetiva."
          >
            {automationLogs.length ? (
              <div className="ops-automation-grid">
                {automationLogs.map((item) => (
                  <AutomationLogCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState>Sem execuções automáticas registradas neste recorte.</EmptyState>
            )}
          </SectionShell>
        </div>
      ) : null}

      {view === 'results' ? (
        <div className="ops-workspace">
          {[
            ['Aguardando leitura', resultGroups.waiting, 'Nem toda ação responde na hora. Essas já saíram da fila e estão esperando a janela certa.'],
            ['Melhoraram', resultGroups.improved, 'Aqui ficam as ações que já mostraram ganho perceptível.'],
            ['Neutras', resultGroups.neutral, 'Essas ações mexeram pouco ou ainda não provaram tração suficiente.'],
            ['Pioraram', resultGroups.worsened, 'Essas leituras pedem nova rodada guiada com mais clareza.']
          ].map(([label, items, description]) => (
            <SectionShell key={label} eyebrow="Before / After" title={label} description={description}>
              {items.length ? (
                <div className="ops-results-grid">
                  {items.map((item) => (
                    <ResultFeedbackCard
                      key={`${label}-${item.taskId}`}
                      item={{ ...item, completedAt: formatDateTime(item.completedAt) }}
                      disabled={savingId === item.taskId}
                      onOpenContext={() => openResolvedHref(router, item.contextHref || item.href, basePath)}
                      onReopen={() => {
                        const sourceTask = completedItems.find((candidate) => candidate.id === item.taskId) || waitingResults.find((candidate) => candidate.id === item.taskId);
                        if (!sourceTask) return;

                        setReopenTask(sourceTask);
                        setReopenReason(item.result === 'negative' ? 'não deu certo' : 'deu parcial');
                        setReopenPriority('');
                        setReopenComment('');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState>Nenhum item neste grupo agora.</EmptyState>
              )}
            </SectionShell>
          ))}
        </div>
      ) : null}

      <CompletionModal
        task={completionTask}
        outcome={completionOutcome}
        comment={completionComment}
        saving={savingId === completionTask?.id}
        onOutcomeChange={setCompletionOutcome}
        onCommentChange={setCompletionComment}
        onCancel={() => setCompletionTask(null)}
        onConfirm={async () => {
          if (!completionTask) return;

          await mutateTask(completionTask, 'done', {
            note: completionComment || 'Tarefa concluída pelo admin.',
            actionType: 'completed',
            outcome: completionOutcome
          });

          setCompletionTask(null);
          setCompletionComment('');
          setCompletionOutcome('yes');
        }}
      />

      <ReopenModal
        task={reopenTask}
        reason={reopenReason}
        priority={reopenPriority}
        comment={reopenComment}
        saving={savingId === reopenTask?.id}
        onReasonChange={setReopenReason}
        onPriorityChange={setReopenPriority}
        onCommentChange={setReopenComment}
        onCancel={() => setReopenTask(null)}
        onConfirm={async () => {
          if (!reopenTask) return;

          const outcome = outcomesByTask.get(reopenTask.id);
          await mutateTask(reopenTask, 'reopened', {
            note: reopenComment || `Nova rodada aberta: ${reopenReason}.`,
            actionType: 'reopened',
            reopenReason,
            reopenedFromResult: outcome?.result === 'negative' ? 'negative' : outcome?.result === 'neutral' ? 'neutral' : 'manual',
            priorityOverride: reopenPriority
          });

          setReopenTask(null);
          setReopenReason('não deu certo');
          setReopenPriority('');
          setReopenComment('');
        }}
      />
    </>
  );
}
