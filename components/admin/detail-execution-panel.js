'use client';

import { useEffect, useState } from 'react';
import { buildTaskActionGuide } from '@/lib/admin/task-action-guide';

function formatDateTime(value) {
  if (!value) return 'Sem registro';

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function taskStatusLabel(status) {
  return (
    {
      pending: 'Pendente',
      doing: 'Em andamento',
      done: 'Feito'
    }[status] || 'Sem status'
  );
}

function toneFromStatus(status, outcome, actionType) {
  if (actionType === 'rejected') return 'warning';
  if (actionType === 'feedback' && outcome === 'yes') return 'success';
  if (actionType === 'feedback' && outcome === 'no') return 'danger';
  if (status === 'done') return 'success';
  if (status === 'doing') return 'premium';
  return 'warning';
}

function buildExecutionGuide({ entityType, currentTask, description, nextStep }) {
  return buildTaskActionGuide({
    ...currentTask,
    sourceType:
      entityType === 'pagina'
        ? 'page-decision'
        : entityType === 'produto'
          ? 'product-decision'
          : currentTask?.sourceType,
    description,
    recommendation: nextStep,
    metadata: [description, nextStep].filter(Boolean)
  });
}

const HISTORY_STATUS_LABELS = {
  suggested: 'Sugestão da IA',
  accepted: 'Recomendação aceita',
  dispensed: 'Recomendação dispensada',
  decided: 'Decisão registrada',
  updated: 'Atualização de contexto',
  preview: 'Preview pronto'
};

function historyToneFromStatus(status) {
  if (status === 'accepted' || status === 'decided') return 'success';
  if (status === 'preview') return 'premium';
  if (status === 'dispensed') return 'danger';
  return 'premium';
}

function normalizeHistoryEntry(entry) {
  if (!entry) return null;
  const tone = entry.tone || historyToneFromStatus(entry.status);
  const time = entry.time || entry.createdAt || new Date().toISOString();
  const label = entry.label || HISTORY_STATUS_LABELS[entry.status] || 'Registro atualizado';
  const statusLabel = HISTORY_STATUS_LABELS[entry.status] || entry.status || 'Registro';

  return {
    ...entry,
    tone,
    time,
    label,
    statusLabel
  };
}

function normalizeHistoryEntries(entries = []) {
  return entries
    .map(normalizeHistoryEntry)
    .filter(Boolean);
}

function normalizeActionText(action, guide, entityLabel) {
  const value = String(action || '').trim();
  if (!value) return value;

  if (guide.destination === 'Google Ads' && (value.includes('para aprovação antes de executar') || value.includes('Decidir se vale seguir com'))) {
    return `Abrir o Google Ads e decidir se ${entityLabel || 'essa pagina'} vai receber mais trafego ou mais verba agora.`;
  }

  if (guide.destination === 'Search Console' && (value.includes('para aprovação antes de executar') || value.includes('Decidir se vale seguir com'))) {
    return `Abrir o Search Console e decidir se ${entityLabel || 'essa pagina'} merece mais atencao agora.`;
  }

  if (guide.destination === 'VSCode' && (value.includes('para aprovação antes de executar') || value.includes('Decidir se vale seguir com'))) {
    return `Ler a recomendacao, decidir se faz sentido e, se gostar da ideia, ajustar ${entityLabel || 'essa pagina'} manualmente no VSCode.`;
  }

  return value
    .replaceAll('Levar ', 'Olhar ')
    .replaceAll(' para aprovação antes de executar.', ' e decidir se vale seguir com isso agora.')
    .replaceAll(' para aprovação antes de executar', ' e decidir se vale seguir com isso agora.');
}

export function DetailExecutionPanel({
  entityType = 'item',
  entityLabel = '',
  title,
  description,
  nextStep,
  task,
  operation
}) {
  const [currentTask, setCurrentTask] = useState(task);
  const [saving, setSaving] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const suggestedAt = operation?.updatedAt || operation?.createdAt || currentTask?.actedAt || null;
  const suggestedAtLabel = suggestedAt ? formatDateTime(suggestedAt) : 'Sem hora registrada';
  const plainReason =
    description ||
    `O sistema viu uma oportunidade ${entityType === 'pagina' ? 'nesta pagina' : 'neste produto'} e quer que voce olhe isso agora.`;
  const guide = buildExecutionGuide({
    entityType,
    currentTask,
    description: plainReason,
    nextStep
  });
  const plainAction = normalizeActionText(
    nextStep || `Seguir a recomendacao principal ${entityType === 'pagina' ? 'desta pagina' : 'deste produto'}.`,
    guide,
    entityLabel
  );
  const requiresManualExecution =
    guide.destinationKind === 'external' ||
    ['Google Ads', 'Search Console', 'Analytics', 'VSCode'].includes(guide.destination);
  const planPreparedOnly =
    currentTask?.status === 'done' &&
    !currentTask?.actionType &&
    requiresManualExecution;
  const tone = planPreparedOnly ? 'warning' : toneFromStatus(currentTask?.status, currentTask?.outcome, currentTask?.actionType);
  const shouldAskForOutcome = currentTask?.actionType === 'completed';
  const isResolved =
    currentTask?.actionType === 'rejected' ||
    (currentTask?.actionType === 'feedback' && (currentTask?.outcome === 'yes' || currentTask?.outcome === 'no'));
  const panelTitle =
    entityType === 'pagina'
      ? 'O que voce deve fazer agora nesta pagina'
      : entityType === 'produto'
        ? 'O que voce deve fazer agora neste produto'
        : title;
  const statusCopy = planPreparedOnly ? 'Pronto para voce fazer' : taskStatusLabel(currentTask?.status);
  const noteLabel = planPreparedOnly ? 'O sistema ja fez' : 'Ultimo retorno';
  const noPendingTask = currentTask?.status === 'done' && !shouldAskForOutcome && !planPreparedOnly;
  const noteCopy = planPreparedOnly
    ? `O sistema ja organizou essa recomendacao. Agora falta voce fazer isso em ${guide.destination}.`
    : currentTask?.note;
  const showStatusHero = noPendingTask || isResolved;
  const statusHeroTone = noPendingTask ? 'thinking' : 'resolved';
  const statusHeroTitle = noPendingTask ? 'A IA está pensando' : 'Decisão registrada';
  const statusHeroCopy = noPendingTask
    ? 'Assim que o próximo sinal chegar, ele aparece aqui para voce decidir sem perder o contexto.'
    : 'Essa recomendacao saiu da fila e a IA segue observando o proximo sinal.';

  async function persistHistoryEntry(status, label, detail) {
    if (!entityLabel) return null;

    try {
      const response = await fetch('/api/admin/page-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagePath: entityLabel,
          label,
          status,
          detail,
          actor: 'admin'
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload?.entry) {
        throw new Error(payload?.error || 'Não foi possível registrar o histórico.');
      }
      const normalized = normalizeHistoryEntry({
        ...payload.entry,
        status,
        label,
        detail
      });
      if (normalized) {
        setHistoryRecords((previous) => [normalized, ...previous]);
      }
      return normalized;
    } catch (error) {
      console.error('Falha ao persistir historico da pagina', error);
    }
    return null;
  }

  async function fetchHistory() {
    if (!entityLabel) return;
    try {
      const response = await fetch(`/api/admin/page-history?pagePath=${encodeURIComponent(entityLabel)}`, {
        method: 'GET',
        cache: 'no-store'
      });
      const payload = await response.json();
      if (response.ok && payload?.entries) {
        setHistoryRecords(normalizeHistoryEntries(payload.entries));
      }
    } catch (error) {
      console.error('Falha ao carregar historico da pagina', error);
    }
  }

  useEffect(() => {
    setHistoryRecords([]);
    fetchHistory();
  }, [entityLabel]);

  async function updateTask(status, options = {}) {
    if (!currentTask?.id) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentTask.id,
          status,
          note: options.note || '',
          actionType: options.actionType || '',
          outcome: options.outcome || '',
          title: currentTask.title,
          sourceLabel: currentTask.sourceLabel,
          href: currentTask.href,
          priority: currentTask.priority
        }),
        cache: 'no-store'
      });

      const payload = await response.json();
      if (!response.ok || payload?.error) {
        throw new Error(payload?.detail || payload?.error || 'Falha ao atualizar o acompanhamento.');
      }

      setCurrentTask((previous) => ({
        ...previous,
        status,
        note: options.note || '',
        actionType: options.actionType || '',
        outcome: options.outcome || '',
        actedAt: payload?.entry?.createdAt || new Date().toISOString()
      }));
      const actionLabel = options.entryLabel || currentTask?.title || plainAction;
      const historyStatus =
        options.actionType === 'rejected'
          ? 'dispensed'
          : options.actionType === 'completed'
            ? 'accepted'
            : options.actionType === 'accepted'
              ? 'decided'
              : 'updated';
      await persistHistoryEntry(historyStatus, actionLabel, options.note || '');
    } catch (error) {
      console.error('detail execution update error', error);
      window.alert(error instanceof Error ? error.message : 'Falha ao atualizar o acompanhamento.');
    } finally {
      setSaving(false);
    }
  }

  function reopenHistory(entry) {
    setHistoryRecords((previous) => previous.filter((row) => row.id !== entry.id));
    updateTask('pending', {
      note: `Reaberta a partir do histórico: ${entry.detail || entry.label}`,
      actionType: '',
      entryLabel: `Reaberta: ${entry.label}`
    });
  }

  return (
    <article className={`ops-panel ops-panel--soft detail-execution-panel detail-execution-panel--${tone}`}>
      <div className="ops-panel-head">
        <div>
          <span>O que fazer agora</span>
          <h3>{panelTitle}</h3>
        </div>
      </div>

      <p>{plainAction}</p>

      <div className="ops-chip-row">
        <span className={`ops-chip ops-chip--${tone}`}>{statusCopy}</span>
        {currentTask?.actionType === 'rejected' ? <span className="ops-chip ops-chip--warning">Dispensada</span> : null}
        {currentTask?.actionType === 'feedback' && currentTask?.outcome === 'yes' ? <span className="ops-chip ops-chip--success">Deu certo</span> : null}
        {currentTask?.actionType === 'feedback' && currentTask?.outcome === 'no' ? <span className="ops-chip ops-chip--danger">Nao deu certo</span> : null}
        {suggestedAt ? <span className="ops-chip">Chegou em {suggestedAtLabel}</span> : null}
        {isResolved ? (
          <span className="ops-chip ops-chip--premium">A IA já registrou essa decisão e agora prepara o próximo sinal.</span>
        ) : null}
      </div>

      {!isResolved && suggestedAt ? (
        <div className="detail-execution-meta-bar">
          <span>Ultima sugestao</span>
          <strong>{suggestedAtLabel}</strong>
          <small>{guide.destination}</small>
        </div>
      ) : null}

      {showStatusHero ? (
        <div className={`detail-execution-status-banner detail-execution-status-banner--${statusHeroTone}`}>
          <span>{noPendingTask ? 'Status da IA' : 'Decisao finalizada'}</span>
          <strong>{statusHeroTitle}</strong>
          <p>{statusHeroCopy}</p>
          {suggestedAt ? <small>Ultima sugestao: {suggestedAtLabel}</small> : null}
        </div>
      ) : null}

      {!isResolved && !noPendingTask && (
        <div className="detail-execution-grid">
          <div className="ops-inline-card detail-execution-summary-card">
            <span>Por que isso apareceu para voce</span>
            <strong>{plainReason}</strong>
            <small>motivo dessa recomendacao</small>
          </div>
          <div className="ops-inline-card detail-execution-summary-card">
            <span>O que fazer agora</span>
            <strong>{noPendingTask ? 'Aguardando proxima recomendacao' : plainAction}</strong>
            <small>{noPendingTask ? 'Sem ação ativa no momento' : 'acao principal'}</small>
          </div>
          <div className="ops-inline-card detail-execution-summary-card">
            <span>Onde fazer</span>
            <strong>{noPendingTask ? 'Sem destino definido enquanto a IA processa o próximo sinal' : guide.destination}</strong>
            <small>{noPendingTask ? 'O sistema volta a definir isso em breve' : guide.helper}</small>
          </div>
        </div>
      )}

      {!isResolved && !noPendingTask && noteCopy ? (
        <div className="cockpit-diagnosis-grid">
          <div>
            <small>{noteLabel}</small>
            <strong>{noteCopy}</strong>
          </div>
        </div>
      ) : null}

      {!noPendingTask ? (
        <>
          {!isResolved ? (
            <div className="task-card-actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setInstructionsOpen(true)}
              >
                Ver passo a passo
              </button>
              {(currentTask?.status === 'doing' || currentTask?.status === 'pending' || planPreparedOnly) && currentTask?.actionType !== 'rejected' ? (
                <button
                  type="button"
                  className="button button--success"
                  disabled={saving}
                  onClick={() =>
                    updateTask('done', {
                      note: `Marcado como feito em ${guide.destination}.`,
                      actionType: 'completed'
                    })
                  }
                >
                  {guide.primaryLabel || 'Feito'}
                </button>
              ) : null}
              {(currentTask?.status === 'pending' || currentTask?.status === 'doing' || planPreparedOnly) ? (
                <button
                  type="button"
                  className="button button--danger"
                  disabled={saving}
                  onClick={() => updateTask('done', { note: 'Marcado como nao feito nesta tela.', actionType: 'rejected' })}
                >
                  Não feito
                </button>
              ) : null}
              {currentTask?.status === 'pending' && currentTask?.actionType !== 'rejected' ? (
                <button
                  type="button"
                  className="button button--ghost"
                  disabled={saving}
                  onClick={() =>
                    updateTask('doing', {
                      note: `Voce decidiu seguir com essa recomendacao em ${guide.destination}.`,
                      actionType: 'accepted'
                    })
                  }
                >
                  Vou fazer
                </button>
              ) : null}
              {guide.destinationHref ? (
                <a
                  className="button button--ghost"
                  href={guide.destinationHref}
                  target={guide.destinationKind === 'external' ? '_blank' : undefined}
                  rel={guide.destinationKind === 'external' ? 'noreferrer' : undefined}
                >
                  {guide.buttonLabel}
                </a>
              ) : null}
            </div>
          ) : (
            <div className="task-card-actions">
              <button
                type="button"
                className="button button--ghost"
                disabled={saving}
                onClick={() => updateTask('pending', { note: 'Recomendacao reaberta para nova analise.' })}
              >
                Trazer de volta para a fila
              </button>
            </div>
          )}
        </>
      ) : null}

      {shouldAskForOutcome ? (
        <div className="detail-execution-feedback">
          <strong>Depois de fazer, deu certo ou nao?</strong>
          <p>Use isso so quando ja der para saber o resultado.</p>
          <div className="task-card-actions">
            <button
              type="button"
              className="button button--primary"
              disabled={saving}
              onClick={() => updateTask('done', { note: 'Acao validada: deu certo.', actionType: 'feedback', outcome: 'yes' })}
            >
              Funcionou
            </button>
            <button
              type="button"
              className="button button--ghost"
              disabled={saving}
              onClick={() => updateTask('done', { note: 'Acao validada: nao deu certo.', actionType: 'feedback', outcome: 'no' })}
            >
              Nao funcionou
            </button>
          </div>
        </div>
      ) : null}

      {historyRecords.length ? (
        <section className="task-history-section">
          <strong>Histórico recente</strong>
          <div className="task-history-list">
            {historyRecords.map((entry) => (
              <div key={entry.id} className={`task-history-row task-history-row--${entry.tone}`}>
                <div>
                  <strong>{entry.label}</strong>
                  <small>
                    {entry.statusLabel}
                    {entry.detail ? ` · ${entry.detail}` : ''}
                  </small>
                </div>
                <div className="task-history-row-actions">
                  <small>{formatDateTime(entry.time)}</small>
                  <button
                    type="button"
                    className="button button--ghost button--compact"
                    onClick={() => reopenHistory(entry)}
                  >
                    Reabrir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {instructionsOpen ? (
        <div className="detail-execution-modal-backdrop" onClick={() => setInstructionsOpen(false)}>
          <div
            className="detail-execution-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="O que fazer"
          >
            <div className="ops-panel-head">
              <div>
                <span>Passo a passo</span>
                <h3>O que voce precisa fazer</h3>
              </div>
            </div>

            <div className="detail-execution-modal-copy">
              <p>
                <strong>Onde voce esta:</strong> {entityLabel || currentTask?.title || 'esta frente'}.
              </p>
              <p>
                <strong>Onde fazer:</strong> {guide.destination}.
              </p>
              <p>
                <strong>O que voce precisa fazer agora:</strong> {plainAction}
              </p>
              <p>
                <strong>Por que o sistema esta te pedindo isso:</strong> {plainReason}
              </p>
              <p>
                <strong>Quando isso chegou para voce:</strong> {formatDateTime(suggestedAt)}
              </p>
              <p>
                <strong>Passo a passo:</strong>
              </p>
              <ol className="command-layer-list">
                {guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p>
                <strong>Depois de fazer:</strong> volte aqui e clique em <b>Ja fiz isso</b>.
              </p>
              <p>
                <strong>Quando souber o resultado:</strong> marque <b>Funcionou</b> ou <b>Nao funcionou</b>.
              </p>
              <p>
                <strong>Se nao quiser seguir:</strong> clique em <b>Nao vou fazer</b>. A ideia sai da sua fila e vai para o historico.
              </p>
            </div>

            <div className="task-card-actions">
              {guide.destinationHref ? (
                <a
                  className="button button--ghost"
                  href={guide.destinationHref}
                  target={guide.destinationKind === 'external' ? '_blank' : undefined}
                  rel={guide.destinationKind === 'external' ? 'noreferrer' : undefined}
                >
                  {guide.buttonLabel}
                </a>
              ) : null}
              <button type="button" className="button button--primary" onClick={() => setInstructionsOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
