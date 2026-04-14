import 'server-only';

import { randomUUID } from 'node:crypto';
import { encodePageDetailId } from '@/lib/admin/detail-route';
import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';
import { getDb } from '@/lib/db';
import {
  capturePerformanceForTask,
  normalizePerformanceSnapshot,
  resolveTaskRecheckHours,
  resolveTaskWindowHours
} from '@/lib/admin/task-performance';
import { TASK_STATUS, normalizeTaskStatus } from '@/lib/admin/task-status';

function normalizeText(value) {
  return String(value || '').trim();
}

function uniqueByKey(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.key}:${item.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeGuideSteps(steps = []) {
  return (Array.isArray(steps) ? steps : [])
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeMetadata(metadata = []) {
  if (!Array.isArray(metadata)) return [];
  return metadata.map((item) => normalizeText(item)).filter(Boolean).slice(0, 12);
}

function buildBadge(key, label, tone = 'premium') {
  return {
    key: normalizeText(key),
    label: normalizeText(label),
    tone: normalizeText(tone) || 'premium'
  };
}

function normalizeBadges(badges = []) {
  const mapped = (Array.isArray(badges) ? badges : [])
    .map((item) => {
      if (typeof item === 'string') {
        if (item === 'automatic') return buildBadge('automatic', 'Criada automaticamente', 'success');
        if (item === 'executed_by_system') return buildBadge('executed_by_system', 'Executada pelo sistema', 'premium');
        if (item === 'reopened') return buildBadge('reopened', 'Reaberta', 'warning');
        if (item === 'new_round') return buildBadge('new_round', 'Nova rodada', 'danger');
        return buildBadge(item, toSentenceCase(item.replace(/_/g, ' ')));
      }

      return buildBadge(item?.key, item?.label, item?.tone);
    })
    .filter((item) => item.key && item.label);

  return uniqueByKey(mapped);
}

function toSentenceCase(value) {
  const text = normalizeText(value);
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function inferWhereToDo(record = {}) {
  const raw = normalizeText(record.whereToDo).toLowerCase();
  const href = normalizeText(record.href).toLowerCase();
  const sourceType = normalizeText(record.sourceType).toLowerCase();

  if (raw) return record.whereToDo;
  if (href.includes('/leads') || sourceType === 'lead') return 'CRM';
  if (sourceType === 'seo') return 'Search Console';
  if (sourceType === 'campaign') return 'Google Ads';
  if (href.includes('/pages/') || href.includes('/produtos/') || sourceType.includes('page')) return 'VSCode';
  return 'Painel';
}

function inferTargetType(record = {}) {
  const targetType = normalizeText(record.targetType).toLowerCase();
  const sourceType = normalizeText(record.sourceType).toLowerCase();
  const href = normalizeText(record.href).toLowerCase();

  if (targetType) return targetType;
  if (sourceType === 'lead' || href.includes('/leads')) return 'lead';
  if (sourceType === 'seo') return 'seo';
  if (sourceType === 'campaign') return 'campaign';
  if (sourceType.includes('product') || href.includes('/products/')) return 'product';
  if (sourceType.includes('page') || href.includes('/pages/')) return 'page';
  return 'operation';
}

function inferTargetId(record = {}, targetType = '') {
  const explicit = normalizeText(record.targetId);
  if (explicit) return explicit;

  const href = normalizeText(record.href);
  if (targetType === 'page' || targetType === 'content') {
    if (href.includes('/dashboard/pages/')) {
      return normalizeText(record.payload?.pagePath);
    }
  }

  if (targetType === 'product') {
    const match = href.match(/\/dashboard\/products\/([^/?#]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : '';
  }

  return '';
}

function inferTargetLabel(record = {}, targetType = '') {
  if (normalizeText(record.targetLabel)) return record.targetLabel;
  if (normalizeText(record.productLabel)) return record.productLabel;

  if (targetType === 'lead') {
    return normalizeText(record.title).replace(/^Responder\s+/i, '') || 'Lead';
  }

  return record.title || 'Operação';
}

function inferHref(record = {}, targetType = '', targetId = '') {
  const explicit = normalizeText(record.href);
  if (explicit) return explicit;

  if ((targetType === 'page' || targetType === 'content') && targetId) {
    return `/dashboard/pages/${encodePageDetailId(targetId)}`;
  }

  if (targetType === 'product' && targetId) {
    return `/dashboard/products/${encodeURIComponent(targetId)}`;
  }

  if (targetType === 'lead' && targetId) {
    return `/admin/leads?lead=${encodeURIComponent(targetId)}`;
  }

  return '';
}

function normalizeTaskRow(row) {
  return {
    id: row.task_id,
    sourceTaskId: row.source_task_id || null,
    dedupeKey: row.dedupe_key || '',
    title: row.title || '',
    description: row.description || '',
    recommendation: row.recommendation || '',
    sourceType: row.source_type || '',
    sourceLabel: row.source_label || '',
    targetType: row.target_type || '',
    targetId: row.target_id || '',
    targetLabel: row.target_label || '',
    href: row.href || '',
    whereToDo: row.where_to_do || '',
    guideSteps: normalizeGuideSteps(row.guide_steps || []),
    metadata: normalizeMetadata(row.metadata || []),
    badges: normalizeBadges(row.badges || []),
    priority: row.priority || 'Média',
    ownerLabel: row.owner_label || '',
    dueLabel: row.due_label || '',
    requiresApproval: Boolean(row.requires_approval),
    createdBy: row.created_by || 'system',
    reopenReason: row.reopen_reason || '',
    reopenedFromResult: row.reopened_from_result || '',
    automationRuleId: row.automation_rule_id || '',
    automationMode: row.automation_mode || '',
    isAutomatic: Boolean(row.is_automatic),
    performanceSnapshot: normalizePerformanceSnapshot(row.performance_snapshot || {}),
    payload: row.payload || {},
    resultDueAt: row.result_due_at || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
    lastSeenAt: row.last_seen_at || row.updated_at || row.created_at || new Date().toISOString()
  };
}

export function createAdminTaskId() {
  return `task:${randomUUID()}`;
}

function buildTaskDefinitionPayload(payload = {}, existing = null) {
  const targetType = inferTargetType({ ...existing, ...payload });
  const targetId = inferTargetId({ ...existing, ...payload }, targetType);
  const href = inferHref({ ...existing, ...payload }, targetType, targetId);
  const whereToDo = inferWhereToDo({ ...existing, ...payload });
  const targetLabel = inferTargetLabel({ ...existing, ...payload }, targetType);
  const performanceSnapshot = normalizePerformanceSnapshot(payload.performanceSnapshot || existing?.performanceSnapshot || {});

  return {
    id: normalizeText(payload.id || existing?.id) || createAdminTaskId(),
    sourceTaskId: normalizeText(payload.sourceTaskId || existing?.sourceTaskId) || null,
    dedupeKey: normalizeText(payload.dedupeKey || existing?.dedupeKey) || '',
    title: normalizeText(payload.title || existing?.title) || 'Task operacional',
    description: normalizeText(payload.description || existing?.description),
    recommendation: normalizeText(payload.recommendation || existing?.recommendation),
    sourceType: normalizeText(payload.sourceType || existing?.sourceType),
    sourceLabel: normalizeText(payload.sourceLabel || existing?.sourceLabel) || 'Operação',
    targetType,
    targetId,
    targetLabel,
    href,
    whereToDo,
    guideSteps: normalizeGuideSteps(payload.guideSteps || existing?.guideSteps || []),
    metadata: normalizeMetadata(payload.metadata || existing?.metadata || []),
    badges: normalizeBadges([...(existing?.badges || []), ...(payload.badges || [])]),
    priority: normalizeText(payload.priority || existing?.priority) || 'Média',
    ownerLabel: normalizeText(payload.ownerLabel || existing?.ownerLabel),
    dueLabel: normalizeText(payload.dueLabel || existing?.dueLabel),
    requiresApproval: payload.requiresApproval == null ? Boolean(existing?.requiresApproval) : Boolean(payload.requiresApproval),
    createdBy: normalizeText(payload.createdBy || existing?.createdBy) || 'system',
    reopenReason: normalizeText(payload.reopenReason || existing?.reopenReason),
    reopenedFromResult: normalizeText(payload.reopenedFromResult || existing?.reopenedFromResult),
    automationRuleId: normalizeText(payload.automationRuleId || existing?.automationRuleId),
    automationMode: normalizeText(payload.automationMode || existing?.automationMode),
    isAutomatic: payload.isAutomatic == null ? Boolean(existing?.isAutomatic) : Boolean(payload.isAutomatic),
    performanceSnapshot,
    payload: payload.payload || existing?.payload || {},
    resultDueAt: payload.resultDueAt || existing?.resultDueAt || null,
    lastSeenAt: payload.lastSeenAt || new Date().toISOString()
  };
}

async function captureBeforeIfNeeded(task) {
  const current = normalizePerformanceSnapshot(task.performanceSnapshot || {});
  if (current.before?.capturedAt) {
    return current;
  }

  const before = await capturePerformanceForTask(task);
  return normalizePerformanceSnapshot({
    ...current,
    targetType: task.targetType,
    targetId: task.targetId,
    windowHours: resolveTaskWindowHours(task),
    recheckAfterHours: resolveTaskRecheckHours(task),
    before,
    result: current.result || 'waiting',
    summary: current.summary || '',
    nextRecommendation: current.nextRecommendation || null
  });
}

export async function readAdminTasks({ limit = 200 } = {}) {
  await ensureAdminOpsTables();
  const sql = getDb();
  const rows = await sql`
    SELECT
      task_id,
      source_task_id,
      dedupe_key,
      title,
      description,
      recommendation,
      source_type,
      source_label,
      target_type,
      target_id,
      target_label,
      href,
      where_to_do,
      guide_steps,
      metadata,
      badges,
      priority,
      owner_label,
      due_label,
      requires_approval,
      created_by,
      reopen_reason,
      reopened_from_result,
      automation_rule_id,
      automation_mode,
      is_automatic,
      performance_snapshot,
      payload,
      result_due_at,
      created_at,
      updated_at,
      last_seen_at
    FROM admin_tasks
    ORDER BY updated_at DESC, created_at DESC
    LIMIT ${limit}
  `.catch(() => []);

  return rows.map(normalizeTaskRow);
}

export async function readAdminTask(taskId) {
  if (!taskId) return null;

  await ensureAdminOpsTables();
  const sql = getDb();
  const [row] = await sql`
    SELECT
      task_id,
      source_task_id,
      dedupe_key,
      title,
      description,
      recommendation,
      source_type,
      source_label,
      target_type,
      target_id,
      target_label,
      href,
      where_to_do,
      guide_steps,
      metadata,
      badges,
      priority,
      owner_label,
      due_label,
      requires_approval,
      created_by,
      reopen_reason,
      reopened_from_result,
      automation_rule_id,
      automation_mode,
      is_automatic,
      performance_snapshot,
      payload,
      result_due_at,
      created_at,
      updated_at,
      last_seen_at
    FROM admin_tasks
    WHERE task_id = ${String(taskId)}
    LIMIT 1
  `.catch(() => []);

  return row ? normalizeTaskRow(row) : null;
}

export async function upsertAdminTask(payload = {}) {
  await ensureAdminOpsTables();
  const existing = payload.id ? await readAdminTask(payload.id) : null;
  const task = buildTaskDefinitionPayload(payload, existing);
  const sql = getDb();

  const [row] = await sql`
    INSERT INTO admin_tasks (
      task_id,
      source_task_id,
      dedupe_key,
      title,
      description,
      recommendation,
      source_type,
      source_label,
      target_type,
      target_id,
      target_label,
      href,
      where_to_do,
      guide_steps,
      metadata,
      badges,
      priority,
      owner_label,
      due_label,
      requires_approval,
      created_by,
      reopen_reason,
      reopened_from_result,
      automation_rule_id,
      automation_mode,
      is_automatic,
      performance_snapshot,
      payload,
      result_due_at,
      created_at,
      updated_at,
      last_seen_at
    )
    VALUES (
      ${task.id},
      ${task.sourceTaskId},
      ${task.dedupeKey || null},
      ${task.title},
      ${task.description || null},
      ${task.recommendation || null},
      ${task.sourceType || null},
      ${task.sourceLabel || null},
      ${task.targetType || null},
      ${task.targetId || null},
      ${task.targetLabel || null},
      ${task.href || null},
      ${task.whereToDo || null},
      ${JSON.stringify(task.guideSteps || [])}::jsonb,
      ${JSON.stringify(task.metadata || [])}::jsonb,
      ${JSON.stringify(task.badges || [])}::jsonb,
      ${task.priority || null},
      ${task.ownerLabel || null},
      ${task.dueLabel || null},
      ${task.requiresApproval},
      ${task.createdBy || null},
      ${task.reopenReason || null},
      ${task.reopenedFromResult || null},
      ${task.automationRuleId || null},
      ${task.automationMode || null},
      ${task.isAutomatic},
      ${JSON.stringify(task.performanceSnapshot || {})}::jsonb,
      ${JSON.stringify(task.payload || {})}::jsonb,
      ${task.resultDueAt || null},
      COALESCE(${existing?.createdAt || null}, now()),
      now(),
      ${task.lastSeenAt}
    )
    ON CONFLICT (task_id) DO UPDATE SET
      source_task_id = EXCLUDED.source_task_id,
      dedupe_key = EXCLUDED.dedupe_key,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      recommendation = EXCLUDED.recommendation,
      source_type = EXCLUDED.source_type,
      source_label = EXCLUDED.source_label,
      target_type = EXCLUDED.target_type,
      target_id = EXCLUDED.target_id,
      target_label = EXCLUDED.target_label,
      href = EXCLUDED.href,
      where_to_do = EXCLUDED.where_to_do,
      guide_steps = EXCLUDED.guide_steps,
      metadata = EXCLUDED.metadata,
      badges = EXCLUDED.badges,
      priority = EXCLUDED.priority,
      owner_label = EXCLUDED.owner_label,
      due_label = EXCLUDED.due_label,
      requires_approval = EXCLUDED.requires_approval,
      created_by = COALESCE(admin_tasks.created_by, EXCLUDED.created_by),
      reopen_reason = EXCLUDED.reopen_reason,
      reopened_from_result = EXCLUDED.reopened_from_result,
      automation_rule_id = EXCLUDED.automation_rule_id,
      automation_mode = EXCLUDED.automation_mode,
      is_automatic = EXCLUDED.is_automatic,
      performance_snapshot = EXCLUDED.performance_snapshot,
      payload = EXCLUDED.payload,
      result_due_at = EXCLUDED.result_due_at,
      updated_at = now(),
      last_seen_at = EXCLUDED.last_seen_at
    RETURNING
      task_id,
      source_task_id,
      dedupe_key,
      title,
      description,
      recommendation,
      source_type,
      source_label,
      target_type,
      target_id,
      target_label,
      href,
      where_to_do,
      guide_steps,
      metadata,
      badges,
      priority,
      owner_label,
      due_label,
      requires_approval,
      created_by,
      reopen_reason,
      reopened_from_result,
      automation_rule_id,
      automation_mode,
      is_automatic,
      performance_snapshot,
      payload,
      result_due_at,
      created_at,
      updated_at,
      last_seen_at
  `;

  return normalizeTaskRow(row);
}

export async function materializeTaskFromInput(payload = {}) {
  const existing = await readAdminTask(payload.id);
  const base = buildTaskDefinitionPayload(payload, existing);
  const performanceSnapshot = await captureBeforeIfNeeded(base);

  return upsertAdminTask({
    ...base,
    performanceSnapshot
  });
}

export async function updateTaskPerformanceSnapshot({ taskId, performanceSnapshot, resultDueAt = undefined }) {
  const task = await readAdminTask(taskId);
  if (!task) return null;

  return upsertAdminTask({
    ...task,
    performanceSnapshot: normalizePerformanceSnapshot(performanceSnapshot || task.performanceSnapshot),
    resultDueAt: resultDueAt === undefined ? task.resultDueAt : resultDueAt
  });
}

export async function findAdminTaskByDedupeKey(dedupeKey) {
  const key = normalizeText(dedupeKey);
  if (!key) return null;

  await ensureAdminOpsTables();
  const sql = getDb();
  const [row] = await sql`
    SELECT
      task_id,
      source_task_id,
      dedupe_key,
      title,
      description,
      recommendation,
      source_type,
      source_label,
      target_type,
      target_id,
      target_label,
      href,
      where_to_do,
      guide_steps,
      metadata,
      badges,
      priority,
      owner_label,
      due_label,
      requires_approval,
      created_by,
      reopen_reason,
      reopened_from_result,
      automation_rule_id,
      automation_mode,
      is_automatic,
      performance_snapshot,
      payload,
      result_due_at,
      created_at,
      updated_at,
      last_seen_at
    FROM admin_tasks
    WHERE dedupe_key = ${key}
    ORDER BY updated_at DESC
    LIMIT 1
  `.catch(() => []);

  return row ? normalizeTaskRow(row) : null;
}

export async function readTasksDueForResultCheck({ limit = 40 } = {}) {
  await ensureAdminOpsTables();
  const sql = getDb();
  const rows = await sql`
    SELECT
      task_id,
      source_task_id,
      dedupe_key,
      title,
      description,
      recommendation,
      source_type,
      source_label,
      target_type,
      target_id,
      target_label,
      href,
      where_to_do,
      guide_steps,
      metadata,
      badges,
      priority,
      owner_label,
      due_label,
      requires_approval,
      created_by,
      reopen_reason,
      reopened_from_result,
      automation_rule_id,
      automation_mode,
      is_automatic,
      performance_snapshot,
      payload,
      result_due_at,
      created_at,
      updated_at,
      last_seen_at
    FROM admin_tasks
    WHERE result_due_at IS NOT NULL
      AND result_due_at <= now()
    ORDER BY result_due_at ASC, updated_at ASC
    LIMIT ${limit}
  `.catch(() => []);

  return rows.map(normalizeTaskRow);
}

export async function createDerivedTaskFromSource({
  sourceTaskId,
  reopenReason = '',
  reopenedFromResult = 'manual',
  priority,
  note = '',
  actor = 'admin'
}) {
  const source = await readAdminTask(sourceTaskId);
  if (!source) {
    throw new Error('Task original não encontrada para reabrir.');
  }

  const nextTask = await materializeTaskFromInput({
    id: createAdminTaskId(),
    sourceTaskId: source.id,
    title: source.title,
    description: note || source.description,
    recommendation: source.recommendation,
    sourceType: source.sourceType,
    sourceLabel: source.sourceLabel,
    targetType: source.targetType,
    targetId: source.targetId,
    targetLabel: source.targetLabel,
    href: source.href,
    whereToDo: source.whereToDo,
    guideSteps: source.guideSteps,
    metadata: source.metadata,
    priority: priority || source.priority,
    ownerLabel: source.ownerLabel,
    dueLabel: source.dueLabel,
    requiresApproval: source.requiresApproval,
    reopenReason,
    reopenedFromResult,
    badges: [
      'reopened',
      reopenedFromResult === 'negative' ? 'new_round' : null
    ].filter(Boolean),
    payload: {
      ...(source.payload || {}),
      sourceTaskId: source.id,
      reopenedAt: new Date().toISOString(),
      reopenedBy: actor
    }
  });

  return nextTask;
}

export function buildPersistedTaskItem(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    recommendation: task.recommendation,
    priority: task.priority,
    sourceType: task.sourceType,
    sourceLabel: task.sourceLabel,
    href: task.href,
    requiresApproval: task.requiresApproval,
    ownerLabel: task.ownerLabel || 'Operação',
    productLabel: task.targetLabel,
    dueLabel: task.dueLabel || 'Hoje',
    metadata: task.metadata,
    createdAt: task.createdAt,
    guideSteps: task.guideSteps,
    whereToDo: task.whereToDo,
    targetType: task.targetType,
    targetId: task.targetId,
    targetLabel: task.targetLabel,
    performanceSnapshot: task.performanceSnapshot,
    badges: task.badges,
    sourceTaskId: task.sourceTaskId,
    reopenReason: task.reopenReason,
    reopenedFromResult: task.reopenedFromResult,
    isAutomatic: task.isAutomatic,
    automationMode: task.automationMode,
    resultDueAt: task.resultDueAt || null
  };
}
