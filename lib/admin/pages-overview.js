import { getDb } from '@/lib/db';
import {
  buildPagesCommandCenter,
  decoratePageForDecision
} from '@/lib/admin/modules/command-center/domain/decision-models';
import { buildPageDecisionLinks } from '@/lib/admin/modules/command-center/application/action-queue';

function sanitize(value, limit = 160) {
  return String(value || '').trim().slice(0, limit);
}

export function getDefaultPagesRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10)
  };
}

export function resolvePagesRange({ from, to } = {}) {
  const fallback = getDefaultPagesRange();
  const safeFrom = from || fallback.from;
  const safeTo = to || fallback.to;

  return {
    from: safeFrom,
    to: safeTo,
    fromDate: new Date(`${safeFrom}T00:00:00.000Z`),
    toDate: new Date(`${safeTo}T23:59:59.999Z`)
  };
}

function detectPageType(pagePath) {
  if (!pagePath || pagePath === '/') return 'Home';
  if (pagePath.startsWith('/produtos/')) return 'Produto';
  if (pagePath.startsWith('/blog/')) return 'Blog';
  if (pagePath.startsWith('/institucional') || pagePath.startsWith('/sobre')) return 'Institucional';
  return 'Página';
}

function extractProductSlug(pagePath) {
  if (!pagePath || !pagePath.startsWith('/produtos/')) return null;
  return pagePath.replace('/produtos/', '').split('/')[0] || null;
}

export async function getAdminPagesSnapshot({ from, to, q, limit } = {}) {
  const sql = getDb();
  const { fromDate, toDate } = resolvePagesRange({ from, to });
  const query = sanitize(q);
  const queryLike = query ? `%${query}%` : null;
  const limitValue = limit || 200;

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
      SELECT
        page_path,
        COUNT(*)::int AS leads,
        MAX(created_at) AS last_lead_at
      FROM leads
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
      GROUP BY page_path
    )
    SELECT
      COALESCE(v.page_path, c.page_path, l.page_path) AS page_path,
      COALESCE(v.views, 0) AS views,
      COALESCE(c.clicks, 0) AS clicks,
      COALESCE(l.leads, 0) AS leads,
      l.last_lead_at,
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
    LIMIT ${limitValue}
  `;

  const items = rows.map((row) => {
    const item = decoratePageForDecision({
      pagePath: row.page_path,
      pageType: detectPageType(row.page_path),
      productSlug: extractProductSlug(row.page_path),
      views: row.views || 0,
      clicks: row.clicks || 0,
      leads: row.leads || 0,
      clickRate: Number(row.click_rate || 0),
      leadRate: Number(row.lead_rate || 0),
      lastLeadAt: row.last_lead_at || null,
      siteUrl: row.page_path || '/'
    });

    return {
      ...item,
      links: buildPageDecisionLinks(item)
    };
  });

  const summary = {
    totalPages: items.length,
    totalViews: items.reduce((sum, item) => sum + item.views, 0),
    totalClicks: items.reduce((sum, item) => sum + item.clicks, 0),
    totalLeads: items.reduce((sum, item) => sum + item.leads, 0),
    pagesWithLeads: items.filter((item) => item.leads > 0).length,
    pagesWithTraffic: items.filter((item) => item.views > 0).length
  };

  return {
    summary,
    commandCenter: buildPagesCommandCenter(items),
    items
  };
}
