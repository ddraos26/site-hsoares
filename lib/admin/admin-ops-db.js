import 'server-only';

import { getDb } from '@/lib/db';

let ensurePromise = null;
const ADMIN_OPS_LOCK_KEY_ONE = 48201;
const ADMIN_OPS_LOCK_KEY_TWO = 31024;

export async function ensureAdminOpsTables() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      const sql = getDb();

      await sql`SELECT pg_advisory_lock(${ADMIN_OPS_LOCK_KEY_ONE}, ${ADMIN_OPS_LOCK_KEY_TWO});`;

      try {
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

        await sql`ALTER TABLE task_state_entries ADD COLUMN IF NOT EXISTS action_type TEXT;`;
        await sql`ALTER TABLE task_state_entries ADD COLUMN IF NOT EXISTS outcome TEXT;`;

        await sql`
          CREATE TABLE IF NOT EXISTS lead_activity_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
            event_type TEXT NOT NULL,
            title TEXT NOT NULL,
            detail TEXT,
            payload JSONB NOT NULL DEFAULT '{}'::jsonb,
            actor TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS automation_executions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            rule_id UUID NULL,
            status TEXT NOT NULL,
            payload JSONB NOT NULL DEFAULT '{}'::jsonb,
            result JSONB NOT NULL DEFAULT '{}'::jsonb,
            executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS automation_operations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            operation_key TEXT NOT NULL UNIQUE,
            source_type TEXT NOT NULL DEFAULT 'automation',
            source_id TEXT,
            category TEXT NOT NULL DEFAULT 'general',
            lane TEXT NOT NULL DEFAULT 'operations',
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'ready',
            execution_mode TEXT NOT NULL DEFAULT 'approval_required',
            requires_approval BOOLEAN NOT NULL DEFAULT false,
            priority TEXT,
            owner_label TEXT,
            context_href TEXT,
            queue_href TEXT,
            operation_href TEXT,
            site_href TEXT,
            payload JSONB NOT NULL DEFAULT '{}'::jsonb,
            result JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            completed_at TIMESTAMPTZ
          );
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS admin_runtime_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            setting_key TEXT NOT NULL UNIQUE,
            value JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_by TEXT,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS admin_job_runs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            job_key TEXT NOT NULL,
            trigger_type TEXT NOT NULL DEFAULT 'manual',
            status TEXT NOT NULL,
            actor TEXT,
            summary TEXT,
            payload JSONB NOT NULL DEFAULT '{}'::jsonb,
            started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            finished_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

        await sql`
          CREATE TABLE IF NOT EXISTS page_decision_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            page_path TEXT NOT NULL,
            label TEXT NOT NULL,
            status TEXT NOT NULL,
            detail TEXT,
            actor TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS admin_daily_checklist_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            checklist_date DATE NOT NULL,
            item_key TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            bucket TEXT,
            href TEXT,
            position INTEGER NOT NULL DEFAULT 0,
            is_done BOOLEAN NOT NULL DEFAULT false,
            done_at TIMESTAMPTZ,
            source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_by TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (checklist_date, item_key)
          );
        `;

        await sql`CREATE INDEX IF NOT EXISTS idx_approval_decisions_key ON approval_decisions (approval_key, created_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_admin_tasks_dedupe_key ON admin_tasks (dedupe_key, updated_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_admin_tasks_target ON admin_tasks (target_type, target_id, updated_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_admin_tasks_result_due ON admin_tasks (result_due_at, updated_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_admin_tasks_updated_at ON admin_tasks (updated_at DESC, created_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_task_state_entries_key ON task_state_entries (task_key, created_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_task_state_entries_status ON task_state_entries (status, created_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_lead_activity_events_lead_id ON lead_activity_events (lead_id, created_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_lead_activity_events_created_at ON lead_activity_events (created_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_automation_executions_executed_at ON automation_executions (executed_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_automation_operations_status ON automation_operations (status, updated_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_automation_operations_source ON automation_operations (source_type, source_id, updated_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_admin_runtime_settings_key ON admin_runtime_settings (setting_key, updated_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_admin_job_runs_key ON admin_job_runs (job_key, started_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_admin_job_runs_status ON admin_job_runs (status, started_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_operational_engine_events_created_at ON operational_engine_events (created_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_operational_engine_events_type ON operational_engine_events (event_type, created_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_operational_engine_events_kind ON operational_engine_events (kind, created_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_admin_daily_checklist_items_date ON admin_daily_checklist_items (checklist_date, position ASC, updated_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_page_decision_history_page ON page_decision_history (page_path, created_at DESC);`;
      } finally {
        await sql`SELECT pg_advisory_unlock(${ADMIN_OPS_LOCK_KEY_ONE}, ${ADMIN_OPS_LOCK_KEY_TWO});`;
      }
    })();
  }

  return ensurePromise;
}
