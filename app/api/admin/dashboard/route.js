import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function resolveRange(searchParams) {
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
  const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return { fromDate, toDate };
}

export async function GET(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const { fromDate, toDate } = resolveRange(searchParams);

    const [viewsRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM page_views
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    `;

    const [clicksRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM conversion_events
      WHERE event_type = 'porto_click'
        AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    `;

    const [leadsRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM leads
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    `;

    const topPages = await sql`
      SELECT page_path, COUNT(*)::int AS views
      FROM page_views
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
      GROUP BY page_path
      ORDER BY views DESC
      LIMIT 10
    `;

    const topProducts = await sql`
      SELECT product_slug, COUNT(*)::int AS clicks
      FROM conversion_events
      WHERE event_type = 'porto_click'
        AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
      GROUP BY product_slug
      ORDER BY clicks DESC
      LIMIT 10
    `;

    const ctrByPage = await sql`
      WITH views AS (
        SELECT page_path, COUNT(*)::float AS views
        FROM page_views
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY page_path
      ),
      clicks AS (
        SELECT page_path, COUNT(*)::float AS clicks
        FROM conversion_events
        WHERE event_type = 'porto_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY page_path
      )
      SELECT
        v.page_path,
        ROUND((((COALESCE(c.clicks, 0) / NULLIF(v.views, 0)) * 100)::numeric), 2) AS ctr
      FROM views v
      LEFT JOIN clicks c ON c.page_path = v.page_path
      ORDER BY ctr DESC
      LIMIT 20
    `;

    const totalViews = viewsRow?.total || 0;
    const totalClicks = clicksRow?.total || 0;

    return NextResponse.json({
      summary: {
        totalViews,
        totalClicks,
        totalLeads: leadsRow?.total || 0,
        ctr: totalViews ? Number(((totalClicks / totalViews) * 100).toFixed(2)) : 0
      },
      topPages,
      topProducts,
      ctrByPage
    });
  } catch (error) {
    console.error('dashboard error', error);
    return NextResponse.json({ error: 'Falha ao carregar dashboard.' }, { status: 500 });
  }
}
