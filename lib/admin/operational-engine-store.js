import 'server-only';

import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';
import { readAdminRuntimeSetting, upsertAdminRuntimeSetting } from '@/lib/admin/runtime-settings-store';
import { getDb } from '@/lib/db';

const OPERATIONAL_ENGINE_STATE_KEY = 'operational_engine_state';
const OPERATIONAL_ENGINE_INTERVAL_KEY = 'operational_engine_interval_minutes';
const DEFAULT_EXPECTED_INTERVAL_MINUTES = 10;

function normalizeText(value) {
  return String(value || '').trim();
}

function toNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildNextRunAt(from = new Date().toISOString(), intervalMinutes = DEFAULT_EXPECTED_INTERVAL_MINUTES) {
  return new Date(Date.parse(from) + intervalMinutes * 60 * 1000).toISOString();
}

function normalizeDebug(value = {}) {
  const steps = Array.isArray(value?.steps) ? value.steps : [];
  const rules = Array.isArray(value?.rules) ? value.rules : [];
  const ignored = Array.isArray(value?.ignored) ? value.ignored : [];
  const deduplications = Array.isArray(value?.deduplications) ? value.deduplications : [];

  return {
    steps: steps.map((item) => ({
      jobKey: normalizeText(item?.jobKey),
      label: normalizeText(item?.label || item?.jobKey),
      status: normalizeText(item?.status) || 'completed',
      durationMs: toNumber(item?.durationMs, 0) || 0,
      summary: normalizeText(item?.summary),
      payload: item?.payload || {}
    })),
    rules: rules.map((item) => ({
      id: normalizeText(item?.id),
      label: normalizeText(item?.label || item?.id),
      evaluated: toNumber(item?.evaluated, 0) || 0,
      candidates: toNumber(item?.candidates, 0) || 0,
      created: toNumber(item?.created, 0) || 0,
      executed: toNumber(item?.executed, 0) || 0,
      skipped: toNumber(item?.skipped, 0) || 0,
      errors: toNumber(item?.errors, 0) || 0
    })),
    ignored: ignored.map((item) => ({
      label: normalizeText(item?.label),
      reason: normalizeText(item?.reason),
      count: toNumber(item?.count, 0) || 0
    })),
    deduplications: deduplications.map((item) => ({
      label: normalizeText(item?.label),
      targetId: normalizeText(item?.targetId),
      reason: normalizeText(item?.reason)
    }))
  };
}

export function normalizeOperationalEngineState(value = {}) {
  return {
    lastRunAt: value?.lastRunAt || null,
    nextScheduledRunAt: value?.nextScheduledRunAt || null,
    status: normalizeText(value?.status) || 'healthy',
    durationMs: toNumber(value?.durationMs, null),
    cyclesLast24h: toNumber(value?.cyclesLast24h, 0) || 0,
    tasksCreatedLastRun: toNumber(value?.tasksCreatedLastRun, 0) || 0,
    automationsExecutedLastRun: toNumber(value?.automationsExecutedLastRun, 0) || 0,
    rechecksCompletedLastRun: toNumber(value?.rechecksCompletedLastRun, 0) || 0,
    errorsLastRun: toNumber(value?.errorsLastRun, 0) || 0,
    warningsLastRun: toNumber(value?.warningsLastRun, 0) || 0,
    expectedIntervalMinutes: toNumber(value?.expectedIntervalMinutes, DEFAULT_EXPECTED_INTERVAL_MINUTES) || DEFAULT_EXPECTED_INTERVAL_MINUTES,
    currentRunStartedAt: value?.currentRunStartedAt || null,
    lastSummary: normalizeText(value?.lastSummary),
    lastErrorSummary: normalizeText(value?.lastErrorSummary),
    lastTriggerType: normalizeText(value?.lastTriggerType || 'automatic') || 'automatic',
    debug: normalizeDebug(value?.debug || {})
  };
}

export async function readOperationalEngineIntervalMinutes() {
  const setting = await readAdminRuntimeSetting(OPERATIONAL_ENGINE_INTERVAL_KEY);
  const parsed = toNumber(setting?.value?.minutes, DEFAULT_EXPECTED_INTERVAL_MINUTES);
  return parsed || DEFAULT_EXPECTED_INTERVAL_MINUTES;
}

async function countCyclesLast24h() {
  await ensureAdminOpsTables();
  const sql = getDb();
  const [row] = await sql`
    SELECT COUNT(*)::int AS total
    FROM admin_job_runs
    WHERE job_key = 'admin-ops-cycle'
      AND started_at >= now() - interval '24 hours'
  `.catch(() => []);

  return Number(row?.total || 0);
}

export function resolveOperationalEngineStatus(state = {}) {
  const normalized = normalizeOperationalEngineState(state);
  const now = Date.now();
  const intervalMs = normalized.expectedIntervalMinutes * 60 * 1000;

  if (normalized.currentRunStartedAt) {
    const currentRunElapsed = now - Date.parse(normalized.currentRunStartedAt);
    if (Number.isFinite(currentRunElapsed) && currentRunElapsed > intervalMs * 2) {
      return 'delayed';
    }

    return 'running';
  }

  if (normalized.lastErrorSummary) {
    return 'failed';
  }

  if (normalized.lastRunAt) {
    const elapsedMs = now - Date.parse(normalized.lastRunAt);
    if (Number.isFinite(elapsedMs) && elapsedMs > intervalMs * 2) {
      return 'delayed';
    }
  }

  return 'healthy';
}

export async function readOperationalEngineState() {
  const [setting, cyclesLast24h, expectedIntervalMinutes] = await Promise.all([
    readAdminRuntimeSetting(OPERATIONAL_ENGINE_STATE_KEY),
    countCyclesLast24h(),
    readOperationalEngineIntervalMinutes()
  ]);

  const state = normalizeOperationalEngineState({
    ...(setting?.value || {}),
    cyclesLast24h,
    expectedIntervalMinutes
  });

  return {
    ...state,
    status: resolveOperationalEngineStatus(state),
    nextScheduledRunAt:
      state.nextScheduledRunAt ||
      (state.lastRunAt ? buildNextRunAt(state.lastRunAt, expectedIntervalMinutes) : null)
  };
}

export async function updateOperationalEngineState(patch = {}, actor = 'system') {
  const current = await readOperationalEngineState();
  const next = normalizeOperationalEngineState({
    ...current,
    ...patch
  });

  next.status = resolveOperationalEngineStatus(next);

  const saved = await upsertAdminRuntimeSetting({
    settingKey: OPERATIONAL_ENGINE_STATE_KEY,
    value: next,
    actor
  });

  return normalizeOperationalEngineState(saved.value || next);
}

export async function onCycleStart({ actor = 'system', triggerType = 'automatic' } = {}) {
  const expectedIntervalMinutes = await readOperationalEngineIntervalMinutes();
  const now = new Date().toISOString();

  return updateOperationalEngineState(
    {
      status: 'running',
      currentRunStartedAt: now,
      expectedIntervalMinutes,
      nextScheduledRunAt: buildNextRunAt(now, expectedIntervalMinutes),
      lastTriggerType: triggerType
    },
    actor
  );
}

export async function onCycleEnd({
  actor = 'system',
  status = 'healthy',
  startedAt,
  finishedAt,
  summary = '',
  counts = {},
  lastErrorSummary = '',
  debug = {}
} = {}) {
  const expectedIntervalMinutes = await readOperationalEngineIntervalMinutes();
  const completedAt = finishedAt || new Date().toISOString();

  return updateOperationalEngineState(
    {
      lastRunAt: completedAt,
      nextScheduledRunAt: buildNextRunAt(completedAt, expectedIntervalMinutes),
      status,
      durationMs: Math.max(0, Date.parse(completedAt) - Date.parse(startedAt || completedAt)),
      tasksCreatedLastRun: toNumber(counts.tasksCreatedLastRun, 0) || 0,
      automationsExecutedLastRun: toNumber(counts.automationsExecutedLastRun, 0) || 0,
      rechecksCompletedLastRun: toNumber(counts.rechecksCompletedLastRun, 0) || 0,
      errorsLastRun: toNumber(counts.errorsLastRun, 0) || 0,
      warningsLastRun: toNumber(counts.warningsLastRun, 0) || 0,
      currentRunStartedAt: null,
      lastSummary: summary,
      lastErrorSummary: status === 'failed' ? normalizeText(lastErrorSummary || summary) : '',
      debug
    },
    actor
  );
}

export async function recordOperationalEngineEvent({
  type = 'task_created',
  source = 'system',
  targetType = '',
  targetId = '',
  message = '',
  impact = 'low',
  kind = 'info',
  payload = {}
} = {}) {
  if (!normalizeText(message)) return null;

  await ensureAdminOpsTables();
  const sql = getDb();
  const [row] = await sql`
    INSERT INTO operational_engine_events (
      event_type,
      event_source,
      target_type,
      target_id,
      message,
      impact,
      kind,
      payload,
      created_at
    )
    VALUES (
      ${type},
      ${source},
      ${normalizeText(targetType) || null},
      ${normalizeText(targetId) || null},
      ${message},
      ${normalizeText(impact) || 'low'},
      ${normalizeText(kind) || 'info'},
      ${JSON.stringify(payload || {})}::jsonb,
      now()
    )
    RETURNING id, event_type, event_source, target_type, target_id, message, impact, kind, payload, created_at
  `;

  return {
    id: row.id,
    type: row.event_type,
    source: row.event_source,
    targetType: row.target_type || '',
    targetId: row.target_id || '',
    message: row.message || '',
    impact: row.impact || 'low',
    kind: row.kind || 'info',
    payload: row.payload || {},
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
  };
}

export async function readOperationalEngineEvents({ limit = 40 } = {}) {
  await ensureAdminOpsTables();
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      event_type,
      event_source,
      target_type,
      target_id,
      message,
      impact,
      kind,
      payload,
      created_at
    FROM operational_engine_events
    ORDER BY created_at DESC
    LIMIT ${limit}
  `.catch(() => []);

  return rows.map((row) => ({
    id: row.id,
    type: row.event_type,
    source: row.event_source,
    targetType: row.target_type || '',
    targetId: row.target_id || '',
    message: row.message || '',
    impact: row.impact || 'low',
    kind: row.kind || 'info',
    payload: row.payload || {},
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
  }));
}
