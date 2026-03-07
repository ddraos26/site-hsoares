import { neon } from '@neondatabase/serverless';

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

  await sql`CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_created_at ON conversion_events (created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_event_type ON conversion_events (event_type);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (lead_status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_lead_attachments_lead_id ON lead_attachments (lead_id);`;

  console.log('Banco configurado com sucesso.');
}

run().catch((error) => {
  console.error('Erro ao configurar banco:', error);
  process.exit(1);
});
