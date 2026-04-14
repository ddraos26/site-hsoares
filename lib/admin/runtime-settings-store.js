import 'server-only';

import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';
import { getDb } from '@/lib/db';

export async function readAdminRuntimeSetting(settingKey) {
  await ensureAdminOpsTables();
  const sql = getDb();

  const [row] = await sql`
    SELECT setting_key, value, updated_by, updated_at
    FROM admin_runtime_settings
    WHERE setting_key = ${settingKey}
    LIMIT 1
  `;

  if (!row) return null;

  return {
    key: row.setting_key,
    value: row.value || null,
    updatedBy: row.updated_by || null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

export async function upsertAdminRuntimeSetting({ settingKey, value, actor = 'admin' }) {
  await ensureAdminOpsTables();
  const sql = getDb();

  const [row] = await sql`
    INSERT INTO admin_runtime_settings (setting_key, value, updated_by, updated_at)
    VALUES (${settingKey}, ${JSON.stringify(value || {})}::jsonb, ${actor}, now())
    ON CONFLICT (setting_key)
    DO UPDATE SET
      value = EXCLUDED.value,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
    RETURNING setting_key, value, updated_by, updated_at
  `;

  return {
    key: row.setting_key,
    value: row.value || null,
    updatedBy: row.updated_by || null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

export async function deleteAdminRuntimeSetting(settingKey) {
  await ensureAdminOpsTables();
  const sql = getDb();

  await sql`
    DELETE FROM admin_runtime_settings
    WHERE setting_key = ${settingKey}
  `;
}
