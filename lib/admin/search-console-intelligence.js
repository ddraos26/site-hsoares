import 'server-only';

import { google } from 'googleapis';
import { getGoogleAuthClient, getGoogleServiceAccountEmail } from '@/lib/google/client';
import { siteConfig } from '@/lib/site';

const SITE_URL = siteConfig.url.replace(/\/$/, '');
const DOMAIN_PROPERTY = `sc-domain:${new URL(SITE_URL).hostname}`;

function normalizePropertyId(value) {
  return typeof value === 'string' ? value.replace(/\/$/, '') : '';
}

function resolveSearchConsoleProperty(sites) {
  const entries = sites.data.siteEntry ?? [];
  const candidates = [SITE_URL, `${SITE_URL}/`, DOMAIN_PROPERTY];

  return entries.find((entry) => candidates.some((candidate) => normalizePropertyId(entry.siteUrl) === normalizePropertyId(candidate))) ?? null;
}

function startDate(days = 28) {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function endDate() {
  return new Date().toISOString().slice(0, 10);
}

function dateDaysAgo(daysAgo = 0) {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapQueryRow(row) {
  return {
    query: row.keys?.[0] || 'Sem termo',
    clicks: toNumber(row.clicks),
    impressions: toNumber(row.impressions),
    ctr: Number(((toNumber(row.ctr) || 0) * 100).toFixed(2)),
    position: Number(toNumber(row.position).toFixed(1))
  };
}

function mapPageRow(row) {
  return {
    page: row.keys?.[0] || 'Sem página',
    clicks: toNumber(row.clicks),
    impressions: toNumber(row.impressions),
    ctr: Number(((toNumber(row.ctr) || 0) * 100).toFixed(2)),
    position: Number(toNumber(row.position).toFixed(1))
  };
}

function buildOpportunityScore(row) {
  const positionGain = Math.max(0, 18 - row.position);
  const ctrGap = Math.max(0, 4 - row.ctr);
  return Math.round((row.impressions * 0.08) + (positionGain * 6) + (ctrGap * 10) + (row.clicks * 3));
}

function buildOpportunityList(rows = []) {
  return rows
    .filter((row) => row.impressions >= 20 && row.position >= 3 && row.position <= 15)
    .map((row) => ({
      ...row,
      opportunityScore: buildOpportunityScore(row)
    }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore || b.impressions - a.impressions || a.position - b.position)
    .slice(0, 8);
}

function buildPageOpportunityList(rows = []) {
  return rows
    .filter((row) => row.impressions >= 20 && row.position >= 3 && row.position <= 20)
    .map((row) => ({
      ...row,
      opportunityScore: buildOpportunityScore(row)
    }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore || b.impressions - a.impressions || a.position - b.position)
    .slice(0, 8);
}

function buildMomentumList(currentRows = [], previousRows = []) {
  const previousMap = new Map(previousRows.map((row) => [row.query, row]));

  return currentRows
    .map((row) => {
      const previous = previousMap.get(row.query);
      const previousClicks = previous?.clicks || 0;
      const previousImpressions = previous?.impressions || 0;
      const clickDelta = row.clicks - previousClicks;
      const impressionDelta = row.impressions - previousImpressions;
      const growthScore = (clickDelta * 10) + (impressionDelta * 0.35) + ((row.ctr - (previous?.ctr || 0)) * 8);

      return {
        ...row,
        previousClicks,
        previousImpressions,
        clickDelta,
        impressionDelta,
        growthScore: Number(growthScore.toFixed(1))
      };
    })
    .filter((row) => row.impressions >= 20 || row.previousImpressions >= 20)
    .sort((a, b) => b.growthScore - a.growthScore || b.clickDelta - a.clickDelta || b.impressions - a.impressions);
}

function emptySnapshot(status, statusLabel, reason, serviceAccountEmail = null) {
  return {
    status,
    statusLabel,
    serviceAccountEmail,
    propertyId: null,
    topQueries: [],
    bestCtrQueries: [],
    lowCtrQueries: [],
    risingQueries: [],
    fallingQueries: [],
    topPages: [],
    pageOpportunities: [],
    opportunities: [],
    productOpportunities: [],
    sitemaps: [],
    reason
  };
}

async function runQuery(searchconsole, propertyId, requestBody) {
  const response = await searchconsole.searchanalytics.query({
    siteUrl: propertyId,
    requestBody
  });

  return response.data.rows || [];
}

export async function getSearchConsoleOpportunitySnapshot(coreProducts = []) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return emptySnapshot(
      'blocked',
      'Search Console não conectado',
      'A conta de serviço do Google ainda não está configurada para leitura orgânica.'
    );
  }

  try {
    const auth = await getGoogleAuthClient();
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const sites = await searchconsole.sites.list();
    const property = resolveSearchConsoleProperty(sites);
    const serviceAccountEmail = getGoogleServiceAccountEmail();

    if (!property) {
      return emptySnapshot(
        'partial',
        'Permissão pendente',
        `Adicione ${serviceAccountEmail} na propriedade ${DOMAIN_PROPERTY} para liberar queries e oportunidades orgânicas.`,
        serviceAccountEmail
      );
    }

    const propertyId = property.siteUrl;
    const commonRequest = {
      startDate: startDate(28),
      endDate: endDate(),
      searchType: 'web'
    };

    const topQueryRows = await runQuery(searchconsole, propertyId, {
      ...commonRequest,
      dimensions: ['query'],
      rowLimit: 50
    });

    const previousQueryRows = await runQuery(searchconsole, propertyId, {
      startDate: dateDaysAgo(56),
      endDate: dateDaysAgo(29),
      searchType: 'web',
      dimensions: ['query'],
      rowLimit: 50
    });

    const topPageRows = await runQuery(searchconsole, propertyId, {
      ...commonRequest,
      dimensions: ['page'],
      rowLimit: 25
    });

    const topQueries = topQueryRows.map(mapQueryRow);
    const previousQueries = previousQueryRows.map(mapQueryRow);
    const topPages = topPageRows.map(mapPageRow);
    const opportunities = buildOpportunityList(topQueries);
    const pageOpportunities = buildPageOpportunityList(topPages);
    const bestCtrQueries = [...topQueries]
      .filter((row) => row.impressions >= 20)
      .sort((a, b) => b.ctr - a.ctr || b.clicks - a.clicks)
      .slice(0, 8);
    const lowCtrQueries = [...topQueries]
      .filter((row) => row.impressions >= 20)
      .sort((a, b) => a.ctr - b.ctr || b.impressions - a.impressions)
      .slice(0, 8);
    const momentum = buildMomentumList(topQueries, previousQueries);
    const risingQueries = momentum.filter((row) => row.growthScore > 0).slice(0, 8);
    const fallingQueries = [...momentum]
      .filter((row) => row.growthScore < 0)
      .sort((a, b) => a.growthScore - b.growthScore || a.clickDelta - b.clickDelta)
      .slice(0, 8);

    const productOpportunities = [];

    for (const product of coreProducts) {
      try {
        const rows = await runQuery(searchconsole, propertyId, {
          ...commonRequest,
          dimensions: ['query'],
          rowLimit: 10,
          dimensionFilterGroups: [
            {
              groupType: 'and',
              filters: [
                {
                  dimension: 'page',
                  operator: 'contains',
                  expression: `${SITE_URL}/produtos/${product.slug}`
                }
              ]
            }
          ]
        });

        const mapped = rows.map(mapQueryRow);
        const bestOpportunity = buildOpportunityList(mapped)[0] || null;

        productOpportunities.push({
          slug: product.slug,
          topQueries: mapped.slice(0, 5),
          bestOpportunity
        });
      } catch {
        productOpportunities.push({
          slug: product.slug,
          topQueries: [],
          bestOpportunity: null
        });
      }
    }

    const sitemapResponse = await searchconsole.sitemaps.list({ siteUrl: propertyId });
    const sitemaps = (sitemapResponse.data.sitemap || []).map((item) => ({
      path: item.path || 'Sitemap',
      type: item.type || 'Desconhecido',
      status: item.isPending ? 'pending' : 'submitted',
      lastSubmitted: item.lastSubmitted || null,
      lastDownloaded: item.lastDownloaded || null
    }));

    return {
      status: 'connected',
      statusLabel: 'Search Console ativo',
      serviceAccountEmail,
      propertyId,
      topQueries,
      bestCtrQueries,
      lowCtrQueries,
      risingQueries,
      fallingQueries,
      topPages,
      pageOpportunities,
      opportunities,
      productOpportunities,
      sitemaps,
      reason: `Queries orgânicas lidas com sucesso em ${propertyId}.`
    };
  } catch (error) {
    return emptySnapshot(
      'partial',
      'Leitura orgânica indisponível',
      error instanceof Error ? error.message : 'Falha ao consultar Search Console.',
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? getGoogleServiceAccountEmail() : null
    );
  }
}
