import { neon } from '@neondatabase/serverless';
import { loadLocalEnv } from './load-local-env.mjs';

await loadLocalEnv();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não configurada.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      porto_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ativo',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'produto';`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS priority_weight INTEGER NOT NULL DEFAULT 50;`;

  await sql`
    CREATE TABLE IF NOT EXISTS page_views (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_path TEXT NOT NULL,
      product_slug TEXT,
      session_id TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      referrer TEXT,
      user_agent TEXT,
      ip_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS conversion_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type TEXT NOT NULL,
      page_path TEXT,
      product_slug TEXT,
      click_id TEXT,
      session_id TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      referrer TEXT,
      user_agent TEXT,
      ip_address TEXT,
      payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT,
      whatsapp TEXT,
      email TEXT,
      product_slug TEXT,
      page_path TEXT,
      click_id TEXT,
      session_id TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      referrer TEXT,
      user_agent TEXT,
      ip_address TEXT,
      lead_status TEXT NOT NULL DEFAULT 'novo',
      owner_name TEXT,
      next_contact_at TIMESTAMPTZ,
      loss_reason TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_name TEXT;`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_contact_at TIMESTAMPTZ;`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS loss_reason TEXT;`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;`;

  await sql`
    CREATE TABLE IF NOT EXISTS lead_attachments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      content_type TEXT,
      file_size_bytes INTEGER,
      content_base64 TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      url TEXT NOT NULL,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      page_type TEXT NOT NULL DEFAULT 'landing',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      external_id TEXT,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      budget_daily NUMERIC(12, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS keywords (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      text TEXT NOT NULL,
      campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS query_metric_snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      query TEXT NOT NULL,
      page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
      clicks INTEGER NOT NULL DEFAULT 0,
      impressions INTEGER NOT NULL DEFAULT 0,
      ctr NUMERIC(10, 2) NOT NULL DEFAULT 0,
      position NUMERIC(10, 2) NOT NULL DEFAULT 0,
      date DATE NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS analytics_snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
      sessions INTEGER NOT NULL DEFAULT 0,
      users_count INTEGER NOT NULL DEFAULT 0,
      engagement_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
      avg_time_seconds NUMERIC(12, 2) NOT NULL DEFAULT 0,
      conversions INTEGER NOT NULL DEFAULT 0,
      date DATE NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS campaign_snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
      clicks INTEGER NOT NULL DEFAULT 0,
      impressions INTEGER NOT NULL DEFAULT 0,
      ctr NUMERIC(10, 2) NOT NULL DEFAULT 0,
      cpc NUMERIC(12, 2) NOT NULL DEFAULT 0,
      cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
      conversions INTEGER NOT NULL DEFAULT 0,
      cpa NUMERIC(12, 2) NOT NULL DEFAULT 0,
      date DATE NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS product_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      opportunity_score INTEGER NOT NULL DEFAULT 0,
      profit_priority_score INTEGER NOT NULL DEFAULT 0,
      urgency_score INTEGER NOT NULL DEFAULT 0,
      date DATE NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS page_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
      health_score INTEGER NOT NULL DEFAULT 0,
      conversion_score INTEGER NOT NULL DEFAULT 0,
      urgency_score INTEGER NOT NULL DEFAULT 0,
      date DATE NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS campaign_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
      health_score INTEGER NOT NULL DEFAULT 0,
      efficiency_score INTEGER NOT NULL DEFAULT 0,
      urgency_score INTEGER NOT NULL DEFAULT 0,
      date DATE NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ai_insights (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      scope_type TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      insight_type TEXT NOT NULL,
      title TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      reason TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      priority TEXT NOT NULL,
      impact_estimate TEXT,
      requires_approval BOOLEAN NOT NULL DEFAULT false,
      status TEXT NOT NULL DEFAULT 'active',
      source_rule_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS automation_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      trigger TEXT NOT NULL,
      condition_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      action_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      requires_approval BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS automation_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
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
    CREATE TABLE IF NOT EXISTS daily_missions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      weekly_summary TEXT,
      top_priority TEXT,
      actions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ai_usage_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      estimated_cost NUMERIC(12, 4) NOT NULL DEFAULT 0,
      mode TEXT NOT NULL DEFAULT 'intermediate',
      workflow TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

  await sql`CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_created_at ON conversion_events (created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_event_type ON conversion_events (event_type);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (lead_status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_lead_attachments_lead_id ON lead_attachments (lead_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pages_product_id ON pages (product_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_product_id ON campaigns (product_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_keywords_campaign_id ON keywords (campaign_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_query_metric_snapshots_page_id_date ON query_metric_snapshots (page_id, date DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_page_id_date ON analytics_snapshots (page_id, date DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_campaign_snapshots_campaign_id_date ON campaign_snapshots (campaign_id, date DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_scores_product_id_date ON product_scores (product_id, date DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_page_scores_page_id_date ON page_scores (page_id, date DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_campaign_scores_campaign_id_date ON campaign_scores (campaign_id, date DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ai_insights_scope ON ai_insights (scope_type, scope_id, created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_automation_executions_rule_id ON automation_executions (rule_id, executed_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs (created_at DESC);`;
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
  await sql`CREATE INDEX IF NOT EXISTS idx_automation_operations_status ON automation_operations (status, updated_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_automation_operations_source ON automation_operations (source_type, source_id, updated_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_lead_activity_events_lead_id ON lead_activity_events (lead_id, created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_lead_activity_events_created_at ON lead_activity_events (created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_job_runs_key ON admin_job_runs (job_key, started_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_job_runs_status ON admin_job_runs (status, started_at DESC);`;

  console.log('Banco configurado com sucesso.');
}

run().catch((error) => {
  console.error('Erro ao configurar banco:', error);
  process.exit(1);
});
