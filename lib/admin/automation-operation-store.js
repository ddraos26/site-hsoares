import 'server-only';

import { getDb } from '@/lib/db';
import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';
import { replacePagePathWithLabel } from '@/lib/admin/page-presentation';

function statusLabel(status) {
  return (
    {
      ready: 'Sugestao pronta',
      running: 'Em execução',
      completed: 'Registrada',
      blocked: 'Bloqueada',
      failed: 'Falhou',
      cancelled: 'Encerrada'
    }[status] || 'Sem status'
  );
}

function toneFromStatus(status) {
  return (
    {
      ready: 'warning',
      running: 'premium',
      completed: 'success',
      blocked: 'warning',
      failed: 'danger',
      cancelled: 'danger'
    }[status] || 'blue'
  );
}

function executionModeLabel(mode) {
  return (
    {
      automatic_safe: 'Sugestao automatica',
      patch_preview: 'Preview para revisar',
      approval_required: 'Decisao humana',
      operator_handoff: 'Sugestao para operador',
      recommendation_only: 'So recomendacao'
    }[mode] || 'Modo operacional'
  );
}

function sortOperations(items = []) {
  const statusOrder = {
    running: 0,
    ready: 1,
    blocked: 2,
    failed: 3,
    completed: 4,
    cancelled: 5
  };

  return [...items].sort((left, right) => {
    const leftWeight = statusOrder[left.status] ?? 9;
    const rightWeight = statusOrder[right.status] ?? 9;
    if (leftWeight !== rightWeight) return leftWeight - rightWeight;
    return Date.parse(right.updatedAt || right.createdAt || 0) - Date.parse(left.updatedAt || left.createdAt || 0);
  });
}

function normalizeOperationRow(row) {
  const payload = row.payload || {};
  const result = row.result || {};
  const status = row.status || 'ready';
  const executionMode = row.execution_mode || payload.executionMode || 'approval_required';
  const sourceType = row.source_type || payload.sourceType || 'automation';
  const sourceId = row.source_id || payload.sourceId || '';
  const rawTitle = row.title || payload.title || 'Acao automatica';
  const rawDescription =
    row.description ||
    payload.description ||
    payload.summary ||
    result.detail ||
    'O sistema estruturou uma acao operacional.';
  const title = sourceType === 'page' ? replacePagePathWithLabel(rawTitle, sourceId) : rawTitle;
  const description = sourceType === 'page' ? replacePagePathWithLabel(rawDescription, sourceId) : rawDescription;

  return {
    id: row.id,
    key: row.operation_key,
    sourceType,
    sourceId,
    category: row.category || payload.category || 'general',
    lane: row.lane || payload.lane || 'operations',
    title,
    description,
    status,
    statusLabel: statusLabel(status),
    tone: toneFromStatus(status),
    executionMode,
    executionModeLabel: executionModeLabel(executionMode),
    requiresApproval: Boolean(row.requires_approval),
    priority: row.priority || payload.priority || 'Media',
    ownerLabel: row.owner_label || payload.ownerLabel || 'Sistema',
    contextHref: row.context_href || '',
    queueHref: row.queue_href || '',
    operationHref: row.context_href || row.operation_href || '',
    siteHref: row.site_href || '',
    payload,
    dispatchPacket: payload.dispatchPacket || null,
    reviewTaskId: payload.reviewTaskId || payload.nextTaskId || result.reviewMonitor?.reviewTaskId || null,
    reviewMonitor: result.reviewMonitor || null,
    result,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
    completedAt: row.completed_at || null
  };
}

export async function upsertAutomationOperation({
  operationKey,
  sourceType = 'automation',
  sourceId = '',
  category = 'general',
  lane = 'operations',
  title,
  description = '',
  status = 'ready',
  executionMode = 'approval_required',
  requiresApproval = false,
  priority = 'Media',
  ownerLabel = 'Sistema',
  contextHref = '',
  queueHref = '',
  operationHref = '',
  siteHref = '',
  payload = {},
  result = {}
}) {
  if (!operationKey || !title) {
    throw new Error('operationKey e title sao obrigatorios para registrar uma operacao.');
  }

  await ensureAdminOpsTables();

  const sql = getDb();
  const [row] = await sql`
    INSERT INTO automation_operations (
      operation_key,
      source_type,
      source_id,
      category,
      lane,
      title,
      description,
      status,
      execution_mode,
      requires_approval,
      priority,
      owner_label,
      context_href,
      queue_href,
      operation_href,
      site_href,
      payload,
      result
    )
    VALUES (
      ${operationKey},
      ${sourceType},
      ${sourceId},
      ${category},
      ${lane},
      ${title},
      ${description},
      ${status},
      ${executionMode},
      ${requiresApproval},
      ${priority},
      ${ownerLabel},
      ${contextHref},
      ${queueHref},
      ${operationHref},
      ${siteHref},
      ${JSON.stringify(payload || {})}::jsonb,
      ${JSON.stringify(result || {})}::jsonb
    )
    ON CONFLICT (operation_key) DO UPDATE SET
      source_type = EXCLUDED.source_type,
      source_id = EXCLUDED.source_id,
      category = EXCLUDED.category,
      lane = EXCLUDED.lane,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      execution_mode = EXCLUDED.execution_mode,
      requires_approval = EXCLUDED.requires_approval,
      priority = EXCLUDED.priority,
      owner_label = EXCLUDED.owner_label,
      context_href = EXCLUDED.context_href,
      queue_href = EXCLUDED.queue_href,
      operation_href = EXCLUDED.operation_href,
      site_href = EXCLUDED.site_href,
      payload = EXCLUDED.payload,
      result = EXCLUDED.result,
      updated_at = now(),
      completed_at = CASE
        WHEN EXCLUDED.status = 'completed' THEN now()
        WHEN EXCLUDED.status IN ('ready', 'running', 'blocked', 'failed', 'cancelled') THEN NULL
        ELSE automation_operations.completed_at
      END
    RETURNING
      id,
      operation_key,
      source_type,
      source_id,
      category,
      lane,
      title,
      description,
      status,
      execution_mode,
      requires_approval,
      priority,
      owner_label,
      context_href,
      queue_href,
      operation_href,
      site_href,
      payload,
      result,
      created_at,
      updated_at,
      completed_at
  `;

  return normalizeOperationRow(row);
}

export async function readAutomationOperations({ limit = 24 } = {}) {
  await ensureAdminOpsTables();

  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      operation_key,
      source_type,
      source_id,
      category,
      lane,
      title,
      description,
      status,
      execution_mode,
      requires_approval,
      priority,
      owner_label,
      context_href,
      queue_href,
      operation_href,
      site_href,
      payload,
      result,
      created_at,
      updated_at,
      completed_at
    FROM automation_operations
    ORDER BY updated_at DESC, created_at DESC
    LIMIT ${limit}
  `.catch(() => []);

  return sortOperations(rows.map(normalizeOperationRow));
}

export async function readAutomationOperation(identifier) {
  if (!identifier) return null;

  await ensureAdminOpsTables();

  const sql = getDb();
  const [row] = await sql`
    SELECT
      id,
      operation_key,
      source_type,
      source_id,
      category,
      lane,
      title,
      description,
      status,
      execution_mode,
      requires_approval,
      priority,
      owner_label,
      context_href,
      queue_href,
      operation_href,
      site_href,
      payload,
      result,
      created_at,
      updated_at,
      completed_at
    FROM automation_operations
    WHERE id::text = ${String(identifier)}
       OR operation_key = ${String(identifier)}
    ORDER BY updated_at DESC
    LIMIT 1
  `.catch(() => []);

  return row ? normalizeOperationRow(row) : null;
}

export async function updateAutomationOperation({
  id,
  status,
  payload,
  result
}) {
  if (!id) {
    throw new Error('id é obrigatório para atualizar a operação.');
  }

  await ensureAdminOpsTables();

  const sql = getDb();
  const [row] = await sql`
    UPDATE automation_operations
    SET
      status = COALESCE(${status}, status),
      payload = CASE
        WHEN ${payload ? JSON.stringify(payload) : null}::text IS NULL THEN payload
        ELSE ${JSON.stringify(payload || {})}::jsonb
      END,
      result = CASE
        WHEN ${result ? JSON.stringify(result) : null}::text IS NULL THEN result
        ELSE ${JSON.stringify(result || {})}::jsonb
      END,
      updated_at = now(),
      completed_at = CASE
        WHEN COALESCE(${status}, status) = 'completed' THEN now()
        WHEN COALESCE(${status}, status) IN ('ready', 'running', 'blocked', 'failed', 'cancelled') THEN NULL
        ELSE completed_at
      END
    WHERE id::text = ${String(id)}
    RETURNING
      id,
      operation_key,
      source_type,
      source_id,
      category,
      lane,
      title,
      description,
      status,
      execution_mode,
      requires_approval,
      priority,
      owner_label,
      context_href,
      queue_href,
      operation_href,
      site_href,
      payload,
      result,
      created_at,
      updated_at,
      completed_at
  `;

  return row ? normalizeOperationRow(row) : null;
}

export async function getAutomationOperationsSnapshot({ limit = 24 } = {}) {
  const items = await readAutomationOperations({ limit });

  const summary = items.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === 'ready') acc.ready += 1;
      if (item.status === 'running') acc.running += 1;
      if (item.status === 'completed') acc.completed += 1;
      if (item.status === 'blocked') acc.blocked += 1;
      if (item.status === 'failed') acc.failed += 1;
      if (item.status === 'cancelled') acc.cancelled += 1;
      if (item.executionMode === 'operator_handoff') acc.operatorHandoffs += 1;
      if (item.executionMode === 'automatic_safe') acc.safeAutomations += 1;
      if (item.executionMode === 'approval_required') acc.approvalExecutions += 1;
      return acc;
    },
    {
      total: 0,
      ready: 0,
      running: 0,
      completed: 0,
      blocked: 0,
      failed: 0,
      cancelled: 0,
      operatorHandoffs: 0,
      safeAutomations: 0,
      approvalExecutions: 0
    }
  );

  return {
    checkedAt: new Date().toISOString(),
    summary,
    focus: {
      nextOperation: items.find((item) => ['running', 'ready'].includes(item.status)) || null,
      lastCompleted: items.find((item) => item.status === 'completed') || null,
      lastFailure: items.find((item) => item.status === 'failed') || null
    },
    items
  };
}
