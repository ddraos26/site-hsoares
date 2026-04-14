import 'server-only';

import { getDb } from '@/lib/db';
import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';

function normalizeJobRow(row) {
  const startedAt = row.started_at instanceof Date ? row.started_at.toISOString() : row.started_at;
  const finishedAt = row.finished_at instanceof Date ? row.finished_at.toISOString() : row.finished_at;

  return {
    id: row.id,
    jobKey: row.job_key,
    triggerType: row.trigger_type || 'manual',
    status: row.status || 'completed',
    actor: row.actor || 'system',
    summary: row.summary || '',
    payload: row.payload || {},
    startedAt: startedAt || finishedAt || new Date().toISOString(),
    finishedAt: finishedAt || startedAt || new Date().toISOString()
  };
}

function latestByJobKey(items = []) {
  const latest = new Map();

  for (const item of items) {
    if (!item?.jobKey || latest.has(item.jobKey)) continue;
    latest.set(item.jobKey, item);
  }

  return latest;
}

function formatJobLabel(jobKey) {
  return (
    {
      'daily-mission-refresh': 'Missão do dia',
      'ready-operations-sweep': 'Fila pronta',
      'impact-review-monitor': 'Revisão de impacto',
      'daily-google-ads-sync': 'Google Ads sync',
      'daily-page-review': 'Revisão de páginas',
      'operational-automation-engine': 'Motor de automações',
      'task-result-recheck': 'Leitura de resultados',
      'admin-ops-cycle': 'Ciclo completo'
    }[jobKey] || jobKey
  );
}

export async function recordAdminJobRun({
  jobKey,
  triggerType = 'manual',
  status = 'completed',
  actor = 'system',
  summary = '',
  payload = {},
  startedAt,
  finishedAt
}) {
  if (!jobKey) {
    throw new Error('jobKey é obrigatório para registrar um job.');
  }

  await ensureAdminOpsTables();
  const sql = getDb();
  const [row] = await sql`
    INSERT INTO admin_job_runs (
      job_key,
      trigger_type,
      status,
      actor,
      summary,
      payload,
      started_at,
      finished_at
    )
    VALUES (
      ${jobKey},
      ${triggerType},
      ${status},
      ${actor},
      ${summary || null},
      ${JSON.stringify(payload || {})}::jsonb,
      ${startedAt || new Date().toISOString()},
      ${finishedAt || new Date().toISOString()}
    )
    RETURNING id, job_key, trigger_type, status, actor, summary, payload, started_at, finished_at
  `;

  return normalizeJobRow(row);
}

export async function readAdminJobRuns({ limit = 20 } = {}) {
  await ensureAdminOpsTables();
  const sql = getDb();
  const rows = await sql`
    SELECT id, job_key, trigger_type, status, actor, summary, payload, started_at, finished_at
    FROM admin_job_runs
    ORDER BY started_at DESC, finished_at DESC
    LIMIT ${limit}
  `.catch(() => []);

  return rows.map(normalizeJobRow);
}

export async function getAdminJobsSnapshot({ limit = 12 } = {}) {
  const items = await readAdminJobRuns({ limit });
  const latest = latestByJobKey(items);

  const summary = items.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === 'completed') acc.completed += 1;
      if (item.status === 'degraded') acc.degraded += 1;
      if (item.status === 'failed') acc.failed += 1;
      if (item.status === 'skipped') acc.skipped += 1;
      return acc;
    },
    { total: 0, completed: 0, degraded: 0, failed: 0, skipped: 0 }
  );

  return {
    checkedAt: new Date().toISOString(),
    summary: {
      ...summary,
      activeCatalog: 7,
      lastCycleAt: latest.get('admin-ops-cycle')?.finishedAt || null
    },
    focus: {
      lastCycle: latest.get('admin-ops-cycle') || null,
      lastMissionRefresh: latest.get('daily-mission-refresh') || null,
      lastQueueSweep: latest.get('ready-operations-sweep') || null,
      lastReviewMonitor: latest.get('impact-review-monitor') || null,
      lastAutomationEngine: latest.get('operational-automation-engine') || null,
      lastResultRecheck: latest.get('task-result-recheck') || null
    },
    items: items.map((item) => ({
      ...item,
      label: formatJobLabel(item.jobKey)
    }))
  };
}
