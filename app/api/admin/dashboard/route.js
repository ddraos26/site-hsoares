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

function sanitize(value, limit = 120) {
  return String(value || '').trim().slice(0, limit);
}

async function fetchTopPages(sql, { fromDate, toDate, productLike, campaignLike }) {
  const rows = await sql`
    SELECT page_path, COUNT(*)::int AS views
    FROM page_views
    WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
      AND (${productLike}::text IS NULL OR page_path ILIKE ${productLike})
      AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
    GROUP BY page_path
    ORDER BY views DESC
    LIMIT 10
  `;

  return rows.map((row) => ({
    page_path: row.page_path,
    views: row.views || 0
  }));
}

async function fetchTopProducts(sql, { fromDate, toDate, product, campaignLike }) {
  const rows = await sql`
    SELECT product_slug, COUNT(*)::int AS clicks
    FROM conversion_events
    WHERE event_type = 'porto_click'
      AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
      AND (${product || null}::text IS NULL OR product_slug = ${product || null})
      AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
    GROUP BY product_slug
    ORDER BY clicks DESC
    LIMIT 10
  `;

  return rows.map((row) => ({
    product_slug: row.product_slug,
    clicks: row.clicks || 0
  }));
}

export async function GET(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const { fromDate, toDate } = resolveRange(searchParams);
    const product = sanitize(searchParams.get('product'));
    const owner = sanitize(searchParams.get('owner'));
    const campaign = sanitize(searchParams.get('campaign'));
    const productLike = product ? `%${product}%` : null;
    const ownerLike = owner ? `%${owner}%` : null;
    const campaignLike = campaign ? `%${campaign}%` : null;
    const rangeMs = toDate.getTime() - fromDate.getTime();
    const prevToDate = new Date(fromDate.getTime() - 1);
    const prevFromDate = new Date(prevToDate.getTime() - rangeMs);

    const [viewsRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM page_views
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        AND (${productLike}::text IS NULL OR page_path ILIKE ${productLike})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
    `;

    const [clicksRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM conversion_events
      WHERE event_type = 'porto_click'
        AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
    `;

    const [leadsRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM leads
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (${ownerLike}::text IS NULL OR owner_name ILIKE ${ownerLike})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
    `;

    const [prevViewsRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM page_views
      WHERE created_at BETWEEN ${prevFromDate.toISOString()} AND ${prevToDate.toISOString()}
        AND (${productLike}::text IS NULL OR page_path ILIKE ${productLike})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
    `;

    const [prevClicksRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM conversion_events
      WHERE event_type = 'porto_click'
        AND created_at BETWEEN ${prevFromDate.toISOString()} AND ${prevToDate.toISOString()}
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
    `;

    const [prevLeadsRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM leads
      WHERE created_at BETWEEN ${prevFromDate.toISOString()} AND ${prevToDate.toISOString()}
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (${ownerLike}::text IS NULL OR owner_name ILIKE ${ownerLike})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
    `;

    const leadStatusSummary = await sql`
      SELECT lead_status, COUNT(*)::int AS total
      FROM leads
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (${ownerLike}::text IS NULL OR owner_name ILIKE ${ownerLike})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
      GROUP BY lead_status
    `;

    const topPages = await fetchTopPages(sql, { fromDate, toDate, productLike, campaignLike });
    const previousTopPages = await fetchTopPages(sql, { fromDate: prevFromDate, toDate: prevToDate, productLike, campaignLike });

    const topProducts = await fetchTopProducts(sql, { fromDate, toDate, product, campaignLike });
    const previousTopProducts = await fetchTopProducts(sql, { fromDate: prevFromDate, toDate: prevToDate, product, campaignLike });

    const ctrByPage = await sql`
      WITH views AS (
        SELECT page_path, COUNT(*)::float AS views
        FROM page_views
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
          AND (${productLike}::text IS NULL OR page_path ILIKE ${productLike})
          AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
        GROUP BY page_path
      ),
      clicks AS (
        SELECT page_path, COUNT(*)::float AS clicks
        FROM conversion_events
        WHERE event_type = 'porto_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
          AND (${product || null}::text IS NULL OR product_slug = ${product || null})
          AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
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

    const overdueFollowUps = await sql`
      SELECT
        id,
        nome,
        whatsapp,
        product_slug,
        lead_status,
        owner_name,
        next_contact_at,
        updated_at
      FROM leads
      WHERE lead_status IN ('novo', 'em_contato')
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (${ownerLike}::text IS NULL OR owner_name ILIKE ${ownerLike})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
        AND (
          (next_contact_at IS NOT NULL AND next_contact_at <= now())
          OR (next_contact_at IS NULL AND updated_at <= now() - interval '48 hours')
        )
      ORDER BY COALESCE(next_contact_at, updated_at) ASC
      LIMIT 8
    `;

    const upcomingFollowUps = await sql`
      SELECT
        id,
        nome,
        whatsapp,
        product_slug,
        lead_status,
        owner_name,
        next_contact_at
      FROM leads
      WHERE lead_status IN ('novo', 'em_contato')
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (${ownerLike}::text IS NULL OR owner_name ILIKE ${ownerLike})
        AND next_contact_at IS NOT NULL
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
        AND next_contact_at > now()
      ORDER BY next_contact_at ASC
      LIMIT 8
    `;

    const recentLeads = await sql`
      SELECT
        id,
        nome,
        whatsapp,
        product_slug,
        lead_status,
        owner_name,
        created_at
      FROM leads
      WHERE (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (${ownerLike}::text IS NULL OR owner_name ILIKE ${ownerLike})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
      ORDER BY created_at DESC
      LIMIT 8
    `;

    const lossReasons = await sql`
      SELECT
        COALESCE(NULLIF(TRIM(loss_reason), ''), 'Não informado') AS loss_reason,
        COUNT(*)::int AS total
      FROM leads
      WHERE lead_status = 'perdido'
        AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (${ownerLike}::text IS NULL OR owner_name ILIKE ${ownerLike})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
      GROUP BY 1
      ORDER BY total DESC, loss_reason ASC
      LIMIT 8
    `;

    const conversionByProduct = await sql`
      WITH product_views AS (
        SELECT
          split_part(replace(page_path, '/produtos/', ''), '/', 1) AS product_slug,
          COUNT(*)::int AS views
        FROM page_views
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        AND page_path LIKE '/produtos/%'
        AND (${product || null}::text IS NULL OR split_part(replace(page_path, '/produtos/', ''), '/', 1) = ${product || null})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
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
          AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        GROUP BY 1
      ),
      product_leads AS (
        SELECT
          product_slug,
          COUNT(*)::int AS leads
        FROM leads
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
          AND product_slug IS NOT NULL
          AND (${product || null}::text IS NULL OR product_slug = ${product || null})
          AND (${ownerLike}::text IS NULL OR owner_name ILIKE ${ownerLike})
        GROUP BY 1
      )
      SELECT
        COALESCE(v.product_slug, c.product_slug, l.product_slug) AS product_slug,
        COALESCE(v.views, 0) AS views,
        COALESCE(c.clicks, 0) AS clicks,
        COALESCE(l.leads, 0) AS leads,
        ROUND(((COALESCE(c.clicks, 0)::numeric / NULLIF(COALESCE(v.views, 0), 0)) * 100), 2) AS click_rate,
        ROUND(((COALESCE(l.leads, 0)::numeric / NULLIF(COALESCE(c.clicks, 0), 0)) * 100), 2) AS lead_rate
      FROM product_views v
      FULL OUTER JOIN product_clicks c ON c.product_slug = v.product_slug
      FULL OUTER JOIN product_leads l ON l.product_slug = COALESCE(v.product_slug, c.product_slug)
      WHERE COALESCE(v.product_slug, c.product_slug, l.product_slug) IS NOT NULL
      ORDER BY leads DESC, clicks DESC, views DESC
      LIMIT 12
    `;

    const totalViews = viewsRow?.total || 0;
    const totalClicks = clicksRow?.total || 0;
    const activeWindowMinutes = 3;
    const onlineSince = new Date(Date.now() - activeWindowMinutes * 60 * 1000).toISOString();
    const prevTotalViews = prevViewsRow?.total || 0;
    const prevTotalClicks = prevClicksRow?.total || 0;
    const prevTotalLeads = prevLeadsRow?.total || 0;

    const [onlineRow] = await sql`
      WITH active_sessions AS (
        SELECT session_id
        FROM page_views
        WHERE session_id IS NOT NULL
          AND created_at >= ${onlineSince}
          AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
        UNION
        SELECT session_id
        FROM conversion_events
        WHERE session_id IS NOT NULL
          AND event_type = 'heartbeat'
          AND created_at >= ${onlineSince}
          AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
      )
      SELECT COUNT(DISTINCT session_id)::int AS total
      FROM active_sessions
    `;

    const [todayLeadsRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM leads
      WHERE created_at >= date_trunc('day', timezone('America/Sao_Paulo', now())) AT TIME ZONE 'America/Sao_Paulo'
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (${ownerLike}::text IS NULL OR owner_name ILIKE ${ownerLike})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
    `;

    const [weekLeadsRow] = await sql`
      SELECT COUNT(*)::int AS total
      FROM leads
      WHERE created_at >= now() - interval '7 days'
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (${ownerLike}::text IS NULL OR owner_name ILIKE ${ownerLike})
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
    `;

    const unassignedLeads = await sql`
      SELECT
        id,
        nome,
        whatsapp,
        product_slug,
        lead_status,
        created_at
      FROM leads
      WHERE lead_status IN ('novo', 'em_contato')
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (
          owner_name IS NULL
          OR NULLIF(TRIM(owner_name), '') IS NULL
        )
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
      ORDER BY created_at DESC
      LIMIT 8
    `;

    const staleNewLeads = await sql`
      SELECT
        id,
        nome,
        whatsapp,
        product_slug,
        lead_status,
        created_at,
        updated_at
      FROM leads
      WHERE lead_status = 'novo'
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND updated_at <= now() - interval '12 hours'
        AND (${campaignLike}::text IS NULL OR utm_campaign ILIKE ${campaignLike})
      ORDER BY updated_at ASC
      LIMIT 8
    `;

    const summaryCtr = totalViews ? Number(((totalClicks / totalViews) * 100).toFixed(2)) : 0;
    const prevCtr = prevTotalViews ? Number(((prevTotalClicks / prevTotalViews) * 100).toFixed(2)) : 0;
    const comparison = {
      views: {
        current: totalViews,
        previous: prevTotalViews
      },
      clicks: {
        current: totalClicks,
        previous: prevTotalClicks
      },
      leads: {
        current: leadsRow?.total || 0,
        previous: prevTotalLeads
      },
      ctr: {
        current: summaryCtr,
        previous: prevCtr
      }
    };

    return NextResponse.json({
      summary: {
        onlineUsers: onlineRow?.total || 0,
        activeWindowMinutes,
        totalViews,
        totalClicks,
        totalLeads: leadsRow?.total || 0,
        ctr: summaryCtr,
        overdueFollowUps: overdueFollowUps.length,
        upcomingFollowUps: upcomingFollowUps.length,
        todayLeads: todayLeadsRow?.total || 0,
        weekLeads: weekLeadsRow?.total || 0,
        unassignedLeads: unassignedLeads.length,
        staleNewLeads: staleNewLeads.length
      },
      leadStatusSummary,
      topPages,
      previousTopPages,
      topProducts,
      previousTopProducts,
      ctrByPage,
      overdueFollowUps,
      upcomingFollowUps,
      recentLeads,
      lossReasons,
      conversionByProduct,
      unassignedLeads,
      staleNewLeads
    });
  } catch (error) {
    console.error('dashboard error', error);
    return NextResponse.json({ error: 'Falha ao carregar dashboard.' }, { status: 500 });
  }
}
