import 'server-only';

import { getDb } from '@/lib/db';
import { getAiRefreshPrioritySnapshot } from '@/lib/admin/ai-refresh-priority';
import { getAiCostSnapshot } from '@/lib/admin/cost-controller';
import { getExecutionGuardrailsSnapshot } from '@/lib/admin/execution-guardrails';
import { formatPageLabel } from '@/lib/admin/page-presentation';
import { getExecutiveCockpitSnapshot } from '@/lib/admin/executive-cockpit';
import { getCachedAdminPagesSnapshot, getCachedAdminProductsSnapshot } from '@/lib/admin/server-snapshot-cache';

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentage(current, total) {
  if (!total) return 0;
  return Number(((current / total) * 100).toFixed(2));
}

function startOfDay(offsetDays = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

function endOfDay(offsetDays = 0) {
  const date = startOfDay(offsetDays);
  date.setHours(23, 59, 59, 999);
  return date;
}

function subDays(date, days) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

function buildDelta(current, previous) {
  const diff = current - previous;
  const percent = previous ? Number((((diff / previous) * 100)).toFixed(1)) : null;

  return {
    current,
    previous,
    diff,
    percent
  };
}

async function getWindowMetrics(sql, fromDate, toDate) {
  const [row] = await sql`
    WITH page_base AS (
      SELECT
        COUNT(*)::int AS visits,
        COUNT(*) FILTER (
          WHERE
            COALESCE(utm_medium, '') ILIKE '%cpc%'
            OR COALESCE(utm_medium, '') ILIKE '%ppc%'
            OR COALESCE(utm_medium, '') ILIKE '%paid%'
            OR COALESCE(utm_source, '') ILIKE '%google%'
            OR COALESCE(utm_source, '') ILIKE '%meta%'
            OR COALESCE(utm_source, '') ILIKE '%facebook%'
            OR COALESCE(utm_source, '') ILIKE '%instagram%'
        )::int AS paid_traffic,
        COUNT(*) FILTER (
          WHERE
            COALESCE(utm_medium, '') ILIKE '%organic%'
            OR COALESCE(referrer, '') ILIKE '%google.%'
            OR COALESCE(referrer, '') ILIKE '%bing.%'
            OR COALESCE(referrer, '') ILIKE '%yahoo.%'
        )::int AS organic_traffic
      FROM page_views
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    ),
    event_base AS (
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'porto_click')::int AS porto_clicks,
        COUNT(*) FILTER (WHERE event_type = 'whatsapp_click')::int AS whatsapp_clicks
      FROM conversion_events
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    ),
    lead_base AS (
      SELECT COUNT(*)::int AS leads
      FROM leads
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    )
    SELECT
      p.visits,
      p.paid_traffic,
      p.organic_traffic,
      e.porto_clicks,
      e.whatsapp_clicks,
      l.leads
    FROM page_base p
    CROSS JOIN event_base e
    CROSS JOIN lead_base l
  `;

  const visits = toNumber(row?.visits);
  const portoClicks = toNumber(row?.porto_clicks);
  const leads = toNumber(row?.leads);
  const whatsappClicks = toNumber(row?.whatsapp_clicks);

  return {
    visits,
    leads,
    whatsappClicks,
    portoClicks,
    paidTraffic: toNumber(row?.paid_traffic),
    organicTraffic: toNumber(row?.organic_traffic),
    conversionRate: percentage(leads, visits),
    ctr: percentage(portoClicks, visits),
    adSpendToday: null,
    costPerLead: null
  };
}

async function getRangePerformance(sql, fromDate, toDate) {
  const [products, pages, campaigns] = await Promise.all([
    sql`
      WITH views AS (
        SELECT split_part(replace(page_path, '/produtos/', ''), '/', 1) AS slug, COUNT(*)::int AS views
        FROM page_views
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
          AND page_path LIKE '/produtos/%'
        GROUP BY 1
      ),
      clicks AS (
        SELECT product_slug AS slug, COUNT(*)::int AS clicks
        FROM conversion_events
        WHERE event_type = 'porto_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
          AND product_slug IS NOT NULL
        GROUP BY 1
      ),
      leads_by_product AS (
        SELECT product_slug AS slug, COUNT(*)::int AS leads
        FROM leads
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
          AND product_slug IS NOT NULL
        GROUP BY 1
      )
      SELECT
        COALESCE(v.slug, c.slug, l.slug) AS slug,
        COALESCE(v.views, 0) AS views,
        COALESCE(c.clicks, 0) AS clicks,
        COALESCE(l.leads, 0) AS leads
      FROM views v
      FULL OUTER JOIN clicks c ON c.slug = v.slug
      FULL OUTER JOIN leads_by_product l ON l.slug = COALESCE(v.slug, c.slug)
      WHERE COALESCE(v.slug, c.slug, l.slug) IS NOT NULL
    `,
    sql`
      WITH views AS (
        SELECT page_path, COUNT(*)::int AS views
        FROM page_views
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY 1
      ),
      clicks AS (
        SELECT page_path, COUNT(*)::int AS clicks
        FROM conversion_events
        WHERE event_type = 'porto_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY 1
      ),
      leads_by_page AS (
        SELECT page_path, COUNT(*)::int AS leads
        FROM leads
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
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
    `,
    sql`
      WITH views AS (
        SELECT
          COALESCE(utm_source, '') AS source,
          COALESCE(utm_medium, '') AS medium,
          COALESCE(utm_campaign, '') AS campaign,
          COUNT(*)::int AS views
        FROM page_views
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY 1, 2, 3
      ),
      clicks AS (
        SELECT
          COALESCE(utm_source, '') AS source,
          COALESCE(utm_medium, '') AS medium,
          COALESCE(utm_campaign, '') AS campaign,
          COUNT(*)::int AS clicks
        FROM conversion_events
        WHERE event_type = 'porto_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY 1, 2, 3
      ),
      leads_by_campaign AS (
        SELECT
          COALESCE(utm_source, '') AS source,
          COALESCE(utm_medium, '') AS medium,
          COALESCE(utm_campaign, '') AS campaign,
          COUNT(*)::int AS leads
        FROM leads
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY 1, 2, 3
      )
      SELECT
        COALESCE(v.source, c.source, l.source) AS source,
        COALESCE(v.medium, c.medium, l.medium) AS medium,
        COALESCE(v.campaign, c.campaign, l.campaign) AS campaign,
        COALESCE(v.views, 0) AS views,
        COALESCE(c.clicks, 0) AS clicks,
        COALESCE(l.leads, 0) AS leads
      FROM views v
      FULL OUTER JOIN clicks c ON c.source = v.source AND c.medium = v.medium AND c.campaign = v.campaign
      FULL OUTER JOIN leads_by_campaign l
        ON l.source = COALESCE(v.source, c.source)
        AND l.medium = COALESCE(v.medium, c.medium)
        AND l.campaign = COALESCE(v.campaign, c.campaign)
      WHERE COALESCE(v.source, c.source, l.source, '') <> ''
        OR COALESCE(v.medium, c.medium, l.medium, '') <> ''
        OR COALESCE(v.campaign, c.campaign, l.campaign, '') <> ''
    `
  ]);

  return {
    products: products.map((item) => ({
      slug: item.slug,
      views: toNumber(item.views),
      clicks: toNumber(item.clicks),
      leads: toNumber(item.leads),
      leadRate: percentage(toNumber(item.leads), toNumber(item.clicks))
    })),
    pages: pages.map((item) => ({
      pagePath: item.page_path,
      views: toNumber(item.views),
      clicks: toNumber(item.clicks),
      leads: toNumber(item.leads),
      leadRate: percentage(toNumber(item.leads), toNumber(item.clicks))
    })),
    campaigns: campaigns.map((item) => ({
      label: [item.source, item.medium, item.campaign].filter(Boolean).join(' / ') || 'Campanha sem nome',
      source: item.source,
      medium: item.medium,
      campaign: item.campaign,
      views: toNumber(item.views),
      clicks: toNumber(item.clicks),
      leads: toNumber(item.leads),
      leadRate: percentage(toNumber(item.leads), toNumber(item.clicks))
    }))
  };
}

function pickBest(items, minimumViews = 0) {
  return [...items]
    .filter((item) => (item.views || item.clicks || 0) >= minimumViews)
    .sort((a, b) => b.leads - a.leads || b.leadRate - a.leadRate || b.clicks - a.clicks || b.views - a.views)[0] || null;
}

function pickWorst(items, minimumViews = 10) {
  const critical = items.filter((item) => (item.views || item.clicks || 0) >= minimumViews && item.leads === 0);
  if (critical.length) {
    return [...critical].sort((a, b) => b.views - a.views || b.clicks - a.clicks)[0];
  }

  return [...items]
    .filter((item) => (item.views || item.clicks || 0) >= minimumViews)
    .sort((a, b) => a.leadRate - b.leadRate || a.leads - b.leads || b.views - a.views)[0] || null;
}

function buildPageRanking(items = []) {
  const ranked = [...items]
    .sort(
      (left, right) =>
        Number(right?.decision?.scores?.priority || 0) - Number(left?.decision?.scores?.priority || 0) ||
        Number(right?.leads || 0) - Number(left?.leads || 0) ||
        Number(right?.views || 0) - Number(left?.views || 0)
    )
    .slice(0, 5)
    .map((item) => ({
      pagePath: item.pagePath,
      label: formatPageLabel(item.pagePath),
      href: item.links?.contextHref || '/dashboard/pages',
      priorityScore: Number(item?.decision?.scores?.priority || 0),
      priorityLabel: item?.decision?.recommendation?.priority || 'Média',
      leads: Number(item?.leads || 0),
      views: Number(item?.views || 0),
      leadRate: Number(item?.leadRate || 0),
      headline: item?.decision?.headline || '',
      recommendation: item?.decision?.recommendation?.summary || '',
      statusLabel:
        Number(item?.leads || 0) > 0 && Number(item?.leadRate || 0) >= 8
          ? 'Dando resultado'
          : Number(item?.views || 0) >= 50 && Number(item?.leads || 0) === 0
            ? 'Pedindo ajuda'
            : 'No radar',
      tone:
        Number(item?.leads || 0) > 0 && Number(item?.leadRate || 0) >= 8
          ? 'success'
          : Number(item?.views || 0) >= 50 && Number(item?.leads || 0) === 0
            ? 'danger'
            : item?.decision?.tone || 'premium'
    }));

  const champions = ranked
    .filter((item) => item.leads > 0 && item.leadRate >= 8)
    .sort((left, right) => right.leads - left.leads || right.leadRate - left.leadRate)
    .slice(0, 3);

  const leakingTraffic = ranked
    .filter((item) => item.views >= 50 && item.leads === 0)
    .sort((left, right) => right.views - left.views || right.priorityScore - left.priorityScore)
    .slice(0, 3);

  const readyToScale = ranked
    .filter((item) => item.leadRate >= 10 && item.views < 120)
    .sort((left, right) => right.leadRate - left.leadRate || right.leads - left.leads)
    .slice(0, 3);

  const champion = champions[0] || ranked[0] || null;

  return {
    headline: champion?.label
      ? `${champion.label} lidera a leitura entre as páginas`
      : 'Ainda não há páginas suficientes para formar um ranking claro',
    champion,
    bestPages: champions,
    trafficWithoutLead: leakingTraffic,
    readyToScale,
    items: ranked
  };
}

export async function getExecutiveDashboardSnapshot() {
  const sql = getDb();
  const [cockpit, cost, guardrails, productsSnapshot, pagesSnapshot] = await Promise.all([
    getExecutiveCockpitSnapshot(),
    getAiCostSnapshot(),
    getExecutionGuardrailsSnapshot(),
    getCachedAdminProductsSnapshot(),
    getCachedAdminPagesSnapshot()
  ]);

  const todayRange = { from: startOfDay(0), to: new Date() };
  const yesterdayRange = { from: startOfDay(-1), to: endOfDay(-1) };
  const last7Range = { from: subDays(new Date(), 7), to: new Date() };
  const prev7Range = { from: subDays(new Date(), 14), to: subDays(new Date(), 7) };
  const last30Range = { from: subDays(new Date(), 30), to: new Date() };
  const prev30Range = { from: subDays(new Date(), 60), to: subDays(new Date(), 30) };

  const [today, yesterday, last7, prev7, last30, prev30, performanceToday, performance7] = await Promise.all([
    getWindowMetrics(sql, todayRange.from, todayRange.to),
    getWindowMetrics(sql, yesterdayRange.from, yesterdayRange.to),
    getWindowMetrics(sql, last7Range.from, last7Range.to),
    getWindowMetrics(sql, prev7Range.from, prev7Range.to),
    getWindowMetrics(sql, last30Range.from, last30Range.to),
    getWindowMetrics(sql, prev30Range.from, prev30Range.to),
    getRangePerformance(sql, todayRange.from, todayRange.to),
    getRangePerformance(sql, last7Range.from, last7Range.to)
  ]);

  const hasTodayCriticalMass = today.visits > 10 || today.leads > 0 || today.portoClicks > 5;
  const referencePerformance = hasTodayCriticalMass ? performanceToday : performance7;
  const referenceLabel = hasTodayCriticalMass ? 'Hoje' : 'Últimos 7 dias';

  const leaderboards = {
    windowLabel: referenceLabel,
    bestProduct: pickBest(referencePerformance.products, hasTodayCriticalMass ? 2 : 8),
    worstProduct: pickWorst(referencePerformance.products, hasTodayCriticalMass ? 2 : 8),
    bestPage: pickBest(referencePerformance.pages, hasTodayCriticalMass ? 4 : 15),
    worstPage: pickWorst(referencePerformance.pages, hasTodayCriticalMass ? 4 : 15),
    bestCampaign: pickBest(referencePerformance.campaigns, hasTodayCriticalMass ? 3 : 10),
    worstCampaign: pickWorst(referencePerformance.campaigns, hasTodayCriticalMass ? 3 : 10)
  };
  const auditPriorities = await getAiRefreshPrioritySnapshot({
    products: productsSnapshot.items || [],
    pages: pagesSnapshot.items || []
  });
  const pageRanking = buildPageRanking(pagesSnapshot.items || []);
  const priorityAction = cockpit.actionQueue[0] || null;
  const firstAuditPriority = auditPriorities.items[0] || null;

  return {
    checkedAt: new Date().toISOString(),
    kpis: {
      visitsToday: today.visits,
      leadsToday: today.leads,
      whatsappClicksToday: today.whatsappClicks,
      adSpendToday: today.adSpendToday,
      costPerLeadToday: today.costPerLead,
      organicTrafficToday: today.organicTraffic,
      paidTrafficToday: today.paidTraffic,
      conversionRateToday: today.conversionRate,
      ctrToday: today.ctr
    },
    comparisons: {
      todayVsYesterday: {
        visits: buildDelta(today.visits, yesterday.visits),
        leads: buildDelta(today.leads, yesterday.leads),
        whatsappClicks: buildDelta(today.whatsappClicks, yesterday.whatsappClicks),
        conversionRate: buildDelta(today.conversionRate, yesterday.conversionRate),
        ctr: buildDelta(today.ctr, yesterday.ctr)
      },
      last7VsPrevious7: {
        visits: buildDelta(last7.visits, prev7.visits),
        leads: buildDelta(last7.leads, prev7.leads),
        whatsappClicks: buildDelta(last7.whatsappClicks, prev7.whatsappClicks),
        conversionRate: buildDelta(last7.conversionRate, prev7.conversionRate),
        ctr: buildDelta(last7.ctr, prev7.ctr)
      },
      last30VsPrevious30: {
        visits: buildDelta(last30.visits, prev30.visits),
        leads: buildDelta(last30.leads, prev30.leads),
        whatsappClicks: buildDelta(last30.whatsappClicks, prev30.whatsappClicks),
        conversionRate: buildDelta(last30.conversionRate, prev30.conversionRate),
        ctr: buildDelta(last30.ctr, prev30.ctr)
      }
    },
    leaderboards,
    businessFlow: {
      headline: priorityAction?.title || cockpit.commandCenter?.title || 'Sem ação dominante agora',
      whyNow: priorityAction?.reason || priorityAction?.diagnosis || cockpit.commandCenter?.diagnosis || 'A maior oportunidade comercial do momento foi colocada no topo para facilitar sua leitura.',
      nextStep: priorityAction?.recommendation || cockpit.commandCenter?.recommendation || 'Abra a frente principal e ajuste primeiro o que mais trava clique, lead ou venda.',
      actionLabel: priorityAction?.actionLabel || 'Abrir frente principal',
      actionHref: priorityAction?.href || '/dashboard/today',
      auditHeadline: auditPriorities.headline,
      auditSummary: auditPriorities.summary,
      firstAuditPriority
    },
    auditPriorities,
    pageRanking,
    centralPriorities: {
      actions: cockpit.actionQueue.slice(0, 3),
      productToPrioritize: cockpit.products[0] || null,
      campaignToReview: leaderboards.worstCampaign,
      pageToOptimize: leaderboards.worstPage,
      bestOpportunity: cockpit.growthMoves[0] || cockpit.seo.opportunities[0] || null
    },
    alerts: cockpit.moneyLeaks.slice(0, 3),
    opportunities: cockpit.growthMoves.slice(0, 3),
    commandCenter: cockpit.commandCenter,
    executionCenter: cockpit.executionCenter,
    operations: cockpit.operations,
    integrations: cockpit.integrations.summary,
    aiRuntime: {
      autonomy: guardrails.autonomy,
      profile: guardrails.profile,
      source: guardrails.source,
      policy: guardrails.policy,
      costModeKey: cost.currentMode,
      costModeLabel: cost.currentModeLabel,
      costTone: cost.policy.useEconomicMode ? 'warning' : cost.currentMode === 'premium' ? 'success' : 'blue',
      budgetUsagePercent: cost.usagePercent,
      spendThisMonth: cost.totalSpent,
      recommendation:
        cost.policy.useEconomicMode
          ? 'A IA está economizando chamadas neste mês. Priorize resumos e decisões de maior impacto.'
          : guardrails.autonomy.nextStep
    }
  };
}
