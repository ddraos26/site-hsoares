import 'server-only';

import { getGoogleAdsSnapshot, getMetaAdsSnapshot, getWhatsAppCrmSnapshot } from '@/lib/admin/revenue-connectors';

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCurrency(value) {
  return Number(toNumber(value).toFixed(2));
}

function computeCtr(clicks, impressions) {
  if (!impressions) return 0;
  return Number(((clicks / impressions) * 100).toFixed(2));
}

function computeCostPerConversion(spend, conversions) {
  if (!conversions) return null;
  return toCurrency(spend / conversions);
}

function flattenCampaigns(sources = []) {
  return sources.flatMap((source) =>
    (source.campaigns || []).map((campaign) => ({
      sourceKey: source.key,
      sourceTitle: source.title,
      ...campaign,
      ctr: computeCtr(campaign.clicks, campaign.impressions),
      costPerConversion: computeCostPerConversion(campaign.spend, campaign.conversions)
    }))
  );
}

function buildSummary(connectedSources, preparedSources, campaigns, crmSource) {
  const totals = campaigns.reduce(
    (acc, item) => ({
      spend: toCurrency(acc.spend + toNumber(item.spend)),
      clicks: acc.clicks + toNumber(item.clicks),
      impressions: acc.impressions + toNumber(item.impressions),
      conversions: acc.conversions + toNumber(item.conversions)
    }),
    { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
  );

  return {
    connectedMediaSources: connectedSources.length,
    preparedMediaSources: preparedSources.length,
    totalSpend: totals.spend,
    totalClicks: totals.clicks,
    totalImpressions: totals.impressions,
    totalConversions: totals.conversions,
    overallCtr: computeCtr(totals.clicks, totals.impressions),
    crmConnected: crmSource?.status === 'connected'
  };
}

export async function getRevenueIntelligenceSnapshot() {
  const [metaAds, googleAds, whatsappCrm] = await Promise.all([
    getMetaAdsSnapshot(),
    getGoogleAdsSnapshot(),
    getWhatsAppCrmSnapshot()
  ]);

  const sources = [metaAds, googleAds];
  const connectedSources = sources.filter((item) => item.status === 'connected');
  const preparedSources = sources.filter((item) => ['connected', 'ready'].includes(item.status));
  const campaigns = flattenCampaigns(connectedSources);

  const bestInvestmentCampaign = [...campaigns]
    .filter((item) => item.conversions > 0 || item.clicks > 0)
    .sort((a, b) => {
      const aScore = (a.conversions * 100) + a.clicks;
      const bScore = (b.conversions * 100) + b.clicks;
      return bScore - aScore || b.spend - a.spend;
    })[0] || null;

  const biggestWasteCampaign = [...campaigns]
    .filter((item) => item.spend > 0 && item.conversions === 0)
    .sort((a, b) => b.spend - a.spend || b.clicks - a.clicks)[0] || null;

  const nextActions = [metaAds, googleAds, whatsappCrm]
    .filter((item) => item.status !== 'connected')
    .map((item) => ({
      key: item.key,
      title: item.title,
      status: item.status,
      statusLabel: item.statusLabel,
      action: item.nextAction,
      reason: item.reason
    }));

  return {
    checkedAt: new Date().toISOString(),
    summary: buildSummary(connectedSources, preparedSources, campaigns, whatsappCrm),
    sources: {
      metaAds,
      googleAds,
      whatsappCrm
    },
    channels: connectedSources.map((item) => ({
      key: item.key,
      title: item.title,
      status: item.status,
      statusLabel: item.statusLabel,
      spend: toCurrency(item.summary?.spend || 0),
      clicks: toNumber(item.summary?.clicks || 0),
      impressions: toNumber(item.summary?.impressions || 0),
      conversions: toNumber(item.summary?.conversions || 0)
    })),
    campaigns,
    bestInvestmentCampaign,
    biggestWasteCampaign,
    nextActions
  };
}
