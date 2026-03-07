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

export async function GET(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const { fromDate, toDate } = resolveRange(searchParams);
    const query = sanitize(searchParams.get('q'));
    const queryLike = query ? `%${query}%` : null;

    const rows = await sql`
      WITH views AS (
        SELECT page_path, COUNT(*)::int AS views
        FROM page_views
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY page_path
      ),
      clicks AS (
        SELECT page_path, COUNT(*)::int AS clicks
        FROM conversion_events
        WHERE event_type = 'porto_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY page_path
      ),
      leads_by_page AS (
        SELECT page_path, COUNT(*)::int AS leads
        FROM leads
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY page_path
      )
      SELECT
        COALESCE(v.page_path, c.page_path, l.page_path) AS page_path,
        COALESCE(v.views, 0) AS views,
        COALESCE(c.clicks, 0) AS clicks,
        COALESCE(l.leads, 0) AS leads,
        ROUND(((COALESCE(c.clicks, 0)::numeric / NULLIF(COALESCE(v.views, 0), 0)) * 100), 2) AS click_rate,
        ROUND(((COALESCE(l.leads, 0)::numeric / NULLIF(COALESCE(v.views, 0), 0)) * 100), 2) AS lead_rate
      FROM views v
      FULL OUTER JOIN clicks c ON c.page_path = v.page_path
      FULL OUTER JOIN leads_by_page l ON l.page_path = COALESCE(v.page_path, c.page_path)
      WHERE COALESCE(v.page_path, c.page_path, l.page_path) IS NOT NULL
        AND (
          ${queryLike}::text IS NULL
          OR COALESCE(v.page_path, c.page_path, l.page_path) ILIKE ${queryLike}
        )
      ORDER BY COALESCE(v.views, 0) DESC, COALESCE(c.clicks, 0) DESC, COALESCE(l.leads, 0) DESC
      LIMIT 200
    `;

    const items = rows.map((row) => ({
      pagePath: row.page_path,
      views: row.views || 0,
      clicks: row.clicks || 0,
      leads: row.leads || 0,
      clickRate: Number(row.click_rate || 0),
      leadRate: Number(row.lead_rate || 0)
    }));

    const summary = {
      totalPages: items.length,
      totalViews: items.reduce((sum, item) => sum + item.views, 0),
      totalClicks: items.reduce((sum, item) => sum + item.clicks, 0),
      totalLeads: items.reduce((sum, item) => sum + item.leads, 0),
      pagesWithLeads: items.filter((item) => item.leads > 0).length
    };

    return NextResponse.json({ summary, items });
  } catch (error) {
    console.error('admin pages error', error);
    return NextResponse.json({ error: 'Falha ao carregar páginas.' }, { status: 500 });
  }
}
