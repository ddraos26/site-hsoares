import { promises as fs } from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { loadLocalEnv } from './load-local-env.mjs';

await loadLocalEnv();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não configurada.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const ADMIN_LOG_DIR = path.join(process.cwd(), 'logs', 'admin-intelligence');

async function readJsonl(fileName) {
  const filePath = path.join(ADMIN_LOG_DIR, fileName);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }

    return [];
  }
}

function normalizeApproval(entry) {
  return {
    id: String(entry?.id || entry?.approval_key || '').trim(),
    title: String(entry?.title || 'Aprovação').trim(),
    status: String(entry?.status || 'pending').trim(),
    actor: String(entry?.actor || 'admin').trim(),
    rationale: String(entry?.rationale || '').trim(),
    createdAt: String(entry?.createdAt || entry?.created_at || new Date().toISOString()).trim()
  };
}

function normalizeTask(entry) {
  return {
    id: String(entry?.id || entry?.task_key || '').trim(),
    title: String(entry?.title || '').trim(),
    status: String(entry?.status || 'pending').trim(),
    actor: String(entry?.actor || 'admin').trim(),
    note: String(entry?.note || '').trim(),
    sourceLabel: String(entry?.sourceLabel || entry?.source_label || '').trim(),
    href: String(entry?.href || '').trim(),
    priority: String(entry?.priority || '').trim(),
    createdAt: String(entry?.createdAt || entry?.created_at || new Date().toISOString()).trim()
  };
}

function dedupeByKey(items, keyBuilder) {
  const seen = new Set();

  return items.filter((item) => {
    const key = keyBuilder(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function ensureAdminOpsTables() {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;

  await sql`
    CREATE TABLE IF NOT EXISTS approval_decisions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      approval_key TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      actor TEXT,
      rationale TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS task_state_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_key TEXT NOT NULL,
      status TEXT NOT NULL,
      actor TEXT,
      note TEXT,
      action_type TEXT,
      outcome TEXT,
      title TEXT,
      source_label TEXT,
      href TEXT,
      priority TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_tasks (
      task_id TEXT PRIMARY KEY,
      source_task_id TEXT,
      dedupe_key TEXT,
      title TEXT NOT NULL,
      description TEXT,
      recommendation TEXT,
      source_type TEXT,
      source_label TEXT,
      target_type TEXT,
      target_id TEXT,
      target_label TEXT,
      href TEXT,
      where_to_do TEXT,
      guide_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
      metadata JSONB NOT NULL DEFAULT '[]'::jsonb,
      badges JSONB NOT NULL DEFAULT '[]'::jsonb,
      priority TEXT,
      owner_label TEXT,
      due_label TEXT,
      requires_approval BOOLEAN NOT NULL DEFAULT false,
      created_by TEXT,
      reopen_reason TEXT,
      reopened_from_result TEXT,
      automation_rule_id TEXT,
      automation_mode TEXT,
      is_automatic BOOLEAN NOT NULL DEFAULT false,
      performance_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      result_due_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen_at TIMESTAMPTZ
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS operational_engine_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type TEXT NOT NULL,
      event_source TEXT NOT NULL DEFAULT 'system',
      target_type TEXT,
      target_id TEXT,
      message TEXT NOT NULL,
      impact TEXT NOT NULL DEFAULT 'low',
      kind TEXT NOT NULL DEFAULT 'info',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_approval_decisions_key ON approval_decisions (approval_key, created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_task_state_entries_key ON task_state_entries (task_key, created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_task_state_entries_status ON task_state_entries (status, created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_tasks_dedupe_key ON admin_tasks (dedupe_key, updated_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_tasks_target ON admin_tasks (target_type, target_id, updated_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_tasks_result_due ON admin_tasks (result_due_at, updated_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_tasks_updated_at ON admin_tasks (updated_at DESC, created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_operational_engine_events_created_at ON operational_engine_events (created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_operational_engine_events_type ON operational_engine_events (event_type, created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_operational_engine_events_kind ON operational_engine_events (kind, created_at DESC);`;
}

async function migrateApprovals() {
  const legacyRows = dedupeByKey(
    (await readJsonl('approvals.jsonl')).map(normalizeApproval).filter((item) => item.id),
    (item) => `${item.id}:${item.status}:${item.createdAt}`
  );

  if (!legacyRows.length) {
    return { found: 0, inserted: 0, skipped: 0 };
  }

  const existingRows = await sql`
    SELECT approval_key, status, created_at
    FROM approval_decisions
  `;

  const existingKeys = new Set(
    existingRows.map((row) => `${row.approval_key}:${row.status}:${new Date(row.created_at).toISOString()}`)
  );

  let inserted = 0;
  let skipped = 0;

  for (const row of legacyRows) {
    const key = `${row.id}:${row.status}:${row.createdAt}`;

    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    await sql`
      INSERT INTO approval_decisions (
        approval_key,
        title,
        status,
        actor,
        rationale,
        created_at
      )
      VALUES (
        ${row.id},
        ${row.title || 'Aprovação'},
        ${row.status},
        ${row.actor || 'admin'},
        ${row.rationale || null},
        ${row.createdAt}
      )
    `;

    existingKeys.add(key);
    inserted += 1;
  }

  return { found: legacyRows.length, inserted, skipped };
}

async function migrateTasks() {
  const legacyRows = dedupeByKey(
    (await readJsonl('tasks.jsonl')).map(normalizeTask).filter((item) => item.id),
    (item) => `${item.id}:${item.status}:${item.createdAt}`
  );

  if (!legacyRows.length) {
    return { found: 0, inserted: 0, skipped: 0 };
  }

  const existingRows = await sql`
    SELECT task_key, status, created_at
    FROM task_state_entries
  `;

  const existingKeys = new Set(
    existingRows.map((row) => `${row.task_key}:${row.status}:${new Date(row.created_at).toISOString()}`)
  );

  let inserted = 0;
  let skipped = 0;

  for (const row of legacyRows) {
    const key = `${row.id}:${row.status}:${row.createdAt}`;

    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    await sql`
      INSERT INTO task_state_entries (
        task_key,
        status,
        actor,
        note,
        title,
        source_label,
        href,
        priority,
        created_at
      )
      VALUES (
        ${row.id},
        ${row.status},
        ${row.actor || 'admin'},
        ${row.note || null},
        ${row.title || null},
        ${row.sourceLabel || null},
        ${row.href || null},
        ${row.priority || null},
        ${row.createdAt}
      )
    `;

    existingKeys.add(key);
    inserted += 1;
  }

  return { found: legacyRows.length, inserted, skipped };
}

async function run() {
  await ensureAdminOpsTables();

  const [approvals, tasks] = await Promise.all([migrateApprovals(), migrateTasks()]);

  console.log('Migração de admin ops concluída.');
  console.log(`Approvals: ${approvals.inserted} inseridos, ${approvals.skipped} ignorados, ${approvals.found} encontrados no legado.`);
  console.log(`Tasks: ${tasks.inserted} inseridos, ${tasks.skipped} ignorados, ${tasks.found} encontrados no legado.`);
}

run().catch((error) => {
  console.error('Erro ao migrar admin ops:', error);
  process.exit(1);
});
