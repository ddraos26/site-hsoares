import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { products as catalogProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

function sanitize(value, limit = 120) {
  return String(value || '').trim().slice(0, limit);
}

function resolveRange(searchParams) {
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
  const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return { fromDate, toDate };
}

const catalogMap = new Map(
  catalogProducts.map((product) => [product.slug, { name: product.name, category: product.category }])
);

export async function GET(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const { fromDate, toDate } = resolveRange(searchParams);
    const query = sanitize(searchParams.get('q'));
    const queryLike = query ? `%${query}%` : null;

    const rows = await sql`
      WITH product_views AS (
        SELECT
          split_part(replace(page_path, '/produtos/', ''), '/', 1) AS product_slug,
          COUNT(*)::int AS views
        FROM page_views
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
          AND page_path LIKE '/produtos/%'
        GROUP BY 1
      ),
      product_clicks AS (
        SELECT
          product_slug,
          COUNT(*)::int AS clicks
        FROM conversion_events
        WHERE event_type = 'porto_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
          AND product_slug IS NOT NULL
        GROUP BY 1
      ),
      product_leads AS (
        SELECT
          product_slug,
          COUNT(*)::int AS leads,
          COUNT(*) FILTER (WHERE lead_status = 'ganho')::int AS ganhos,
          COUNT(*) FILTER (WHERE lead_status = 'perdido')::int AS perdidos,
          MAX(created_at) AS last_lead_at
        FROM leads
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
          AND product_slug IS NOT NULL
        GROUP BY 1
      ),
      product_names AS (
        SELECT slug AS product_slug, name, category
        FROM products
      )
      SELECT
        COALESCE(n.product_slug, v.product_slug, c.product_slug, l.product_slug) AS product_slug,
        n.name,
        n.category,
        COALESCE(v.views, 0) AS views,
        COALESCE(c.clicks, 0) AS clicks,
        COALESCE(l.leads, 0) AS leads,
        COALESCE(l.ganhos, 0) AS ganhos,
        COALESCE(l.perdidos, 0) AS perdidos,
        l.last_lead_at,
        ROUND(((COALESCE(c.clicks, 0)::numeric / NULLIF(COALESCE(v.views, 0), 0)) * 100), 2) AS click_rate,
        ROUND(((COALESCE(l.leads, 0)::numeric / NULLIF(COALESCE(c.clicks, 0), 0)) * 100), 2) AS lead_rate
      FROM product_views v
      FULL OUTER JOIN product_clicks c ON c.product_slug = v.product_slug
      FULL OUTER JOIN product_leads l ON l.product_slug = COALESCE(v.product_slug, c.product_slug)
      FULL OUTER JOIN product_names n ON n.product_slug = COALESCE(v.product_slug, c.product_slug, l.product_slug)
      WHERE COALESCE(n.product_slug, v.product_slug, c.product_slug, l.product_slug) IS NOT NULL
        AND (
          ${queryLike}::text IS NULL
          OR COALESCE(n.product_slug, v.product_slug, c.product_slug, l.product_slug) ILIKE ${queryLike}
          OR COALESCE(n.name, '') ILIKE ${queryLike}
          OR COALESCE(n.category, '') ILIKE ${queryLike}
        )
      ORDER BY COALESCE(l.leads, 0) DESC, COALESCE(c.clicks, 0) DESC, COALESCE(v.views, 0) DESC
    `;

    const items = rows.map((row) => {
      const catalog = catalogMap.get(row.product_slug) || {};
      return {
        slug: row.product_slug,
        name: row.name || catalog.name || row.product_slug,
        category: row.category || catalog.category || 'Sem categoria',
        views: row.views || 0,
        clicks: row.clicks || 0,
        leads: row.leads || 0,
        ganhos: row.ganhos || 0,
        perdidos: row.perdidos || 0,
        clickRate: Number(row.click_rate || 0),
        leadRate: Number(row.lead_rate || 0),
        lastLeadAt: row.last_lead_at || null,
        siteUrl: `/produtos/${row.product_slug}`
      };
    });

    const summary = {
      totalProducts: items.length,
      activeWithViews: items.filter((item) => item.views > 0).length,
      activeWithClicks: items.filter((item) => item.clicks > 0).length,
      activeWithLeads: items.filter((item) => item.leads > 0).length,
      totalLeads: items.reduce((sum, item) => sum + item.leads, 0),
      totalClicks: items.reduce((sum, item) => sum + item.clicks, 0),
      totalViews: items.reduce((sum, item) => sum + item.views, 0)
    };

    return NextResponse.json({ summary, items });
  } catch (error) {
    console.error('admin products error', error);
    return NextResponse.json({ error: 'Falha ao carregar produtos.' }, { status: 500 });
  }
}
