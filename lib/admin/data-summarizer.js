import 'server-only';

import { formatPageLabel } from '@/lib/admin/page-presentation';

function topTitle(items = [], fallback = 'Sem destaque dominante') {
  return items[0]?.title || items[0]?.label || items[0]?.query || fallback;
}

export function buildIntelligenceSummary({ executive, cockpit, insights, scores, automations, cost }) {
  const topInsight = insights[0];
  const topProduct = scores.products[0];
  const topPage = scores.pages[0];
  const topCampaign = scores.campaigns[0];
  const topSeo = scores.seo[0];

  const daily = [
    executive.commandCenter.title,
    topInsight ? `Principal insight: ${topInsight.title}.` : null,
    topProduct ? `Produto prioritário: ${topProduct.label}.` : null,
    topPage ? `Página em foco: ${formatPageLabel(topPage.pagePath)}.` : null,
    topCampaign ? `Campanha em foco: ${topCampaign.label}.` : null
  ].filter(Boolean).join(' ');

  const weekly = [
    `Na semana, o cockpit concentrou ${executive.kpis.leadsToday} leads hoje e ${cockpit.summary.totalCoreLeads} leads core no recorte observado.`,
    `Melhor oportunidade atual: ${topTitle(cockpit.growthMoves)}.`,
    `Melhor brecha orgânica: ${topSeo ? topSeo.query : 'sem termo dominante'}.`,
    `Modo de IA sugerido: ${cost.currentModeLabel}.`,
    `Automações ativas: ${automations.summary.activeAutomations}.`
  ].join(' ');

  return {
    daily,
    weekly,
    topPriority: topInsight?.title || executive.commandCenter.title,
    dataPoints: {
      bestProduct: topProduct?.label || null,
      bestPage: topPage ? formatPageLabel(topPage.pagePath) : null,
      bestCampaign: topCampaign?.label || null,
      bestSeoOpportunity: topSeo?.query || null
    }
  };
}
