import 'server-only';

import { getDb } from '@/lib/db';
import { getExecutiveCockpitSnapshot } from '@/lib/admin/executive-cockpit';
import { getExecutiveDashboardSnapshot } from '@/lib/admin/executive-dashboard';
import { getBehaviorIntelligenceSnapshot } from '@/lib/admin/behavior-intelligence';
import { getRevenueIntelligenceSnapshot } from '@/lib/admin/revenue-intelligence';
import { getSearchConsoleOpportunitySnapshot } from '@/lib/admin/search-console-intelligence';
import { getAiCostSnapshot } from '@/lib/admin/cost-controller';
import { getAutomationOperationsSnapshot } from '@/lib/admin/automation-operation-store';
import { getAdminJobsSnapshot } from '@/lib/admin/job-run-store';
import { getAdminProductsSnapshot } from '@/lib/admin/products-overview';
import { getAdminPagesSnapshot } from '@/lib/admin/pages-overview';
import { getExecutionGuardrailsSnapshot } from '@/lib/admin/execution-guardrails';
import { buildProductScores, buildPageScores, buildCampaignScores, buildSeoScores } from '@/lib/admin/score-engine';
import { automationRuleCatalog, evaluateBusinessRules } from '@/lib/admin/rules-engine';
import { buildRecommendationsFromRules } from '@/lib/admin/recommendation-engine';
import { buildIntelligenceSummary } from '@/lib/admin/data-summarizer';
import { buildPromptBundle } from '@/lib/admin/prompt-builder';
import {
  buildPageDecisionApprovals,
  buildProductDecisionApprovals
} from '@/lib/admin/modules/command-center/application/action-queue';
import { attachApprovalExecutionState, readLatestApprovalExecutionMap } from '@/lib/admin/approval-execution';
import { mergeApprovalState, readApprovalDecisions } from '@/lib/admin/approval-store';
import { encodePageDetailId } from '@/lib/admin/detail-route';
import { formatPageLabel } from '@/lib/admin/page-presentation';

const CORE_PRODUCTS = [
  { slug: 'cartao-credito-porto-bank' },
  { slug: 'seguro-celular' },
  { slug: 'seguro-vida-on' },
  { slug: 'seguro-viagem' }
];

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toPercent(value, total) {
  if (!total) return 0;
  return Number(((Number(value || 0) / total) * 100).toFixed(1));
}

function normalizeCampaignLabel(source, medium, campaign) {
  const parts = [source, medium, campaign].map((item) => String(item || '').trim()).filter(Boolean);
  return parts.length ? parts.join(' / ') : 'Campanha sem nome';
}

function hrefByScope(scopeType, scopeId) {
  if (scopeType === 'product') return `/dashboard/products/${encodeURIComponent(scopeId || '')}`;
  if (scopeType === 'page') return `/dashboard/pages/${encodePageDetailId(scopeId || '')}`;
  if (scopeType === 'campaign') return scopeId ? `/admin/campanhas?q=${encodeURIComponent(scopeId || '')}` : '/admin/campanhas';
  if (scopeType === 'seo') return '/admin/seo';
  if (scopeType === 'operation') return '/admin/leads';
  if (scopeType === 'global' && scopeId === 'opportunity') return '/admin/copiloto';
  return '/admin/copiloto';
}

async function getPagePerformanceSnapshot(sql) {
  const [rows, trendRows] = await Promise.all([
    sql`
      WITH views AS (
        SELECT page_path, COUNT(*)::int AS views
        FROM page_views
        WHERE created_at >= now() - interval '30 days'
        GROUP BY 1
      ),
      primary_ctas AS (
        SELECT page_path, COUNT(*)::int AS primary_ctas
        FROM conversion_events
        WHERE created_at >= now() - interval '30 days'
          AND event_type IN ('porto_click', 'cta_primary_click')
        GROUP BY 1
      ),
      secondary_ctas AS (
        SELECT page_path, COUNT(*)::int AS secondary_ctas
        FROM conversion_events
        WHERE created_at >= now() - interval '30 days'
          AND event_type = 'cta_secondary_click'
        GROUP BY 1
      ),
      whatsapp AS (
        SELECT page_path, COUNT(*)::int AS whatsapp_clicks
        FROM conversion_events
        WHERE created_at >= now() - interval '30 days'
          AND event_type = 'whatsapp_click'
        GROUP BY 1
      ),
      scrolls AS (
        SELECT page_path, COUNT(*)::int AS scroll_relevant
        FROM conversion_events
        WHERE created_at >= now() - interval '30 days'
          AND event_type = 'scroll_relevant'
        GROUP BY 1
      ),
      leads_by_page AS (
        SELECT page_path, COUNT(*)::int AS leads
        FROM leads
        WHERE created_at >= now() - interval '30 days'
          AND page_path IS NOT NULL
        GROUP BY 1
      ),
      exits AS (
        WITH ordered AS (
          SELECT
            session_id,
            page_path,
            ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at DESC) AS row_number
          FROM page_views
          WHERE created_at >= now() - interval '30 days'
            AND session_id IS NOT NULL
        )
        SELECT page_path, COUNT(*)::int AS exit_sessions
        FROM ordered
        WHERE row_number = 1
        GROUP BY 1
      )
      SELECT
        COALESCE(v.page_path, p.page_path, s.page_path, w.page_path, sc.page_path, l.page_path, e.page_path) AS page_path,
        COALESCE(v.views, 0) AS views,
        COALESCE(p.primary_ctas, 0) AS primary_ctas,
        COALESCE(s.secondary_ctas, 0) AS secondary_ctas,
        COALESCE(w.whatsapp_clicks, 0) AS whatsapp_clicks,
        COALESCE(sc.scroll_relevant, 0) AS scroll_relevant,
        COALESCE(l.leads, 0) AS leads,
        COALESCE(e.exit_sessions, 0) AS exit_sessions
      FROM views v
      FULL OUTER JOIN primary_ctas p ON p.page_path = v.page_path
      FULL OUTER JOIN secondary_ctas s ON s.page_path = COALESCE(v.page_path, p.page_path)
      FULL OUTER JOIN whatsapp w ON w.page_path = COALESCE(v.page_path, p.page_path, s.page_path)
      FULL OUTER JOIN scrolls sc ON sc.page_path = COALESCE(v.page_path, p.page_path, s.page_path, w.page_path)
      FULL OUTER JOIN leads_by_page l ON l.page_path = COALESCE(v.page_path, p.page_path, s.page_path, w.page_path, sc.page_path)
      FULL OUTER JOIN exits e ON e.page_path = COALESCE(v.page_path, p.page_path, s.page_path, w.page_path, sc.page_path, l.page_path)
      WHERE COALESCE(v.page_path, p.page_path, s.page_path, w.page_path, sc.page_path, l.page_path, e.page_path) IS NOT NULL
      ORDER BY COALESCE(v.views, 0) DESC
      LIMIT 80
    `,
    sql`
      WITH current_cta AS (
        SELECT page_path, COUNT(*)::int AS current_total
        FROM conversion_events
        WHERE created_at >= now() - interval '7 days'
          AND event_type IN ('porto_click', 'cta_primary_click')
        GROUP BY 1
      ),
      previous_cta AS (
        SELECT page_path, COUNT(*)::int AS previous_total
        FROM conversion_events
        WHERE created_at < now() - interval '7 days'
          AND created_at >= now() - interval '14 days'
          AND event_type IN ('porto_click', 'cta_primary_click')
        GROUP BY 1
      )
      SELECT
        COALESCE(c.page_path, p.page_path) AS page_path,
        COALESCE(c.current_total, 0) AS current_total,
        COALESCE(p.previous_total, 0) AS previous_total
      FROM current_cta c
      FULL OUTER JOIN previous_cta p ON p.page_path = c.page_path
      WHERE COALESCE(c.page_path, p.page_path) IS NOT NULL
    `
  ]);

  const trendMap = new Map(trendRows.map((row) => {
    const current = toNumber(row.current_total);
    const previous = toNumber(row.previous_total);
    const percent = previous ? Number((((current - previous) / previous) * 100).toFixed(1)) : 0;
    return [row.page_path, percent];
  }));

  return rows.map((row) => {
    const views = toNumber(row.views);
    const primaryCtas = toNumber(row.primary_ctas);
    const leads = toNumber(row.leads);
    return {
      pagePath: row.page_path,
      views,
      primaryCtas,
      secondaryCtas: toNumber(row.secondary_ctas),
      whatsappClicks: toNumber(row.whatsapp_clicks),
      scrollRelevant: toNumber(row.scroll_relevant),
      leads,
      exitSessions: toNumber(row.exit_sessions),
      exitRate: toPercent(row.exit_sessions, views),
      ctaRate: toPercent(primaryCtas, views),
      leadRate: toPercent(leads, views),
      ctaTrendPercent: trendMap.get(row.page_path) || 0
    };
  });
}

async function getLocalCampaignSnapshot(sql) {
  const rows = await sql`
    WITH views AS (
      SELECT
        COALESCE(utm_source, '') AS utm_source,
        COALESCE(utm_medium, '') AS utm_medium,
        COALESCE(utm_campaign, '') AS utm_campaign,
        COUNT(*)::int AS views
      FROM page_views
      WHERE created_at >= now() - interval '30 days'
      GROUP BY 1, 2, 3
    ),
    clicks AS (
      SELECT
        COALESCE(utm_source, '') AS utm_source,
        COALESCE(utm_medium, '') AS utm_medium,
        COALESCE(utm_campaign, '') AS utm_campaign,
        COUNT(*)::int AS clicks
      FROM conversion_events
      WHERE created_at >= now() - interval '30 days'
        AND event_type IN ('porto_click', 'cta_primary_click')
      GROUP BY 1, 2, 3
    ),
    leads_by_campaign AS (
      SELECT
        COALESCE(utm_source, '') AS utm_source,
        COALESCE(utm_medium, '') AS utm_medium,
        COALESCE(utm_campaign, '') AS utm_campaign,
        COUNT(*)::int AS leads,
        COUNT(*) FILTER (WHERE lead_status = 'ganho')::int AS gains,
        COUNT(*) FILTER (WHERE lead_status = 'perdido')::int AS losses
      FROM leads
      WHERE created_at >= now() - interval '30 days'
      GROUP BY 1, 2, 3
    )
    SELECT
      COALESCE(v.utm_source, c.utm_source, l.utm_source) AS utm_source,
      COALESCE(v.utm_medium, c.utm_medium, l.utm_medium) AS utm_medium,
      COALESCE(v.utm_campaign, c.utm_campaign, l.utm_campaign) AS utm_campaign,
      COALESCE(v.views, 0) AS views,
      COALESCE(c.clicks, 0) AS clicks,
      COALESCE(l.leads, 0) AS leads,
      COALESCE(l.gains, 0) AS gains,
      COALESCE(l.losses, 0) AS losses
    FROM views v
    FULL OUTER JOIN clicks c ON c.utm_source = v.utm_source AND c.utm_medium = v.utm_medium AND c.utm_campaign = v.utm_campaign
    FULL OUTER JOIN leads_by_campaign l
      ON l.utm_source = COALESCE(v.utm_source, c.utm_source)
      AND l.utm_medium = COALESCE(v.utm_medium, c.utm_medium)
      AND l.utm_campaign = COALESCE(v.utm_campaign, c.utm_campaign)
    WHERE COALESCE(v.utm_source, c.utm_source, l.utm_source, '') <> ''
      OR COALESCE(v.utm_medium, c.utm_medium, l.utm_medium, '') <> ''
      OR COALESCE(v.utm_campaign, c.utm_campaign, l.utm_campaign, '') <> ''
    ORDER BY COALESCE(c.clicks, 0) DESC, COALESCE(l.leads, 0) DESC
    LIMIT 80
  `;

  return rows.map((row) => {
    const views = toNumber(row.views);
    const clicks = toNumber(row.clicks);
    const leads = toNumber(row.leads);
    return {
      label: normalizeCampaignLabel(row.utm_source, row.utm_medium, row.utm_campaign),
      source: row.utm_source,
      medium: row.utm_medium,
      campaign: row.utm_campaign,
      views,
      clicks,
      leads,
      conversions: leads,
      spend: null,
      ctr: toPercent(clicks, views),
      leadRate: toPercent(leads, clicks),
      gains: toNumber(row.gains),
      losses: toNumber(row.losses),
      costPerLead: null
    };
  });
}

function mergeCampaignSignals(localCampaigns, revenueSnapshot) {
  const local = localCampaigns || [];
  const revenueCampaigns = (revenueSnapshot.campaigns || []).map((item) => ({
    label: `${item.sourceTitle} / ${item.name}`,
    source: item.sourceKey,
    medium: item.sourceTitle,
    campaign: item.name,
    views: item.impressions || 0,
    clicks: item.clicks || 0,
    leads: item.conversions || 0,
    conversions: item.conversions || 0,
    spend: item.spend || 0,
    ctr: item.ctr || 0,
    leadRate: toPercent(item.conversions || 0, item.clicks || 0),
    gains: item.conversions || 0,
    losses: 0,
    costPerLead: item.costPerConversion
  }));

  return [...local, ...revenueCampaigns];
}

function buildApprovalCandidates({ cockpitApprovals, insights, productApprovals, pageApprovals }) {
  const insightApprovals = insights
    .filter((item) => item.requiresApproval)
    .map((item) => ({
      id: `approval-${item.id}`,
      title: item.title,
      reason: item.reason,
      recommendation: item.recommendation,
      impact: item.impactEstimate,
      risk: item.priority,
      href: hrefByScope(item.scopeType, item.scopeId),
      actionLabel: 'Abrir contexto',
      sourceType: item.scopeType
    }));

  const merged = [...(cockpitApprovals || []), ...(productApprovals || []), ...(pageApprovals || []), ...insightApprovals];
  const seen = new Set();

  const unique = merged.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  const previewWeight = (item) => (item?.execution?.siteMutation?.applyMode === 'patch_preview' ? 0 : 1);

  return unique.sort((left, right) => {
    const leftWeight = previewWeight(left);
    const rightWeight = previewWeight(right);
    if (leftWeight !== rightWeight) return leftWeight - rightWeight;
    return 0;
  });
}

function buildAutomationSnapshot({ insights, ruleMatches, cost, scoreCards, executive, operations }) {
  const alerts = insights.filter((item) => ['Urgente', 'Alta'].includes(item.priority)).slice(0, 8);
  const tasks = alerts.map((item) => ({
    id: `task-${item.id}`,
    title: item.title,
    recommendation: item.recommendation,
    priority: item.priority,
    requiresApproval: item.requiresApproval
  }));

  const executions = [
    {
      id: 'exec-scores',
      title: 'Scores recalculados',
      status: 'success',
      detail: `${scoreCards.products.length} produtos, ${scoreCards.pages.length} páginas, ${scoreCards.campaigns.length} campanhas e ${scoreCards.seo.length} sinais SEO avaliados.`,
      executedAt: new Date().toISOString()
    },
    {
      id: 'exec-insights',
      title: 'Insights gerados',
      status: 'success',
      detail: `${insights.length} insights estruturados no formato diagnóstico + motivo + recomendação.`,
      executedAt: new Date().toISOString()
    },
    {
      id: 'exec-rules',
      title: 'Regras executadas',
      status: 'success',
      detail: `${ruleMatches.length} disparos em ${automationRuleCatalog.length} regras ativas.`,
      executedAt: new Date().toISOString()
    },
    {
      id: 'exec-cost-mode',
      title: 'Modo de IA recalculado',
      status: cost.policy.useEconomicMode ? 'warning' : 'success',
      detail: `Modo atual: ${cost.currentModeLabel}.`,
      executedAt: new Date().toISOString()
    },
    {
      id: 'exec-daily-checklist',
      title: 'Checklist do dia montado',
      status: 'success',
      detail: `${executive.centralPriorities.actions.length} ações iniciais na central de prioridades.`,
      executedAt: new Date().toISOString()
    }
  ];

  return {
    summary: {
      activeAutomations: 4,
      blockedAutomations: cost.policy.stopNonEssential ? 2 : 0,
      generatedTasks: tasks.length,
      approvalsRequired: alerts.filter((item) => item.requiresApproval).length,
      activeOperations: (operations?.summary?.ready || 0) + (operations?.summary?.running || 0),
      completedOperations: operations?.summary?.completed || 0
    },
    alerts,
    tasks,
    reclassifications: {
      products: scoreCards.products.slice(0, 4).map((item) => ({
        label: item.label,
        status: item.priorityLabel,
        score: item.profitPriorityScore
      })),
      pages: scoreCards.pages.slice(0, 4).map((item) => ({
        label: formatPageLabel(item.pagePath),
        status: item.classification,
        score: item.pageHealthScore
      })),
      campaigns: scoreCards.campaigns.slice(0, 4).map((item) => ({
        label: item.label,
        status: item.classification,
        score: item.campaignHealthScore
      }))
    },
    executions,
    operations,
    policies: {
      summaryDaily: true,
      summaryWeekly: true,
      rankOpportunities: true,
      rankPriorities: true,
      economicMode: cost.policy.useEconomicMode,
      stopNonEssential: cost.policy.stopNonEssential
    }
  };
}

function buildMission({ summary, insights, automations, approvals, executive }) {
  return {
    date: new Date().toISOString().slice(0, 10),
    summary: summary.daily,
    weeklySummary: summary.weekly,
    topPriority: summary.topPriority,
    actions: insights.slice(0, 5).map((item) => ({
      title: item.title,
      recommendation: item.recommendation,
      priority: item.priority,
      requiresApproval: item.requiresApproval
    })),
    alerts: automations.alerts.slice(0, 4),
    opportunities: executive.opportunities.slice(0, 4),
    approvalsWaiting: approvals.pending.length
  };
}

export async function getAdminDecisionEngineSnapshot() {
  const sql = getDb();

  const [
    executive,
    cockpit,
    behavior,
    revenue,
    searchConsole,
    cost,
    operationsSnapshot,
    jobsSnapshot,
    pages,
    localCampaigns,
    productsSnapshot,
    pagesSnapshot
  ] = await Promise.all([
    getExecutiveDashboardSnapshot(),
    getExecutiveCockpitSnapshot(),
    getBehaviorIntelligenceSnapshot({ days: 30 }),
    getRevenueIntelligenceSnapshot(),
    getSearchConsoleOpportunitySnapshot(CORE_PRODUCTS),
    getAiCostSnapshot(),
    getAutomationOperationsSnapshot(),
    getAdminJobsSnapshot(),
    getPagePerformanceSnapshot(sql),
    getLocalCampaignSnapshot(sql),
    getAdminProductsSnapshot(),
    getAdminPagesSnapshot()
  ]);

  const scoreCards = {
    products: buildProductScores(cockpit.products || [], searchConsole),
    pages: buildPageScores(pages),
    campaigns: buildCampaignScores(mergeCampaignSignals(localCampaigns, revenue)),
    seo: buildSeoScores(searchConsole)
  };

  const ruleEvaluation = evaluateBusinessRules({
    productScores: scoreCards.products,
    pageScores: scoreCards.pages,
    campaignScores: scoreCards.campaigns,
    seoScores: scoreCards.seo,
    executive
  });

  const insights = buildRecommendationsFromRules({
    matches: ruleEvaluation.matches,
    cockpit,
    executive,
    scoreCards
  });

  const productApprovals = buildProductDecisionApprovals(productsSnapshot);
  const pageApprovals = buildPageDecisionApprovals(pagesSnapshot);
  const approvalCandidates = buildApprovalCandidates({
    cockpitApprovals: cockpit.approvals,
    insights,
    productApprovals,
    pageApprovals
  });
  const [approvalDecisions, approvalExecutions] = await Promise.all([
    readApprovalDecisions(),
    readLatestApprovalExecutionMap()
  ]);
  const approvals = attachApprovalExecutionState(
    mergeApprovalState(approvalCandidates, approvalDecisions),
    approvalExecutions
  );

  const automations = buildAutomationSnapshot({
    insights,
    ruleMatches: ruleEvaluation.matches,
    cost,
    scoreCards,
    executive,
    operations: operationsSnapshot
  });

  const summary = buildIntelligenceSummary({
    executive,
    cockpit,
    insights,
    scores: scoreCards,
    automations,
    cost
  });

  const [promptBundle, guardrails] = await Promise.all([
    buildPromptBundle({
      summary,
      mode: cost.currentMode,
      insights,
      rules: ruleEvaluation.rules
    }),
    getExecutionGuardrailsSnapshot()
  ]);

  return {
    checkedAt: new Date().toISOString(),
    executive,
    cockpit,
    behavior,
    revenue,
    seo: searchConsole,
    scores: scoreCards,
    rules: ruleEvaluation,
    insights,
    approvals,
    automations,
    jobs: jobsSnapshot,
    operations: operationsSnapshot,
    guardrails,
    cost,
    promptBundle,
    mission: buildMission({
      summary,
      insights,
      automations,
      approvals,
      executive
    }),
    summaries: summary
  };
}
