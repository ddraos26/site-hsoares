import 'server-only';

import { getDb } from '@/lib/db';
import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';

function normalizeMission(mission = {}) {
  return {
    date: String(mission.date || new Date().toISOString().slice(0, 10)).slice(0, 10),
    summary: String(mission.summary || '').trim(),
    weeklySummary: String(mission.weeklySummary || '').trim(),
    topPriority: String(mission.topPriority || '').trim(),
    actions: Array.isArray(mission.actions) ? mission.actions : []
  };
}

export async function upsertDailyMission(mission) {
  await ensureAdminOpsTables();
  const payload = normalizeMission(mission);
  const sql = getDb();

  const [row] = await sql`
    INSERT INTO daily_missions (
      date,
      summary,
      weekly_summary,
      top_priority,
      actions_json,
      created_at
    )
    VALUES (
      ${payload.date},
      ${payload.summary || 'Missão gerada automaticamente.'},
      ${payload.weeklySummary || null},
      ${payload.topPriority || null},
      ${JSON.stringify(payload.actions)}::jsonb,
      now()
    )
    ON CONFLICT (date) DO UPDATE SET
      summary = EXCLUDED.summary,
      weekly_summary = EXCLUDED.weekly_summary,
      top_priority = EXCLUDED.top_priority,
      actions_json = EXCLUDED.actions_json
    RETURNING id, date, summary, weekly_summary, top_priority, actions_json, created_at
  `;

  return {
    id: row.id,
    date: row.date,
    summary: row.summary,
    weeklySummary: row.weekly_summary,
    topPriority: row.top_priority,
    actions: Array.isArray(row.actions_json) ? row.actions_json : [],
    createdAt: row.created_at
  };
}

export async function readRecentDailyMissions(limit = 7) {
  await ensureAdminOpsTables();
  const sql = getDb();
  const rows = await sql`
    SELECT id, date, summary, weekly_summary, top_priority, actions_json, created_at
    FROM daily_missions
    ORDER BY date DESC
    LIMIT ${limit}
  `.catch(() => []);

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    summary: row.summary,
    weeklySummary: row.weekly_summary,
    topPriority: row.top_priority,
    actions: Array.isArray(row.actions_json) ? row.actions_json : [],
    createdAt: row.created_at
  }));
}
