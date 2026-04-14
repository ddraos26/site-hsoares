import 'server-only';

import { encodePageDetailId } from '@/lib/admin/detail-route';
import { getDb } from '@/lib/db';
import { readAutomationOperations } from '@/lib/admin/automation-operation-store';
import { buildPageAiAudit } from '@/lib/admin/page-ai-audit';
import { buildProductAiAudit } from '@/lib/admin/product-ai-audit';
import { getAdminProductsSnapshot } from '@/lib/admin/products-overview';
import { getAdminPagesSnapshot } from '@/lib/admin/pages-overview';
import { readTaskStateEntries } from '@/lib/admin/task-store';

function formatPercent(value, total) {
  if (!total) return 0;
  return Number(((Number(value || 0) / total) * 100).toFixed(1));
}

function buildProductHealth(item) {
  const views = Number(item.views || 0);
  const clicks = Number(item.clicks || 0);
  const leads = Number(item.leads || 0);
  const clickRate = Number(item.clickRate || 0);
  const leadRate = Number(item.leadRate || 0);

  return Math.round(
    Math.min(
      100,
      (views / 180) * 18 +
        (clicks / 30) * 18 +
        (leads / 8) * 26 +
        (clickRate / 12) * 16 +
        (leadRate / 25) * 22
    )
  );
}

function latestEntryByTaskKey(entries = []) {
  const map = new Map();

  for (const entry of entries) {
    if (!entry?.id) continue;
    map.set(entry.id, entry);
  }

  return map;
}

function normalizeTaskState(entry, fallback) {
  return {
    id: fallback.id,
    title: fallback.title,
    sourceLabel: fallback.sourceLabel,
    href: fallback.href,
    priority: fallback.priority,
    status: entry?.status || 'pending',
    note: entry?.note || '',
    actionType: entry?.actionType || '',
    outcome: entry?.outcome || '',
    actedAt: entry?.createdAt || null,
    actedBy: entry?.actor || ''
  };
}

function buildExecutionState({ taskEntries, operations, sourceType, sourceId, title, href, priority }) {
  const latestTaskMap = latestEntryByTaskKey(taskEntries);
  const mainTaskId = `${sourceType}-decision:${sourceId}`;
  const reviewTaskId = `review:${sourceType}:${sourceId}`;
  const entityOperations = (operations || [])
    .filter((item) => item.sourceType === sourceType && String(item.sourceId || '') === String(sourceId || ''));
  const latestOperation = entityOperations[0] || null;

  return {
    mainTask: normalizeTaskState(latestTaskMap.get(mainTaskId), {
      id: mainTaskId,
      title,
      sourceLabel: sourceType === 'page' ? 'Páginas' : 'Produtos',
      href,
      priority
    }),
    reviewTask: normalizeTaskState(latestTaskMap.get(reviewTaskId), {
      id: reviewTaskId,
      title: `Revisar resultado de ${title}`,
      sourceLabel: 'Revisão',
      href,
      priority: 'Média'
    }),
    latestOperation,
    relatedOperations: entityOperations.slice(0, 4)
  };
}

export async function getAdminProductDetailSnapshot(slug) {
  const sql = getDb();
  const snapshot = await getAdminProductsSnapshot({ q: slug });
  const product = snapshot.items.find((item) => item.slug === slug);

  if (!product) {
    return null;
  }

  const [recentLeads, relatedPages, relatedCampaigns, taskEntries, operations] = await Promise.all([
    sql`
      SELECT
        id,
        nome,
        whatsapp,
        email,
        lead_status,
        owner_name,
        next_contact_at,
        page_path,
        utm_campaign,
        created_at
      FROM leads
      WHERE product_slug = ${slug}
      ORDER BY created_at DESC
      LIMIT 12
    `,
    sql`
      WITH views AS (
        SELECT page_path, COUNT(*)::int AS views
        FROM page_views
        WHERE page_path LIKE ${`/produtos/${slug}%`}
        GROUP BY 1
      ),
      clicks AS (
        SELECT page_path, COUNT(*)::int AS clicks
        FROM conversion_events
        WHERE product_slug = ${slug}
          AND event_type IN ('porto_click', 'cta_primary_click')
        GROUP BY 1
      ),
      leads_by_page AS (
        SELECT page_path, COUNT(*)::int AS leads
        FROM leads
        WHERE product_slug = ${slug}
        GROUP BY 1
      )
      SELECT
        COALESCE(v.page_path, c.page_path, l.page_path) AS page_path,
        COALESCE(v.views, 0) AS views,
        COALESCE(c.clicks, 0) AS clicks,
        COALESCE(l.leads, 0) AS leads
      FROM views v
      FULL OUTER JOIN clicks c ON c.page_path = v.page_path
      FULL OUTER JOIN leads_by_page l ON l.page_path = COALESCE(v.page_path, c.page_path)
      WHERE COALESCE(v.page_path, c.page_path, l.page_path) IS NOT NULL
      ORDER BY COALESCE(l.leads, 0) DESC, COALESCE(v.views, 0) DESC
      LIMIT 8
    `,
    sql`
      SELECT
        COALESCE(utm_source, '') AS utm_source,
        COALESCE(utm_medium, '') AS utm_medium,
        COALESCE(utm_campaign, '') AS utm_campaign,
        COUNT(*)::int AS leads,
        COUNT(*) FILTER (WHERE lead_status = 'ganho')::int AS wins,
        MAX(created_at) AS last_seen_at
      FROM leads
      WHERE product_slug = ${slug}
        AND COALESCE(utm_campaign, '') <> ''
      GROUP BY 1, 2, 3
      ORDER BY COUNT(*) DESC, MAX(created_at) DESC
      LIMIT 8
    `,
    readTaskStateEntries(),
    readAutomationOperations({ limit: 80 })
  ]);

  const normalizedRecentLeads = recentLeads.map((item) => ({
    id: item.id,
    name: item.nome || item.whatsapp || item.email || 'Lead sem nome',
    status: item.lead_status,
    owner: item.owner_name || 'Sem responsável',
    nextContactAt: item.next_contact_at,
    pagePath: item.page_path || '-',
    utmCampaign: item.utm_campaign || '-',
    createdAt: item.created_at
  }));

  const normalizedRelatedPages = relatedPages.map((item) => ({
    pagePath: item.page_path,
    views: Number(item.views || 0),
    clicks: Number(item.clicks || 0),
    leads: Number(item.leads || 0),
    leadRate: formatPercent(item.leads, item.clicks || item.views || 0)
  }));

  const normalizedRelatedCampaigns = relatedCampaigns.map((item) => ({
    label: [item.utm_source, item.utm_medium, item.utm_campaign].filter(Boolean).join(' / ') || 'Campanha sem nome',
    leads: Number(item.leads || 0),
    wins: Number(item.wins || 0),
    lastSeenAt: item.last_seen_at
  }));

  const aiAudit = await buildProductAiAudit({
    product: {
      ...product,
      healthScore: buildProductHealth(product)
    },
    relatedPages: normalizedRelatedPages,
    relatedCampaigns: normalizedRelatedCampaigns,
    recentLeads: normalizedRecentLeads
  });

  return {
    product: {
      ...product,
      healthScore: buildProductHealth(product)
    },
    execution: buildExecutionState({
      taskEntries,
      operations,
      sourceType: 'product',
      sourceId: slug,
      title: product.decision?.headline || product.name,
      href: `/dashboard/products/${encodeURIComponent(slug)}`,
      priority: product.decision?.recommendation?.priority || 'Média'
    }),
    aiAudit,
    recentLeads: normalizedRecentLeads,
    relatedPages: normalizedRelatedPages,
    relatedCampaigns: normalizedRelatedCampaigns
  };
}

export async function getAdminPageDetailSnapshot(pagePath) {
  const sql = getDb();
  const snapshot = await getAdminPagesSnapshot({ q: pagePath });
  const page = snapshot.items.find((item) => item.pagePath === pagePath);

  if (!page) {
    return null;
  }

  const [recentLeads, trafficSources, behavioralSignals, taskEntries, operations] = await Promise.all([
    sql`
      SELECT
        id,
        nome,
        whatsapp,
        email,
        lead_status,
        owner_name,
        next_contact_at,
        product_slug,
        created_at
      FROM leads
      WHERE page_path = ${pagePath}
      ORDER BY created_at DESC
      LIMIT 12
    `,
    sql`
      SELECT
        COALESCE(utm_source, '') AS utm_source,
        COALESCE(utm_medium, '') AS utm_medium,
        COUNT(*)::int AS sessions
      FROM page_views
      WHERE page_path = ${pagePath}
      GROUP BY 1, 2
      ORDER BY COUNT(*) DESC
      LIMIT 8
    `,
    sql`
      SELECT
        COUNT(*) FILTER (WHERE event_type IN ('porto_click', 'cta_primary_click'))::int AS primary_clicks,
        COUNT(*) FILTER (WHERE event_type = 'cta_secondary_click')::int AS secondary_clicks,
        COUNT(*) FILTER (WHERE event_type = 'whatsapp_click')::int AS whatsapp_clicks,
        COUNT(*) FILTER (WHERE event_type = 'scroll_relevant')::int AS scroll_relevant
      FROM conversion_events
      WHERE page_path = ${pagePath}
    `,
    readTaskStateEntries(),
    readAutomationOperations({ limit: 80 })
  ]);

  const normalizedRecentLeads = recentLeads.map((item) => ({
    id: item.id,
    name: item.nome || item.whatsapp || item.email || 'Lead sem nome',
    status: item.lead_status,
    owner: item.owner_name || 'Sem responsável',
    nextContactAt: item.next_contact_at,
    productSlug: item.product_slug || '-',
    createdAt: item.created_at
  }));

  const normalizedTrafficSources = trafficSources.map((item) => ({
    label: [item.utm_source, item.utm_medium].filter(Boolean).join(' / ') || 'Direto ou não identificado',
    sessions: Number(item.sessions || 0)
  }));

  const normalizedBehavioralSignals = {
    primaryClicks: Number(behavioralSignals[0]?.primary_clicks || 0),
    secondaryClicks: Number(behavioralSignals[0]?.secondary_clicks || 0),
    whatsappClicks: Number(behavioralSignals[0]?.whatsapp_clicks || 0),
    scrollRelevant: Number(behavioralSignals[0]?.scroll_relevant || 0)
  };

  const aiAudit = await buildPageAiAudit({
    page,
    behavioralSignals: normalizedBehavioralSignals,
    trafficSources: normalizedTrafficSources,
    recentLeads: normalizedRecentLeads
  });

  return {
    page,
    execution: buildExecutionState({
      taskEntries,
      operations,
      sourceType: 'page',
      sourceId: pagePath,
      title: page.decision?.headline || page.pagePath,
      href: `/dashboard/pages/${encodePageDetailId(pagePath)}`,
      priority: page.decision?.recommendation?.priority || 'Média'
    }),
    aiAudit,
    behavioralSignals: normalizedBehavioralSignals,
    recentLeads: normalizedRecentLeads,
    trafficSources: normalizedTrafficSources
  };
}
