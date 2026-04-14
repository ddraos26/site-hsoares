export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  ARCHIVED: 'archived',
  REOPENED: 'reopened',
  BLOCKED: 'blocked',
  WAITING_RESULT: 'waiting_result'
};

const TASK_STATUS_ALIASES = new Map([
  ['doing', TASK_STATUS.IN_PROGRESS],
  ['in-progress', TASK_STATUS.IN_PROGRESS],
  ['completed', TASK_STATUS.DONE],
  ['complete', TASK_STATUS.DONE],
  ['reopen', TASK_STATUS.REOPENED]
]);

const VALID_TASK_STATUSES = new Set(Object.values(TASK_STATUS));

export function normalizeTaskStatus(value, fallback = TASK_STATUS.PENDING) {
  const raw = String(value || '').trim().toLowerCase();
  const normalized = TASK_STATUS_ALIASES.get(raw) || raw;
  return VALID_TASK_STATUSES.has(normalized) ? normalized : fallback;
}

export function isPendingTaskStatus(status) {
  return [TASK_STATUS.PENDING, TASK_STATUS.REOPENED].includes(normalizeTaskStatus(status));
}

export function isInProgressTaskStatus(status) {
  return [TASK_STATUS.IN_PROGRESS, TASK_STATUS.BLOCKED].includes(normalizeTaskStatus(status));
}

export function isCompletedTaskStatus(status) {
  return [TASK_STATUS.DONE, TASK_STATUS.ARCHIVED, TASK_STATUS.WAITING_RESULT].includes(normalizeTaskStatus(status));
}

export function getTaskStatusLabel(status) {
  return (
    {
      [TASK_STATUS.PENDING]: 'Pendente',
      [TASK_STATUS.IN_PROGRESS]: 'Em andamento',
      [TASK_STATUS.DONE]: 'Feito',
      [TASK_STATUS.ARCHIVED]: 'Arquivado',
      [TASK_STATUS.REOPENED]: 'Reaberto',
      [TASK_STATUS.BLOCKED]: 'Bloqueado',
      [TASK_STATUS.WAITING_RESULT]: 'Aguardando resultado'
    }[normalizeTaskStatus(status)] || 'Pendente'
  );
}

