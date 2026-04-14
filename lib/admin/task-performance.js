import 'server-only';

import { getDb } from '@/lib/db';
import { getSearchConsoleOpportunitySnapshot } from '@/lib/admin/search-console-intelligence';

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeRate(numerator, denominator) {
  if (!denominator) return null;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function emptyMetricSnapshot(capturedAt = new Date().toISOString()) {
  return {
    capturedAt,
    visits: null,
    clicks: null,
    leads: null,
    conversionRate: null,
    ctr: null,
    spend: null,
    cpl: null
  };
}

export function normalizePerformanceSnapshot(value = {}) {
  const before = value?.before || {};
  const after = value?.after || {};

  return {
    targetType: String(value?.targetType || '').trim(),
    targetId: String(value?.targetId || '').trim(),
    windowHours: Number(value?.windowHours || 0) || null,
    recheckAfterHours: Number(value?.recheckAfterHours || 0) || null,
    dueRecheckAt: value?.dueRecheckAt || null,
    retryCount: Number(value?.retryCount || 0) || 0,
    lastComparedAt: value?.lastComparedAt || null,
    before: {
      ...emptyMetricSnapshot(before?.capturedAt || null),
      ...before
    },
    after: {
      ...emptyMetricSnapshot(after?.capturedAt || null),
      ...after
    },
    result: String(value?.result || 'waiting').trim() || 'waiting',
    summary: String(value?.summary || '').trim(),
    nextRecommendation: value?.nextRecommendation == null ? null : String(value.nextRecommendation).trim()
  };
}

export function resolveTaskWindowHours(task = {}) {
  const targetType = String(task?.targetType || '').trim().toLowerCase();
  const whereToDo = String(task?.whereToDo || '').trim();

  if (targetType === 'seo') return 168;
  if (whereToDo === 'Google Ads') return 72;
  if (targetType === 'lead') return 24;
  return 72;
}

export function resolveTaskRecheckHours(task = {}) {
  const whereToDo = String(task?.whereToDo || '').trim();
  const targetType = String(task?.targetType || '').trim().toLowerCase();

  if (targetType === 'content') return 12;
  if (whereToDo === 'Google Ads') return 12;
  if (targetType === 'seo') return 24;
  if (whereToDo === 'VSCode') return 24;
  return 12;
}

async function capturePageMetrics({ pagePath, hours }) {
  const sql = getDb();
  const from = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const [row] = await sql`
    WITH views AS (
      SELECT COUNT(*)::int AS visits
      FROM page_views
      WHERE created_at >= ${from}
        AND page_path = ${pagePath}
    ),
    clicks AS (
      SELECT COUNT(*)::int AS clicks
      FROM conversion_events
      WHERE created_at >= ${from}
        AND page_path = ${pagePath}
        AND event_type IN ('porto_click', 'cta_primary_click', 'whatsapp_click')
    ),
    leads_by_page AS (
      SELECT COUNT(*)::int AS leads
      FROM leads
      WHERE created_at >= ${from}
        AND page_path = ${pagePath}
    )
    SELECT
      COALESCE((SELECT visits FROM views), 0) AS visits,
      COALESCE((SELECT clicks FROM clicks), 0) AS clicks,
      COALESCE((SELECT leads FROM leads_by_page), 0) AS leads
  `;

  const visits = Number(row?.visits || 0);
  const clicks = Number(row?.clicks || 0);
  const leads = Number(row?.leads || 0);

  return {
    ...emptyMetricSnapshot(),
    visits,
    clicks,
    leads,
    conversionRate: safeRate(leads, visits),
    ctr: safeRate(clicks, visits)
  };
}

async function captureProductMetrics({ productSlug, hours }) {
  const sql = getDb();
  const from = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const [row] = await sql`
    WITH views AS (
      SELECT COUNT(*)::int AS visits
      FROM page_views
      WHERE created_at >= ${from}
        AND page_path LIKE ${`/produtos/${productSlug}%`}
    ),
    clicks AS (
      SELECT COUNT(*)::int AS clicks
      FROM conversion_events
      WHERE created_at >= ${from}
        AND product_slug = ${productSlug}
        AND event_type IN ('porto_click', 'cta_primary_click', 'whatsapp_click')
    ),
    leads_by_product AS (
      SELECT COUNT(*)::int AS leads
      FROM leads
      WHERE created_at >= ${from}
        AND product_slug = ${productSlug}
    )
    SELECT
      COALESCE((SELECT visits FROM views), 0) AS visits,
      COALESCE((SELECT clicks FROM clicks), 0) AS clicks,
      COALESCE((SELECT leads FROM leads_by_product), 0) AS leads
  `;

  const visits = Number(row?.visits || 0);
  const clicks = Number(row?.clicks || 0);
  const leads = Number(row?.leads || 0);

  return {
    ...emptyMetricSnapshot(),
    visits,
    clicks,
    leads,
    conversionRate: safeRate(leads, visits),
    ctr: safeRate(clicks, visits)
  };
}

async function captureCampaignMetrics({ campaignId, hours }) {
  const sql = getDb();
  const from = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const [row] = await sql`
    WITH direct_campaign AS (
      SELECT id, name
      FROM campaigns
      WHERE id::text = ${campaignId}
         OR name = ${campaignId}
         OR external_id = ${campaignId}
      ORDER BY created_at DESC
      LIMIT 1
    ),
    snapshots AS (
      SELECT
        COALESCE(SUM(impressions), 0)::int AS impressions,
        COALESCE(SUM(clicks), 0)::int AS clicks,
        COALESCE(SUM(cost), 0)::numeric AS spend,
        COALESCE(SUM(conversions), 0)::int AS leads
      FROM campaign_snapshots
      WHERE campaign_id IN (SELECT id FROM direct_campaign)
        AND date >= ${from.slice(0, 10)}::date
    )
    SELECT
      COALESCE((SELECT impressions FROM snapshots), 0) AS impressions,
      COALESCE((SELECT clicks FROM snapshots), 0) AS clicks,
      COALESCE((SELECT spend FROM snapshots), 0) AS spend,
      COALESCE((SELECT leads FROM snapshots), 0) AS leads
  `;

  const visits = Number(row?.impressions || 0);
  const clicks = Number(row?.clicks || 0);
  const leads = Number(row?.leads || 0);
  const spend = Number(row?.spend || 0);

  return {
    ...emptyMetricSnapshot(),
    visits,
    clicks,
    leads,
    conversionRate: safeRate(leads, visits),
    ctr: safeRate(clicks, visits),
    spend,
    cpl: leads > 0 ? Number((spend / leads).toFixed(2)) : null
  };
}

async function captureSeoMetrics({ seoTarget }) {
  const snapshot = await getSearchConsoleOpportunitySnapshot();
  const target = String(seoTarget || '').trim().toLowerCase();
  const queryMatch =
    snapshot.topQueries?.find((item) => String(item.query || '').trim().toLowerCase() === target) ||
    snapshot.opportunities?.find((item) => String(item.query || '').trim().toLowerCase() === target) ||
    null;
  const pageMatch =
    snapshot.topPages?.find((item) => String(item.page || '').trim().toLowerCase() === target) ||
    snapshot.pageOpportunities?.find((item) => String(item.page || '').trim().toLowerCase() === target) ||
    null;

  const row = queryMatch || pageMatch;
  if (!row) {
    return emptyMetricSnapshot();
  }

  return {
    ...emptyMetricSnapshot(),
    visits: Number(row.impressions || 0),
    clicks: Number(row.clicks || 0),
    leads: null,
    conversionRate: null,
    ctr: toNumber(row.ctr)
  };
}

async function captureLeadMetrics() {
  return {
    ...emptyMetricSnapshot(),
    leads: 1
  };
}

export async function capturePerformanceForTask(task = {}) {
  const capturedAt = new Date().toISOString();
  const targetType = String(task?.targetType || '').trim().toLowerCase();
  const targetId = String(task?.targetId || '').trim();
  const hours = resolveTaskWindowHours(task);

  try {
    let snapshot = emptyMetricSnapshot(capturedAt);

    if ((targetType === 'page' || targetType === 'content') && targetId) {
      snapshot = await capturePageMetrics({ pagePath: targetId, hours });
    } else if (targetType === 'product' && targetId) {
      snapshot = await captureProductMetrics({ productSlug: targetId, hours });
    } else if (targetType === 'campaign' && targetId) {
      snapshot = await captureCampaignMetrics({ campaignId: targetId, hours });
    } else if (targetType === 'seo' && targetId) {
      snapshot = await captureSeoMetrics({ seoTarget: targetId });
    } else if (targetType === 'lead') {
      snapshot = await captureLeadMetrics();
    }

    return {
      ...snapshot,
      capturedAt
    };
  } catch (error) {
    return {
      ...emptyMetricSnapshot(capturedAt),
      error: error instanceof Error ? error.message : 'Falha ao capturar métricas.'
    };
  }
}

function compareDelta(after, before) {
  if (after == null || before == null) return null;
  return Number((after - before).toFixed(2));
}

function hasMass(snapshot = {}) {
  const visits = Number(snapshot.visits || 0);
  const clicks = Number(snapshot.clicks || 0);
  const leads = Number(snapshot.leads || 0);
  return visits >= 20 || clicks >= 5 || leads >= 1;
}

function waitRecommendation(task, attempts = 0) {
  const hours = resolveTaskRecheckHours(task);
  return attempts >= 2
    ? 'Mover para radar se o sinal continuar fraco e não houver nova massa crítica.'
    : `Esperar mais ${hours}h antes da próxima leitura.`;
}

export function compareTaskPerformance({ task, before, after, attempts = 0 }) {
  const normalizedBefore = before || emptyMetricSnapshot();
  const normalizedAfter = after || emptyMetricSnapshot();

  if (!hasMass(normalizedBefore) && !hasMass(normalizedAfter)) {
    return {
      result: attempts >= 2 ? 'neutral' : 'waiting',
      summary:
        attempts >= 2
          ? 'Ainda não há massa crítica forte o suficiente para concluir com segurança.'
          : 'Ainda não há massa crítica suficiente para concluir.',
      nextRecommendation: waitRecommendation(task, attempts)
    };
  }

  const leadDelta = compareDelta(normalizedAfter.leads, normalizedBefore.leads) || 0;
  const conversionDelta = compareDelta(normalizedAfter.conversionRate, normalizedBefore.conversionRate) || 0;
  const ctrDelta = compareDelta(normalizedAfter.ctr, normalizedBefore.ctr) || 0;
  const clicksDelta = compareDelta(normalizedAfter.clicks, normalizedBefore.clicks) || 0;
  const visitsDelta = compareDelta(normalizedAfter.visits, normalizedBefore.visits) || 0;
  const cplDelta = compareDelta(normalizedAfter.cpl, normalizedBefore.cpl) || 0;

  if ((leadDelta > 0 && cplDelta <= 0) || conversionDelta >= 0.35 || (task?.targetType === 'seo' && ctrDelta >= 0.7)) {
    return {
      result: 'positive',
      summary:
        leadDelta > 0
          ? 'A ação aumentou os leads sem piorar a eficiência.'
          : task?.targetType === 'seo'
            ? 'A leitura orgânica melhorou e a página captou mais clique qualificado.'
            : 'A ação melhorou a resposta da página com ganho perceptível de eficiência.',
      nextRecommendation:
        task?.whereToDo === 'Google Ads'
          ? 'Pode escalar com controle.'
          : 'Pode manter a mudança e observar uma nova rodada curta.'
    };
  }

  if (leadDelta < 0 || conversionDelta <= -0.35 || (normalizedBefore.cpl != null && normalizedAfter.cpl != null && normalizedAfter.cpl > normalizedBefore.cpl * 1.25)) {
    return {
      result: 'negative',
      summary:
        task?.targetType === 'seo'
          ? 'A leitura orgânica piorou ou perdeu tração na comparação.'
          : 'O resultado piorou de forma clara e a ação não sustentou eficiência.',
      nextRecommendation:
        task?.whereToDo === 'VSCode'
          ? 'Revisar CTA acima da dobra e proposta de valor.'
          : 'Abrir nova rodada com abordagem diferente antes de insistir.'
    };
  }

  if (clicksDelta > 0 && leadDelta === 0) {
    return {
      result: 'neutral',
      summary: 'Houve mais cliques, mas ainda sem conversão.',
      nextRecommendation: 'Revisar CTA acima da dobra ou reforçar a oferta antes de escalar.'
    };
  }

  if (visitsDelta > 0 && leadDelta === 0) {
    return {
      result: 'neutral',
      summary: 'O tráfego subiu, mas a página ainda não transformou atenção em lead.',
      nextRecommendation: 'Revisar headline, prova de valor e CTA antes de investir mais.'
    };
  }

  return {
    result: 'neutral',
    summary: 'A leitura ficou praticamente estável neste recorte.',
    nextRecommendation: 'Manter no radar e reavaliar se surgir nova massa crítica.'
  };
}
