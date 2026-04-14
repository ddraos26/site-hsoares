function cx(...values) {
  return values.filter(Boolean).join(' ');
}

function formatRelativeTime(value) {
  if (!value) return '-';

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return '-';

  const diffMs = parsed - Date.now();
  const diffMinutes = Math.round(diffMs / (60 * 1000));

  if (Math.abs(diffMinutes) < 1) return 'agora';
  if (Math.abs(diffMinutes) < 60) return diffMinutes > 0 ? `em ~${diffMinutes} min` : `${Math.abs(diffMinutes)} min atrás`;

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return diffHours > 0 ? `em ~${diffHours} h` : `${Math.abs(diffHours)} h atrás`;

  const diffDays = Math.round(diffHours / 24);
  return diffDays > 0 ? `em ~${diffDays} d` : `${Math.abs(diffDays)} d atrás`;
}

function formatDurationMs(value) {
  const durationMs = Number(value || 0);
  if (!durationMs) return '-';
  if (durationMs >= 1000) return `${(durationMs / 1000).toFixed(1)}s`;
  return `${durationMs}ms`;
}

function formatMetricValue(key, value) {
  if (value == null || Number.isNaN(Number(value))) return null;

  if (key === 'conversionRate' || key === 'ctr') {
    return `${Number(value).toFixed(2)}%`;
  }

  if (key === 'spend' || key === 'cpl') {
    return `R$ ${Number(value).toFixed(2)}`;
  }

  return String(Number(value));
}

function collectMetrics(snapshot = {}) {
  const labels = {
    visits: 'Visitas',
    clicks: 'Cliques',
    leads: 'Leads',
    conversionRate: 'Conv.',
    ctr: 'CTR',
    spend: 'Invest.',
    cpl: 'CPL'
  };

  return ['visits', 'clicks', 'leads', 'conversionRate', 'ctr', 'spend', 'cpl']
    .map((key) => {
      const value = formatMetricValue(key, snapshot?.[key]);
      if (value == null) return null;

      return {
        key,
        label: labels[key],
        value
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

export function PriorityBadge({ priority = 'media' }) {
  return <span className={cx('ops-priority-badge', `ops-priority-badge--${priority}`)}>{priority.toUpperCase()}</span>;
}

export function QuickActionButton({ label, tone = 'primary', onClick, disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      className={cx('button', tone === 'primary' ? 'button--primary' : 'button--ghost', `ops-quick-action--${tone}`)}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function EngineStatusBadge({ status = 'healthy' }) {
  const label =
    {
      healthy: 'Saudável',
      delayed: 'Atrasado',
      failed: 'Falhou',
      running: 'Executando'
    }[status] || 'Saudável';

  return <span className={cx('ops-engine-status', `ops-engine-status--${status}`)}>{label}</span>;
}

export function ExecutionStepper({ steps = [], compact = false }) {
  if (!steps.length) return null;

  const visibleSteps = compact ? steps.slice(0, 3) : steps;

  return (
    <ol className={cx('ops-stepper', compact && 'ops-stepper--compact')}>
      {visibleSteps.map((step, index) => (
        <li key={`${index + 1}-${step}`}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <p>{step}</p>
        </li>
      ))}
    </ol>
  );
}

function BadgeRow({ badges = [] }) {
  if (!badges.length) return null;

  return (
    <div className="ops-badge-row">
      {badges.map((badge) => (
        <span key={`${badge.key}-${badge.label}`} className={cx('ops-inline-badge', `ops-inline-badge--${badge.tone || 'premium'}`)}>
          {badge.label}
        </span>
      ))}
    </div>
  );
}

export function FocusHeroCard({ hero, onExecute, onContext }) {
  if (!hero) return null;

  return (
    <section className="ops-focus-hero">
      <div className="ops-focus-hero__main">
        <p className="eyebrow">Hoje</p>
        <div className="ops-focus-hero__meta">
          <span className="ops-kicker">{hero.actionLabel}</span>
          <span>{hero.targetLabel}</span>
        </div>
        <h3>{hero.title}</h3>
        <p>{hero.reason}</p>

        <div className="ops-focus-hero__impact">
          <small>Impacto esperado</small>
          <strong>{hero.expectedImpact}</strong>
        </div>

        <div className="ops-focus-hero__actions">
          <QuickActionButton label="Executar Agora" onClick={onExecute} />
          <QuickActionButton label="Ver Contexto" tone="ghost" onClick={onContext} />
        </div>
      </div>
    </section>
  );
}

export function NextStepBanner({ label = 'Próximo passo', title, description, actionLabel, onAction }) {
  if (!title) return null;

  return (
    <section className="ops-next-banner">
      <div>
        <small>{label}</small>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      {actionLabel && onAction ? <QuickActionButton label={actionLabel} onClick={onAction} /> : null}
    </section>
  );
}

export function GuidedTaskCard({
  item,
  mode = 'queue',
  onOpenContext,
  onStart,
  onMarkDone,
  onContinue,
  onBackToPending,
  disabled = false
}) {
  const isInProgress = mode === 'in-progress';

  return (
    <article className={cx('ops-guided-card', item.isStalled && 'ops-guided-card--stalled')}>
      <div className="ops-guided-card__head">
        <div>
          <small>{item.sourceLabel}</small>
          <h4>{item.title}</h4>
        </div>
        <div className="ops-guided-card__badges">
          <PriorityBadge priority={item.priority} />
          <span className={cx('ops-status-chip', `ops-status-chip--${item.status}`)}>{item.statusLabel}</span>
        </div>
      </div>

      <BadgeRow badges={item.badges} />

      <div className="ops-guided-card__grid">
        <div>
          <small>Alvo</small>
          <strong>{item.targetLabel}</strong>
        </div>
        <div>
          <small>Tipo</small>
          <strong>{item.actionHeadline}</strong>
        </div>
        <div>
          <small>Onde fazer</small>
          <strong>{item.whereToDo}</strong>
        </div>
        <div>
          <small>Releitura</small>
          <strong>{item.recheckAfterHours}h</strong>
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

      <ExecutionStepper steps={item.guideSteps} compact />

      <div className="ops-guided-card__footer">
        <div className="ops-guided-card__notes">
          <small>Critério de sucesso</small>
          <strong>{item.successCriteria}</strong>
          {item.isStalled ? <p>Essa ação está parada há {item.stalledHours}h.</p> : null}
        </div>

        <div className="ops-guided-card__actions">
          {onOpenContext ? <QuickActionButton label="Abrir Contexto" tone="ghost" onClick={onOpenContext} disabled={disabled} /> : null}
          {!isInProgress && onStart ? <QuickActionButton label="Iniciar" tone="ghost" onClick={onStart} disabled={disabled} /> : null}
          {isInProgress && onContinue ? <QuickActionButton label="Continuar" tone="ghost" onClick={onContinue} disabled={disabled} /> : null}
          {onMarkDone ? <QuickActionButton label="Marcar como Feito" onClick={onMarkDone} disabled={disabled} /> : null}
          {isInProgress && onBackToPending ? <QuickActionButton label="Voltar para Pendente" tone="ghost" onClick={onBackToPending} disabled={disabled} /> : null}
        </div>
      </div>
    </article>
  );
}

export function ResultFeedbackCard({ item, onOpenContext, onReopen, disabled = false }) {
  const beforeMetrics = collectMetrics(item.before);
  const afterMetrics = collectMetrics(item.after);

  return (
    <article className={cx('ops-result-card', `ops-result-card--${item.tone || 'premium'}`)}>
      <div className="ops-result-card__head">
        <div>
          <small>Resultado inicial</small>
          <h4>{item.title}</h4>
        </div>
        <span className={cx('ops-result-chip', `ops-result-chip--${item.result || 'neutral'}`)}>
          {item.result === 'waiting'
            ? 'Aguardando'
            : item.result === 'positive'
              ? 'Positivo'
              : item.result === 'negative'
                ? 'Negativo'
                : 'Neutro'}
        </span>
      </div>

      <BadgeRow badges={item.badges} />

      <p>{item.summary}</p>

      <div className="ops-result-card__meta">
        <div>
          <small>Onde foi executado</small>
          <strong>{item.whereToDo}</strong>
        </div>
        <div>
          <small>Registrado em</small>
          <strong>{item.completedAt}</strong>
        </div>
      </div>

      {(beforeMetrics.length || afterMetrics.length) ? (
        <div className="ops-result-card__comparison">
          <div className="ops-copy-block">
            <small>Before</small>
            {beforeMetrics.length ? (
              <div className="ops-metric-grid">
                {beforeMetrics.map((metric) => (
                  <div key={`before-${metric.key}`}>
                    <small>{metric.label}</small>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p>Sem snapshot anterior suficiente.</p>
            )}
          </div>

          <div className="ops-copy-block ops-copy-block--highlight">
            <small>After</small>
            {afterMetrics.length ? (
              <div className="ops-metric-grid">
                {afterMetrics.map((metric) => (
                  <div key={`after-${metric.key}`}>
                    <small>{metric.label}</small>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p>A leitura posterior ainda não ficou pronta.</p>
            )}
          </div>
        </div>
      ) : null}

      {item.nextRecommendation ? (
        <div className="ops-copy-block">
          <small>Próxima recomendação</small>
          <p>{item.nextRecommendation}</p>
        </div>
      ) : null}

      {(onOpenContext || onReopen) ? (
        <div className="ops-history-card__actions">
          {onOpenContext ? <QuickActionButton label="Ver Contexto" tone="ghost" onClick={onOpenContext} disabled={disabled} /> : null}
          {onReopen ? <ReopenTaskButton onClick={onReopen} disabled={disabled} /> : null}
        </div>
      ) : null}
    </article>
  );
}

export function AutomationLogCard({ item }) {
  return (
    <article className={cx('ops-automation-card', `ops-automation-card--${item.tone || 'premium'}`)}>
      <div className="ops-automation-card__head">
        <small>{item.source === 'manual' ? 'Ação manual' : 'Execução do sistema'}</small>
        <span>{item.impact || item.status}</span>
      </div>
      <h4>{item.title || item.message}</h4>
      <p>{item.detail || item.message}</p>
      <strong>{formatRelativeTime(item.createdAt)}</strong>
    </article>
  );
}

export function ReopenTaskButton({ onClick, disabled = false }) {
  return <QuickActionButton label="Reabrir" tone="ghost" onClick={onClick} disabled={disabled} />;
}

export function CompletedHistoryCard({ item, outcome, onOpenContext, onReopen, disabled = false }) {
  return (
    <article className="ops-history-card">
      <div className="ops-history-card__head">
        <div>
          <small>{item.sourceLabel}</small>
          <h4>{item.title}</h4>
        </div>
        <PriorityBadge priority={item.priority} />
      </div>

      <BadgeRow badges={item.badges} />

      <div className="ops-history-card__meta">
        <div>
          <small>Quando foi feito</small>
          <strong>{item.completedAt || item.actedAt || item.createdAt}</strong>
        </div>
        <div>
          <small>Onde foi executado</small>
          <strong>{item.whereToDo}</strong>
        </div>
      </div>

      <div className="ops-copy-block">
        <small>Qual era o problema</small>
        <p>{item.reason}</p>
      </div>

      <div className="ops-copy-block">
        <small>Qual ação foi tomada</small>
        <p>{item.expectedImpact}</p>
      </div>

      {outcome ? (
        <div className="ops-copy-block ops-copy-block--highlight">
          <small>Resultado inicial</small>
          <p>{outcome.summary}</p>
        </div>
      ) : null}

      <div className="ops-history-card__actions">
        {onOpenContext ? <QuickActionButton label="Abrir Contexto" tone="ghost" onClick={onOpenContext} disabled={disabled} /> : null}
        {onReopen ? <ReopenTaskButton onClick={onReopen} disabled={disabled} /> : null}
      </div>
    </article>
  );
}

export function SystemDidForYouCard({ item }) {
  return (
    <article className={cx('ops-system-card', `ops-system-card--${item.tone || 'premium'}`)}>
      <small>O sistema já fez por você</small>
      <h4>{item.title}</h4>
      <p>{item.description}</p>
      <strong>{item.statusLabel}</strong>
    </article>
  );
}

export function OperationalEngineAlert({ alert, onDetails, onRetry, disabled = false }) {
  if (!alert) return null;

  return (
    <section className={cx('ops-engine-alert', `ops-engine-alert--${alert.tone || 'warning'}`)}>
      <div>
        <strong>{alert.title}</strong>
        <p>{alert.description}</p>
      </div>
      <div className="ops-engine-alert__actions">
        {onDetails ? <QuickActionButton label={alert.actionLabel || 'Ver detalhes'} tone="ghost" onClick={onDetails} disabled={disabled} /> : null}
        {onRetry ? <QuickActionButton label={alert.retryLabel || 'Rodar novamente'} onClick={onRetry} disabled={disabled} /> : null}
      </div>
    </section>
  );
}

export function OperationalEnginePanel({
  engine,
  onRunNow,
  onToggleLog,
  onToggleTechnical,
  logOpen = false,
  technicalMode = false,
  running = false,
  disabled = false
}) {
  if (!engine) return null;

  return (
    <section className="ops-engine-panel">
      <div className="ops-engine-panel__head">
        <div>
          <small>Motor Operacional</small>
          <div className="ops-engine-panel__status">
            <h3>Motor Operacional</h3>
            <EngineStatusBadge status={running ? 'running' : engine.status} />
          </div>
        </div>

        <div className="ops-engine-panel__actions">
          <QuickActionButton
            label={running ? 'Rodando...' : 'Rodar ciclo agora'}
            onClick={onRunNow}
            disabled={disabled || running}
          />
          <QuickActionButton label={logOpen ? 'Ocultar log' : 'Mostrar log'} tone="ghost" onClick={onToggleLog} />
          <QuickActionButton label={technicalMode ? 'Ocultar técnico' : 'Modo técnico'} tone="ghost" onClick={onToggleTechnical} />
        </div>
      </div>

      <div className="ops-engine-panel__grid">
        <div>
          <small>Status</small>
          <strong>{running ? 'Executando agora' : engine.status === 'healthy' ? 'Saudável' : engine.status === 'delayed' ? 'Atrasado' : engine.status === 'failed' ? 'Falhou' : 'Executando'}</strong>
        </div>
        <div>
          <small>Última execução</small>
          <strong>{formatRelativeTime(engine.lastRunAt)}</strong>
        </div>
        <div>
          <small>Próxima execução</small>
          <strong>{formatRelativeTime(engine.nextScheduledRunAt)}</strong>
        </div>
        <div>
          <small>Tempo de execução</small>
          <strong>{formatDurationMs(engine.durationMs)}</strong>
        </div>
        <div>
          <small>Tasks criadas</small>
          <strong>{engine.tasksCreatedLastRun || 0}</strong>
        </div>
        <div>
          <small>Automações executadas</small>
          <strong>{engine.automationsExecutedLastRun || 0}</strong>
        </div>
        <div>
          <small>Releituras feitas</small>
          <strong>{engine.rechecksCompletedLastRun || 0}</strong>
        </div>
        <div>
          <small>Erros no último ciclo</small>
          <strong>{engine.errorsLastRun || 0}</strong>
        </div>
      </div>

      {technicalMode ? (
        <div className="ops-engine-debug">
          <div className="ops-copy-block">
            <small>Etapas do último ciclo</small>
            {(engine.debug?.steps || []).length ? (
              <div className="ops-engine-debug__list">
                {engine.debug.steps.map((step) => (
                  <div key={`${step.jobKey}-${step.label}`} className="ops-engine-debug__item">
                    <strong>{step.label}</strong>
                    <span>{step.status}</span>
                    <span>{formatDurationMs(step.durationMs)}</span>
                    <p>{step.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>Sem detalhes técnicos salvos para o último ciclo.</p>
            )}
          </div>

          <div className="ops-copy-block">
            <small>Regras avaliadas</small>
            {(engine.debug?.rules || []).length ? (
              <div className="ops-engine-debug__list">
                {engine.debug.rules.map((rule) => (
                  <div key={rule.id} className="ops-engine-debug__item">
                    <strong>{rule.label}</strong>
                    <p>
                      avaliadas {rule.evaluated} · candidatas {rule.candidates} · criadas {rule.created} · executadas {rule.executed} · ignoradas {rule.skipped} · erros {rule.errors}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>Sem regras detalhadas neste recorte.</p>
            )}
          </div>

          <div className="ops-copy-block">
            <small>Ignoradas e deduplicações</small>
            {(engine.debug?.ignored || []).length || (engine.debug?.deduplications || []).length ? (
              <div className="ops-engine-debug__list">
                {(engine.debug.ignored || []).map((item, index) => (
                  <div key={`ignored-${index + 1}`} className="ops-engine-debug__item">
                    <strong>{item.label}</strong>
                    <p>{item.reason}</p>
                  </div>
                ))}
                {(engine.debug.deduplications || []).map((item, index) => (
                  <div key={`dedupe-${index + 1}`} className="ops-engine-debug__item">
                    <strong>{item.label || item.targetId}</strong>
                    <p>{item.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>Nenhuma deduplicação ou regra ignorada relevante no último ciclo.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function OperationalEngineTimeline({
  events = [],
  filter = 'all',
  onFilterChange,
  open = false
}) {
  if (!open) return null;

  return (
    <section className="ops-engine-timeline">
      <div className="ops-engine-timeline__head">
        <div>
          <small>Log do motor</small>
          <h3>O que o sistema fez</h3>
        </div>
        <div className="ops-engine-timeline__filters">
          {[
            ['all', 'Tudo'],
            ['automations', 'Automações'],
            ['tasks', 'Tasks'],
            ['results', 'Resultados'],
            ['errors', 'Erros']
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={cx('ops-engine-filter', filter === value && 'is-active')}
              onClick={() => onFilterChange?.(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {events.length ? (
        <div className="ops-engine-timeline__list">
          {events.map((item) => (
            <article key={item.id} className={cx('ops-engine-event', `ops-engine-event--${item.tone || 'premium'}`)}>
              <div className="ops-engine-event__head">
                <p>{item.message}</p>
                <strong>{formatRelativeTime(item.createdAt)}</strong>
              </div>
              <div className="ops-badge-row">
                <span className={cx('ops-inline-badge', `ops-inline-badge--${item.impact === 'high' ? 'danger' : item.impact === 'medium' ? 'warning' : 'premium'}`)}>
                  impacto {item.impact}
                </span>
                <span className={cx('ops-inline-badge', `ops-inline-badge--${item.source === 'manual' ? 'blue' : 'success'}`)}>
                  {item.source === 'manual' ? 'manual' : item.source === 'automation_engine' ? 'automação' : 'sistema'}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="dashboard-card-empty">Nenhum evento neste filtro agora.</p>
      )}
    </section>
  );
}
