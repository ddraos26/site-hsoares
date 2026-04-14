import 'server-only';

import { getDb } from '@/lib/db';
import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';

export async function recordPageRecommendation({ pagePath, label, status, detail = '', actor = 'system' }) {
  await ensureAdminOpsTables();
  const sql = getDb();

  const [row] = await sql`
    INSERT INTO page_decision_history (page_path, label, status, detail, actor)
    VALUES (${pagePath}, ${label}, ${status}, ${detail}, ${actor})
    RETURNING id, page_path, label, status, detail, actor, created_at
  `;

  return {
    id: row.id,
    pagePath: row.page_path,
    label: row.label,
    status: row.status,
    detail: row.detail,
    actor: row.actor,
    createdAt: row.created_at
  };
}

export async function readPageRecommendations(pagePath, { limit = 20 } = {}) {
  await ensureAdminOpsTables();
  const sql = getDb();

  const rows = await sql`
    SELECT id, page_path, label, status, detail, actor, created_at
    FROM page_decision_history
    WHERE page_path = ${pagePath}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    pagePath: row.page_path,
    label: row.label,
    status: row.status,
    detail: row.detail,
    actor: row.actor,
    createdAt: row.created_at
  }));
}
