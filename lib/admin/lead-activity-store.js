import 'server-only';

import { getDb } from '@/lib/db';
import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';

function normalizeLeadActivity(entry) {
  return {
    id: entry.id,
    leadId: entry.lead_id || entry.leadId,
    eventType: entry.event_type || entry.eventType || 'update',
    title: entry.title || 'Lead atualizado',
    detail: entry.detail || '',
    payload: entry.payload || {},
    actor: entry.actor || 'sistema',
    createdAt: entry.created_at || entry.createdAt || new Date().toISOString()
  };
}

export async function recordLeadActivity({
  leadId,
  eventType,
  title,
  detail,
  payload = {},
  actor = 'sistema'
}) {
  await ensureAdminOpsTables();

  const sql = getDb();
  const [row] = await sql`
    INSERT INTO lead_activity_events (
      lead_id,
      event_type,
      title,
      detail,
      payload,
      actor
    )
    VALUES (
      ${leadId},
      ${eventType || 'update'},
      ${title || 'Lead atualizado'},
      ${detail || null},
      ${JSON.stringify(payload)}::jsonb,
      ${actor}
    )
    RETURNING id, lead_id, event_type, title, detail, payload, actor, created_at
  `;

  return normalizeLeadActivity(row);
}

export async function readRecentLeadActivities({ leadId = null, limit = 60 } = {}) {
  await ensureAdminOpsTables();

  const sql = getDb();
  const rows = leadId
    ? await sql`
        SELECT id, lead_id, event_type, title, detail, payload, actor, created_at
        FROM lead_activity_events
        WHERE lead_id = ${leadId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT id, lead_id, event_type, title, detail, payload, actor, created_at
        FROM lead_activity_events
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

  return rows.map(normalizeLeadActivity);
}
