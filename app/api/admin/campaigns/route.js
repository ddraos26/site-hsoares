import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function sanitize(value, limit = 160) {
  return String(value || '').trim().slice(0, limit);
}

function resolveRange(searchParams) {
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
  const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return { fromDate, toDate };
}

function normalizeLabel(source, medium, campaign) {
  const parts = [source || 'sem-source', medium || 'sem-medium', campaign || 'sem-campaign'];
  return parts.join(' / ');
}

export async function GET(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const { fromDate, toDate } = resolveRange(searchParams);
    const query = sanitize(searchParams.get('q'));
    const queryLike = query ? `%${query}%` : null;

    const rows = await sql`
      WITH views AS (
        SELECT
          COALESCE(utm_source, '') AS utm_source,
          COALESCE(utm_medium, '') AS utm_medium,
          COALESCE(utm_campaign, '') AS utm_campaign,
          COUNT(*)::int AS views
        FROM page_views
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY 1, 2, 3
      ),
      clicks AS (
        SELECT
          COALESCE(utm_source, '') AS utm_source,
          COALESCE(utm_medium, '') AS utm_medium,
          COALESCE(utm_campaign, '') AS utm_campaign,
          COUNT(*)::int AS clicks
        FROM conversion_events
        WHERE event_type = 'porto_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY 1, 2, 3
      ),
      leads_by_campaign AS (
        SELECT
          COALESCE(utm_source, '') AS utm_source,
          COALESCE(utm_medium, '') AS utm_medium,
          COALESCE(utm_campaign, '') AS utm_campaign,
          COUNT(*)::int AS leads,
          COUNT(*) FILTER (WHERE lead_status = 'ganho')::int AS ganhos,
          COUNT(*) FILTER (WHERE lead_status = 'perdido')::int AS perdidos
        FROM leads
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY 1, 2, 3
      )
      SELECT
        COALESCE(v.utm_source, c.utm_source, l.utm_source) AS utm_source,
        COALESCE(v.utm_medium, c.utm_medium, l.utm_medium) AS utm_medium,
        COALESCE(v.utm_campaign, c.utm_campaign, l.utm_campaign) AS utm_campaign,
        COALESCE(v.views, 0) AS views,
        COALESCE(c.clicks, 0) AS clicks,
        COALESCE(l.leads, 0) AS leads,
        COALESCE(l.ganhos, 0) AS ganhos,
        COALESCE(l.perdidos, 0) AS perdidos,
        ROUND(((COALESCE(c.clicks, 0)::numeric / NULLIF(COALESCE(v.views, 0), 0)) * 100), 2) AS click_rate,
        ROUND(((COALESCE(l.leads, 0)::numeric / NULLIF(COALESCE(c.clicks, 0), 0)) * 100), 2) AS lead_rate
      FROM views v
      FULL OUTER JOIN clicks c ON c.utm_source = v.utm_source AND c.utm_medium = v.utm_medium AND c.utm_campaign = v.utm_campaign
      FULL OUTER JOIN leads_by_campaign l ON l.utm_source = COALESCE(v.utm_source, c.utm_source)
        AND l.utm_medium = COALESCE(v.utm_medium, c.utm_medium)
        AND l.utm_campaign = COALESCE(v.utm_campaign, c.utm_campaign)
      WHERE (
        ${queryLike}::text IS NULL
        OR COALESCE(v.utm_source, c.utm_source, l.utm_source, '') ILIKE ${queryLike}
        OR COALESCE(v.utm_medium, c.utm_medium, l.utm_medium, '') ILIKE ${queryLike}
        OR COALESCE(v.utm_campaign, c.utm_campaign, l.utm_campaign, '') ILIKE ${queryLike}
      )
      ORDER BY COALESCE(l.leads, 0) DESC, COALESCE(c.clicks, 0) DESC, COALESCE(v.views, 0) DESC
      LIMIT 200
    `;

    const items = rows.map((row) => ({
      source: row.utm_source || '',
      medium: row.utm_medium || '',
      campaign: row.utm_campaign || '',
      label: normalizeLabel(row.utm_source, row.utm_medium, row.utm_campaign),
      views: row.views || 0,
      clicks: row.clicks || 0,
      leads: row.leads || 0,
      ganhos: row.ganhos || 0,
      perdidos: row.perdidos || 0,
      clickRate: Number(row.click_rate || 0),
      leadRate: Number(row.lead_rate || 0)
    }));

    const summary = {
      totalCampaigns: items.length,
      totalViews: items.reduce((sum, item) => sum + item.views, 0),
      totalClicks: items.reduce((sum, item) => sum + item.clicks, 0),
      totalLeads: items.reduce((sum, item) => sum + item.leads, 0),
      campaignsWithLeads: items.filter((item) => item.leads > 0).length
    };

    return NextResponse.json({ summary, items });
  } catch (error) {
    console.error('admin campaigns error', error);
    return NextResponse.json({ error: 'Falha ao carregar campanhas.' }, { status: 500 });
  }
}
