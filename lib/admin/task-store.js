import 'server-only';

import { getDb } from '@/lib/db';
import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';
import { deriveLeadTaskStatus } from '@/lib/admin/lead-automation';
import { readJsonlFile } from '@/lib/admin/file-log-store';
import {
  TASK_STATUS,
  getTaskStatusLabel,
  isCompletedTaskStatus,
  isInProgressTaskStatus,
  isPendingTaskStatus,
  normalizeTaskStatus
} from '@/lib/admin/task-status';

const TASK_LOG_FILE = 'tasks.jsonl';

function normalizeTaskEntry(entry) {
  const status = normalizeTaskStatus(entry?.status);

  return {
    id: String(entry?.id || entry?.task_key || '').trim(),
    status,
    actor: entry?.actor || 'admin',
    note: entry?.note || '',
    actionType: String(entry?.actionType || entry?.action_type || '').trim(),
    outcome: String(entry?.outcome || '').trim(),
    title: entry?.title || '',
    sourceLabel: entry?.sourceLabel || entry?.source_label || '',
    href: entry?.href || '',
    priority: entry?.priority || '',
    createdAt: entry?.createdAt || entry?.created_at || new Date().toISOString()
  };
}

function dedupeEntries(entries = []) {
  const seen = new Set();

  return entries.filter((entry) => {
    const key = `${entry.id}:${entry.status}:${entry.createdAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toneFromPriority(priority) {
  if (priority === 'Urgente') return 'danger';
  if (priority === 'Alta') return 'warning';
  if (priority === 'Média') return 'premium';
  return 'blue';
}

export async function readTaskStateEntries() {
  await ensureAdminOpsTables();

  const sql = getDb();
  const [dbRows, legacyRows] = await Promise.all([
    sql`
      SELECT
        task_key,
        status,
        actor,
        note,
        action_type,
        outcome,
        title,
        source_label,
        href,
        priority,
        created_at
      FROM task_state_entries
      ORDER BY created_at ASC
    `,
    readJsonlFile(TASK_LOG_FILE)
  ]);

  return dedupeEntries(
    [...legacyRows, ...dbRows]
      .map(normalizeTaskEntry)
      .filter((item) => item.id)
  ).sort((left, right) => Date.parse(left.createdAt || 0) - Date.parse(right.createdAt || 0));
}

export async function recordTaskStateEntry({ id, status, actor, note, actionType, outcome, title, sourceLabel, href, priority }) {
  await ensureAdminOpsTables();

  const payload = normalizeTaskEntry({
    id,
    status,
    actor,
    note,
    actionType,
    outcome,
    title,
    sourceLabel,
    href,
    priority,
    createdAt: new Date().toISOString()
  });

  const sql = getDb();

  await sql`
    INSERT INTO task_state_entries (
      task_key,
      status,
      actor,
      note,
      action_type,
      outcome,
      title,
      source_label,
      href,
      priority,
      created_at
    )
    VALUES (
      ${payload.id},
      ${payload.status},
      ${payload.actor},
      ${payload.note || null},
      ${payload.actionType || null},
      ${payload.outcome || null},
      ${payload.title || null},
      ${payload.sourceLabel || null},
      ${payload.href || null},
      ${payload.priority || null},
      ${payload.createdAt}
    )
  `;

  return payload;
}

export async function syncLeadTaskState({
  leadId,
  leadStatus,
  ownerName,
  nextContactAt,
  notes,
  actor = 'sistema',
  note = '',
  title = '',
  productSlug = '',
  leadName = ''
}) {
  const resolvedStatus = deriveLeadTaskStatus({
    leadStatus,
    ownerName,
    nextContactAt,
    notes
  });

  const priority =
    normalizeTaskStatus(resolvedStatus) === TASK_STATUS.DONE
      ? 'Baixa'
      : leadStatus === 'novo'
        ? 'Alta'
        : leadStatus === 'em_contato'
          ? 'Média'
          : 'Média';

  return recordTaskStateEntry({
    id: `lead:${leadId}`,
    status: normalizeTaskStatus(resolvedStatus),
    actor,
    note,
    title: title || `Responder ${leadName || productSlug || 'lead'}`,
    sourceLabel: 'Leads',
    href: `/admin/leads?lead=${encodeURIComponent(leadId)}`,
    priority
  });
}

export function mergeTaskState(items = [], entries = []) {
  const latestMap = new Map();
  const historyMap = new Map();

  for (const entry of entries) {
    latestMap.set(entry.id, entry);
    const history = historyMap.get(entry.id) || [];
    history.push(entry);
    historyMap.set(entry.id, history);
  }

  const currentIds = new Set(items.map((item) => item.id));
  const pending = [];
  const inProgress = [];
  const done = [];
  const archived = [];
  const blocked = [];
  const waitingResult = [];

  function buildMarkers(id) {
    const taskHistory = historyMap.get(id) || [];

    return taskHistory.reduce(
      (acc, entry) => {
        const status = normalizeTaskStatus(entry.status);

        if (status === TASK_STATUS.IN_PROGRESS) {
          acc.startedAt = entry.createdAt;
        } else if (status === TASK_STATUS.DONE || status === TASK_STATUS.WAITING_RESULT) {
          if (!acc.completedAt) {
            acc.completedAt = entry.createdAt;
          }
        }

        if (status === TASK_STATUS.DONE && !acc.completedAt) {
          acc.completedAt = entry.createdAt;
        } else if (status === TASK_STATUS.ARCHIVED) {
          acc.archivedAt = entry.createdAt;
        } else if (status === TASK_STATUS.REOPENED) {
          acc.reopenedAt = entry.createdAt;
        }

        if (status === TASK_STATUS.WAITING_RESULT) {
          acc.waitingResultAt = entry.createdAt;
        } else if (status === TASK_STATUS.BLOCKED) {
          acc.blockedAt = entry.createdAt;
        }

        return acc;
      },
      {
        startedAt: null,
        completedAt: null,
        archivedAt: null,
        reopenedAt: null,
        waitingResultAt: null,
        blockedAt: null
      }
    );
  }

  for (const item of items) {
    const latest = latestMap.get(item.id);
    const status = normalizeTaskStatus(latest?.status || item.status);
    const merged = {
      ...item,
      status,
      statusLabel: getTaskStatusLabel(status),
      actedAt: latest?.createdAt || null,
      actedBy: latest?.actor || null,
      note: latest?.note || '',
      actionType: latest?.actionType || '',
      outcome: latest?.outcome || '',
      ...buildMarkers(item.id)
    };

    if (status === TASK_STATUS.BLOCKED) {
      blocked.push(merged);
      continue;
    }

    if (status === TASK_STATUS.WAITING_RESULT) {
      waitingResult.push(merged);
      continue;
    }

    if (status === TASK_STATUS.ARCHIVED) {
      archived.push(merged);
      continue;
    }

    if (status === TASK_STATUS.IN_PROGRESS) {
      inProgress.push(merged);
      continue;
    }

    if (status === TASK_STATUS.DONE) {
      done.push(merged);
      continue;
    }

    pending.push(merged);
  }

  for (const entry of entries) {
    if (currentIds.has(entry.id)) continue;

    const syntheticItem = {
      id: entry.id,
      status: entry.status,
      statusLabel: getTaskStatusLabel(entry.status),
      title:
        entry.title ||
        (entry.status === TASK_STATUS.DONE
          ? 'Task concluída'
          : entry.status === TASK_STATUS.IN_PROGRESS
            ? 'Task em andamento'
            : entry.status === TASK_STATUS.ARCHIVED
              ? 'Task arquivada'
              : entry.status === TASK_STATUS.REOPENED
                ? 'Task reaberta'
                : entry.status === TASK_STATUS.BLOCKED
                  ? 'Task bloqueada'
                  : entry.status === TASK_STATUS.WAITING_RESULT
                    ? 'Task aguardando resultado'
                    : 'Task pendente'),
      description:
        entry.note ||
        (entry.status === TASK_STATUS.DONE
          ? 'Essa tarefa já foi resolvida e saiu da fila ativa.'
          : entry.status === TASK_STATUS.ARCHIVED
            ? 'Essa tarefa foi encerrada e ficou guardada no histórico operacional.'
            : entry.status === TASK_STATUS.WAITING_RESULT
              ? 'A execução terminou e o sistema está aguardando o retorno do resultado.'
          : 'Task persistida pelo sistema e ainda ativa na operação.'),
      sourceLabel: entry.sourceLabel || 'Histórico',
      href: entry.href || '',
      priority: entry.priority || 'Média',
      tone: isCompletedTaskStatus(entry.status) ? 'success' : toneFromPriority(entry.priority || 'Média'),
      actedAt: entry.createdAt,
      actedBy: entry.actor || 'admin',
      note: entry.note || '',
      actionType: entry.actionType || '',
      outcome: entry.outcome || '',
      ...buildMarkers(entry.id)
    };

    if (normalizeTaskStatus(entry.status) === TASK_STATUS.BLOCKED) {
      blocked.push(syntheticItem);
      continue;
    }

    if (normalizeTaskStatus(entry.status) === TASK_STATUS.WAITING_RESULT) {
      waitingResult.push(syntheticItem);
      continue;
    }

    if (normalizeTaskStatus(entry.status) === TASK_STATUS.ARCHIVED) {
      archived.push(syntheticItem);
      continue;
    }

    if (normalizeTaskStatus(entry.status) === TASK_STATUS.IN_PROGRESS) {
      inProgress.push(syntheticItem);
      continue;
    }

    if (isPendingTaskStatus(entry.status)) {
      pending.push(syntheticItem);
      continue;
    }

    done.push(syntheticItem);
  }

  const sortByRecentAction = (left, right) =>
    Date.parse(right.actedAt || right.createdAt || 0) - Date.parse(left.actedAt || left.createdAt || 0);

  inProgress.sort(sortByRecentAction);
  done.sort(sortByRecentAction);
  archived.sort(sortByRecentAction);
  blocked.sort(sortByRecentAction);
  waitingResult.sort(sortByRecentAction);

  return {
    pending,
    inProgress,
    doing: inProgress,
    done,
    archived,
    blocked,
    waitingResult
  };
}
