import 'server-only';

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value || 0)));
}

function ratioScore(value, target, weight) {
  if (!target) return 0;
  return clamp((Number(value || 0) / target) * weight, 0, weight);
}

export function scoreTone(score) {
  if (score >= 75) return 'success';
  if (score >= 55) return 'warning';
  return 'danger';
}

export function scoreLabel(score) {
  if (score >= 82) return 'Muito alta';
  if (score >= 68) return 'Alta';
  if (score >= 52) return 'Média';
  return 'Baixa';
}

export function buildProductScores(products = [], searchConsoleSnapshot) {
  const seoMap = new Map((searchConsoleSnapshot.productOpportunities || []).map((item) => [item.slug, item.bestOpportunity]));

  return products
    .map((item) => {
      const seoOpportunity = seoMap.get(item.slug);
      const opportunityScore = Math.round(clamp(
        ratioScore(item.views, 120, 16) +
        ratioScore(item.clicks, 25, 14) +
        ratioScore(item.leads, 6, 22) +
        ratioScore(item.leadRate, 24, 18) +
        ratioScore(seoOpportunity?.opportunityScore || 0, 120, 16) +
        ratioScore(item.focusScore, 100, 14)
      ));

      const profitPriorityScore = Math.round(clamp(
        ratioScore(item.ganhos, 4, 25) +
        ratioScore(item.leads, 6, 18) +
        ratioScore(item.leadRate, 25, 20) +
        ratioScore(item.healthScore, 100, 17) +
        ratioScore(item.focusScore, 100, 20)
      ));

      const urgencyScore = Math.round(clamp(
        (item.narrative.motion === 'fix' ? 28 : 0) +
        (item.staleOpen * 8) +
        (item.unassigned * 6) +
        (item.daysWithoutLead >= 10 ? 18 : item.daysWithoutLead >= 5 ? 10 : 0) +
        (item.healthTone === 'danger' ? 16 : item.healthTone === 'warning' ? 8 : 0)
      ));

      return {
        slug: item.slug,
        label: item.label,
        opportunityScore,
        profitPriorityScore,
        urgencyScore,
        priorityLabel: scoreLabel(Math.round((opportunityScore + profitPriorityScore + urgencyScore) / 3)),
        tone: scoreTone(Math.round((opportunityScore + profitPriorityScore) / 2)),
        narrative: item.narrative,
        views: item.views,
        clicks: item.clicks,
        leads: item.leads,
        leadRate: item.leadRate,
        gains: item.ganhos
      };
    })
    .sort((a, b) => b.profitPriorityScore - a.profitPriorityScore || b.opportunityScore - a.opportunityScore || b.urgencyScore - a.urgencyScore);
}

export function buildPageScores(pages = []) {
  return pages
    .map((item) => {
      const pageHealthScore = Math.round(clamp(
        ratioScore(item.primaryCtas, 18, 16) +
        ratioScore(item.leads, 4, 22) +
        ratioScore(item.ctaRate, 12, 18) +
        ratioScore(item.leadRate, 6, 18) +
        clamp(18 - (item.exitRate * 0.28), 0, 18) +
        (item.views >= 50 && item.leads === 0 ? 0 : 8)
      ));

      const conversionScore = Math.round(clamp(
        ratioScore(item.primaryCtas, 18, 24) +
        ratioScore(item.leads, 4, 28) +
        ratioScore(item.leadRate, 6, 24) +
        ratioScore(item.whatsappClicks, 10, 14) +
        ratioScore(item.scrollRelevant, 12, 10)
      ));

      const urgencyScore = Math.round(clamp(
        (item.views >= 50 && item.leads === 0 ? 28 : 0) +
        (item.views >= 80 && item.primaryCtas <= 2 ? 20 : 0) +
        (item.exitRate >= 60 ? 18 : item.exitRate >= 45 ? 10 : 0) +
        (item.ctaTrendPercent <= -20 ? 16 : item.ctaTrendPercent <= -10 ? 8 : 0)
      ));

      return {
        pagePath: item.pagePath,
        pageHealthScore,
        conversionScore,
        urgencyScore,
        classification:
          pageHealthScore >= 75
            ? 'Página campeã'
            : pageHealthScore >= 58
              ? 'Página promissora'
              : item.views >= 50 && item.leads === 0
                ? 'Tráfego sem conversão'
                : 'Página crítica',
        tone: scoreTone(pageHealthScore),
        ...item
      };
    })
    .sort((a, b) => b.urgencyScore - a.urgencyScore || a.pageHealthScore - b.pageHealthScore || b.views - a.views);
}

export function buildCampaignScores(campaigns = []) {
  return campaigns
    .map((item) => {
      const campaignHealthScore = Math.round(clamp(
        ratioScore(item.clicks, 30, 14) +
        ratioScore(item.leads, 4, 24) +
        ratioScore(item.leadRate, 15, 24) +
        (item.spend > 0 && item.conversions === 0 ? 0 : 14) +
        (item.costPerLead != null ? clamp(24 - item.costPerLead * 0.6, 0, 24) : ratioScore(item.views, 80, 12))
      ));

      const efficiencyScore = Math.round(clamp(
        ratioScore(item.leadRate, 15, 30) +
        ratioScore(item.ctr, 6, 18) +
        ratioScore(item.conversions || item.leads, 4, 22) +
        (item.costPerLead != null ? clamp(30 - item.costPerLead * 0.75, 0, 30) : 12)
      ));

      const urgencyScore = Math.round(clamp(
        (item.spend >= 150 && (item.conversions || item.leads) === 0 ? 34 : 0) +
        (item.clicks >= 25 && item.leads === 0 ? 26 : 0) +
        (item.costPerLead != null && item.costPerLead >= 70 ? 20 : 0) +
        (campaignHealthScore < 50 ? 12 : 0)
      ));

      return {
        ...item,
        campaignHealthScore,
        efficiencyScore,
        urgencyScore,
        classification:
          campaignHealthScore >= 76
            ? 'Campanha vencedora'
            : campaignHealthScore >= 58
              ? 'Campanha em alerta'
              : urgencyScore >= 50
                ? 'Campanha crítica'
                : 'Campanha com oportunidade',
        tone: scoreTone(campaignHealthScore)
      };
    })
    .sort((a, b) => b.urgencyScore - a.urgencyScore || a.campaignHealthScore - b.campaignHealthScore || b.clicks - a.clicks);
}

export function buildSeoScores(searchConsoleSnapshot) {
  const queryPool = [
    ...(searchConsoleSnapshot.opportunities || []),
    ...(searchConsoleSnapshot.lowCtrQueries || [])
  ];
  const seen = new Set();

  return queryPool
    .filter((item) => {
      const key = item.query;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => {
      const seoOpportunityScore = Math.round(clamp(
        ratioScore(item.impressions, 180, 32) +
        ratioScore(Math.max(0, 15 - item.position), 15, 24) +
        ratioScore(Math.max(0, 4 - item.ctr), 4, 24) +
        ratioScore(item.clicks, 24, 20)
      ));

      const urgencyScore = Math.round(clamp(
        (item.impressions >= 100 && item.ctr <= 2 ? 26 : 0) +
        (item.position >= 4 && item.position <= 12 ? 22 : 0) +
        (item.impressions >= 250 ? 14 : 0)
      ));

      return {
        query: item.query,
        impressions: item.impressions,
        clicks: item.clicks,
        ctr: item.ctr,
        position: item.position,
        seoOpportunityScore,
        urgencyScore,
        tone: scoreTone(seoOpportunityScore)
      };
    })
    .sort((a, b) => b.seoOpportunityScore - a.seoOpportunityScore || b.urgencyScore - a.urgencyScore || b.impressions - a.impressions);
}
