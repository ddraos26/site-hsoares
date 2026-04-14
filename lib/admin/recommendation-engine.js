import 'server-only';

import { formatInsightRecord } from '@/lib/admin/insight-formatter';
import { formatPageLabel } from '@/lib/admin/page-presentation';

function priorityFromRule(ruleId) {
  return (
    {
      'campaign-high-spend-low-efficiency': 'Urgente',
      'page-high-traffic-low-conversion': 'Alta',
      'seo-high-impression-low-ctr': 'Média',
      'product-good-conversion-low-attention': 'Alta',
      'cta-performance-drop': 'Alta',
      'overdue-commercial-queue': 'Urgente'
    }[ruleId] || 'Média'
  );
}

function toneFromRule(ruleId) {
  return (
    {
      'campaign-high-spend-low-efficiency': 'danger',
      'page-high-traffic-low-conversion': 'warning',
      'seo-high-impression-low-ctr': 'premium',
      'product-good-conversion-low-attention': 'success',
      'cta-performance-drop': 'warning',
      'overdue-commercial-queue': 'danger'
    }[ruleId] || 'neutral'
  );
}

function buildInsightFromRule(match) {
  switch (match.ruleId) {
    case 'campaign-high-spend-low-efficiency':
      return formatInsightRecord({
        id: `insight-${match.ruleId}-${match.scopeId}`,
        scopeType: 'campaign',
        scopeId: match.scopeId,
        insightType: 'campaign_review',
        title: `${match.label} merece revisão ou pausa`,
        diagnosis: match.diagnosis,
        reason: `A campanha acumula gasto de ${match.metrics.spend || 0} com ${match.metrics.clicks} cliques e ${match.metrics.leads} leads.`,
        recommendation: 'Revisar anúncio, segmentação, landing e considerar pausa se o quadro persistir.',
        priority: priorityFromRule(match.ruleId),
        impactEstimate: 'Redução imediata de desperdício de verba.',
        requiresApproval: true,
        tone: toneFromRule(match.ruleId),
        sourceRuleId: match.ruleId,
        evidence: [match.metrics]
      });
    case 'page-high-traffic-low-conversion':
      return formatInsightRecord({
        id: `insight-${match.ruleId}-${match.scopeId}`,
        scopeType: 'page',
        scopeId: match.scopeId,
        insightType: 'page_optimization',
        title: `${match.label} precisa de otimização`,
        diagnosis: match.diagnosis,
        reason: `A página recebeu ${match.metrics.views} visitas com lead rate de ${match.metrics.leadRate}%.`,
        recommendation: 'Revisar headline, CTA principal, prova de benefício e hierarquia da dobra inicial.',
        priority: priorityFromRule(match.ruleId),
        impactEstimate: 'Aumento de conversão aproveitando o tráfego já existente.',
        requiresApproval: false,
        tone: toneFromRule(match.ruleId),
        sourceRuleId: match.ruleId,
        evidence: [match.metrics]
      });
    case 'seo-high-impression-low-ctr':
      return formatInsightRecord({
        id: `insight-${match.ruleId}-${match.scopeId}`,
        scopeType: 'seo',
        scopeId: match.scopeId,
        insightType: 'seo_opportunity',
        title: `Existe oportunidade orgânica em "${match.label}"`,
        diagnosis: match.diagnosis,
        reason: `A query já tem ${match.metrics.impressions} impressões com CTR de ${match.metrics.ctr}% e posição ${match.metrics.position}.`,
        recommendation: 'Revisar title, meta description, promessa comercial e cobertura do tema na página alvo.',
        priority: priorityFromRule(match.ruleId),
        impactEstimate: 'Mais clique orgânico com intenção já comprovada.',
        requiresApproval: false,
        tone: toneFromRule(match.ruleId),
        sourceRuleId: match.ruleId,
        evidence: [match.metrics]
      });
    case 'product-good-conversion-low-attention':
      return formatInsightRecord({
        id: `insight-${match.ruleId}-${match.scopeId}`,
        scopeType: 'product',
        scopeId: match.scopeId,
        insightType: 'product_scale',
        title: `${match.label} merece mais atenção`,
        diagnosis: match.diagnosis,
        reason: `O produto tem ${match.metrics.leadRate}% de lead rate e score de oportunidade ${match.metrics.opportunityScore}.`,
        recommendation: 'Priorizar mídia, conteúdo e remarketing nesse produto.',
        priority: priorityFromRule(match.ruleId),
        impactEstimate: 'Aumento de leads em cima de uma oferta já validada.',
        requiresApproval: true,
        tone: toneFromRule(match.ruleId),
        sourceRuleId: match.ruleId,
        evidence: [match.metrics]
      });
    case 'cta-performance-drop':
      return formatInsightRecord({
        id: `insight-${match.ruleId}-${match.scopeId}`,
        scopeType: 'page',
        scopeId: match.scopeId,
        insightType: 'cta_drop',
        title: `O CTA principal caiu em ${match.label}`,
        diagnosis: match.diagnosis,
        reason: `O desempenho do CTA caiu ${match.metrics.ctaTrendPercent}% na comparação semanal.`,
        recommendation: 'Testar nova headline, CTA e contraste visual do botão principal.',
        priority: priorityFromRule(match.ruleId),
        impactEstimate: 'Recupera intenção perdida no topo do funil.',
        requiresApproval: false,
        tone: toneFromRule(match.ruleId),
        sourceRuleId: match.ruleId,
        evidence: [match.metrics]
      });
    case 'overdue-commercial-queue':
      return formatInsightRecord({
        id: `insight-${match.ruleId}-${match.scopeId}`,
        scopeType: 'operation',
        scopeId: match.scopeId,
        insightType: 'commercial_queue',
        title: 'A base comercial deve vir antes de comprar mais tráfego',
        diagnosis: match.diagnosis,
        reason: 'Já existe intenção captada suficiente para extrair resultado no curto prazo.',
        recommendation: 'Atacar follow-ups vencidos, redistribuir leads sem dono e limpar a fila primeiro.',
        priority: priorityFromRule(match.ruleId),
        impactEstimate: 'Melhora de conversão com custo incremental baixo.',
        requiresApproval: false,
        tone: toneFromRule(match.ruleId),
        sourceRuleId: match.ruleId,
        evidence: [match.metrics]
      });
    default:
      return null;
  }
}

export function buildRecommendationsFromRules({ matches, cockpit, executive, scoreCards }) {
  const ruleInsights = matches.map(buildInsightFromRule).filter(Boolean);

  const nativeInsights = [];

  if (cockpit?.products?.[0]) {
    nativeInsights.push(
      formatInsightRecord({
        id: `native-product-${cockpit.products[0].slug}`,
        scopeType: 'product',
        scopeId: cockpit.products[0].slug,
        insightType: 'daily_priority',
        title: `Hoje priorize ${cockpit.products[0].label}`,
        diagnosis: cockpit.commandCenter.diagnosis,
        reason: cockpit.commandCenter.why,
        recommendation: cockpit.commandCenter.recommendation,
        priority: 'Alta',
        impactEstimate: cockpit.commandCenter.impact,
        requiresApproval: false,
        tone: 'success'
      })
    );
  }

  if (scoreCards.pages[0]) {
    const pageLabel = formatPageLabel(scoreCards.pages[0].pagePath);
    nativeInsights.push(
      formatInsightRecord({
        id: `native-page-${scoreCards.pages[0].pagePath}`,
        scopeType: 'page',
        scopeId: scoreCards.pages[0].pagePath,
        insightType: 'page_health',
        title: `${pageLabel} está no topo da fila de revisão`,
        diagnosis: 'A página concentrou urgência alta dentro do motor de score.',
        reason: `PageHealthScore ${scoreCards.pages[0].pageHealthScore} e UrgencyScore ${scoreCards.pages[0].urgencyScore}.`,
        recommendation: 'Abrir a rota, revisar copy, CTA e contexto de intenção antes de ampliar distribuição.',
        priority: 'Alta',
        impactEstimate: 'Recupera conversão na landing com maior risco atual.',
        requiresApproval: false,
        tone: 'warning'
      })
    );
  }

  if (executive?.opportunities?.[0]) {
    nativeInsights.push(
      formatInsightRecord({
        id: `native-opportunity-${executive.opportunities[0].title}`,
        scopeType: 'global',
        scopeId: 'opportunity',
        insightType: 'growth_move',
        title: executive.opportunities[0].title,
        diagnosis: executive.opportunities[0].description,
        reason: 'Essa é uma das principais alavancas detectadas pelo centro de decisão.',
        recommendation: 'Executar a ação sugerida ainda neste ciclo diário.',
        priority: 'Média',
        impactEstimate: executive.opportunities[0].value || 'Ganho potencial de tração.',
        requiresApproval: false,
        tone: 'premium'
      })
    );
  }

  return [...ruleInsights, ...nativeInsights]
    .sort((a, b) => b.priorityRank - a.priorityRank || Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 18);
}
