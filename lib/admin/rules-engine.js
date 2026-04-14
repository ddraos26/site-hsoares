import 'server-only';

import { formatPageLabel } from '@/lib/admin/page-presentation';

export const automationRuleCatalog = [
  {
    id: 'campaign-high-spend-low-efficiency',
    name: 'Campanha cara sem retorno',
    type: 'campaign',
    description: 'Se campanha gasta acima do threshold e não gera conversão, marcar como crítica.',
    trigger: 'snapshot',
    conditionJson: {
      minSpend: 150,
      maxConversions: 0
    },
    actionJson: {
      action: 'mark_critical',
      recommendation: 'revisar_ou_pausar'
    },
    requiresApproval: true,
    isActive: true
  },
  {
    id: 'page-high-traffic-low-conversion',
    name: 'Página com tráfego sem conversão',
    type: 'page',
    description: 'Se a página recebe tráfego alto e converte pouco, pedir revisão imediata.',
    trigger: 'snapshot',
    conditionJson: {
      minViews: 50,
      maxLeadRate: 3
    },
    actionJson: {
      action: 'suggest_revision',
      recommendation: 'revisar_copy_cta_prova'
    },
    requiresApproval: false,
    isActive: true
  },
  {
    id: 'seo-high-impression-low-ctr',
    name: 'Query com impressões e CTR ruim',
    type: 'seo',
    description: 'Se a query aparece bastante, mas capta pouco clique, sugerir revisão de title/meta/copy.',
    trigger: 'snapshot',
    conditionJson: {
      minImpressions: 80,
      maxCtr: 2.5
    },
    actionJson: {
      action: 'suggest_snippet_revision',
      recommendation: 'revisar_title_meta'
    },
    requiresApproval: false,
    isActive: true
  },
  {
    id: 'product-good-conversion-low-attention',
    name: 'Produto bom com pouca atenção',
    type: 'product',
    description: 'Se o produto converte bem e ainda recebe atenção baixa, sugerir escala.',
    trigger: 'snapshot',
    conditionJson: {
      minLeadRate: 15,
      maxViews: 60
    },
    actionJson: {
      action: 'suggest_budget_increase',
      recommendation: 'priorizar_midia_e_conteudo'
    },
    requiresApproval: true,
    isActive: true
  },
  {
    id: 'cta-performance-drop',
    name: 'Queda de CTA principal',
    type: 'page',
    description: 'Se o CTA principal cai na comparação semanal, abrir alerta de copy e CTA.',
    trigger: 'trend',
    conditionJson: {
      maxTrendPercent: -15
    },
    actionJson: {
      action: 'create_review_task',
      recommendation: 'testar_headline_cta'
    },
    requiresApproval: false,
    isActive: true
  },
  {
    id: 'overdue-commercial-queue',
    name: 'Fila comercial atrasada',
    type: 'operation',
    description: 'Se há follow-ups vencidos, priorizar recuperação da base captada.',
    trigger: 'snapshot',
    conditionJson: {
      minOverdue: 1
    },
    actionJson: {
      action: 'generate_day_checklist',
      recommendation: 'atacar_follow_ups_primeiro'
    },
    requiresApproval: false,
    isActive: true
  }
];

function buildMatch(rule, scope, extra = {}) {
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    scopeType: rule.type,
    requiresApproval: rule.requiresApproval,
    ...scope,
    ...extra
  };
}

export function evaluateBusinessRules({ productScores, pageScores, campaignScores, seoScores, executive }) {
  const matches = [];

  const spendRule = automationRuleCatalog.find((rule) => rule.id === 'campaign-high-spend-low-efficiency');
  campaignScores
    .filter((item) => Number(item.spend || 0) >= spendRule.conditionJson.minSpend && Number(item.conversions || item.leads || 0) <= spendRule.conditionJson.maxConversions)
    .slice(0, 3)
    .forEach((item) => {
      matches.push(
        buildMatch(spendRule, {
          scopeId: item.label,
          label: item.label
        }, {
          diagnosis: `${item.label} está consumindo verba sem conversão.`,
          metrics: { spend: item.spend || 0, clicks: item.clicks, leads: item.leads }
        })
      );
    });

  const pageRule = automationRuleCatalog.find((rule) => rule.id === 'page-high-traffic-low-conversion');
  pageScores
    .filter((item) => item.views >= pageRule.conditionJson.minViews && item.leadRate <= pageRule.conditionJson.maxLeadRate)
    .slice(0, 4)
    .forEach((item) => {
      const pageLabel = formatPageLabel(item.pagePath);
      matches.push(
        buildMatch(pageRule, {
          scopeId: item.pagePath,
          label: pageLabel
        }, {
          diagnosis: `${pageLabel} recebe tráfego, mas ainda converte mal.`,
          metrics: { views: item.views, leadRate: item.leadRate, primaryCtas: item.primaryCtas }
        })
      );
    });

  const seoRule = automationRuleCatalog.find((rule) => rule.id === 'seo-high-impression-low-ctr');
  seoScores
    .filter((item) => item.impressions >= seoRule.conditionJson.minImpressions && item.ctr <= seoRule.conditionJson.maxCtr)
    .slice(0, 4)
    .forEach((item) => {
      matches.push(
        buildMatch(seoRule, {
          scopeId: item.query,
          label: item.query
        }, {
          diagnosis: `A query "${item.query}" tem impressões fortes e CTR fraco.`,
          metrics: { impressions: item.impressions, ctr: item.ctr, position: item.position }
        })
      );
    });

  const productRule = automationRuleCatalog.find((rule) => rule.id === 'product-good-conversion-low-attention');
  productScores
    .filter((item) => item.leadRate >= productRule.conditionJson.minLeadRate && item.views <= productRule.conditionJson.maxViews)
    .slice(0, 3)
    .forEach((item) => {
      matches.push(
        buildMatch(productRule, {
          scopeId: item.slug,
          label: item.label
        }, {
          diagnosis: `${item.label} converte melhor do que a atenção que recebe.`,
          metrics: { views: item.views, leadRate: item.leadRate, opportunityScore: item.opportunityScore }
        })
      );
    });

  const ctaRule = automationRuleCatalog.find((rule) => rule.id === 'cta-performance-drop');
  pageScores
    .filter((item) => item.ctaTrendPercent <= ctaRule.conditionJson.maxTrendPercent)
    .slice(0, 3)
    .forEach((item) => {
      const pageLabel = formatPageLabel(item.pagePath);
      matches.push(
        buildMatch(ctaRule, {
          scopeId: item.pagePath,
          label: pageLabel
        }, {
          diagnosis: `O CTA principal caiu ${item.ctaTrendPercent}% em ${pageLabel}.`,
          metrics: { ctaTrendPercent: item.ctaTrendPercent, primaryCtas: item.primaryCtas }
        })
      );
    });

  const overdueRule = automationRuleCatalog.find((rule) => rule.id === 'overdue-commercial-queue');
  if ((executive?.centralPriorities?.actions || []).length && executive?.alerts?.some((item) => item.title?.toLowerCase().includes('follow-up'))) {
    matches.push(
      buildMatch(overdueRule, {
        scopeId: 'commercial-queue',
        label: 'Fila comercial'
      }, {
        diagnosis: 'A fila comercial tem follow-ups atrasados e precisa vir antes da escala.',
        metrics: { actions: executive.centralPriorities.actions.length }
      })
    );
  }

  return {
    rules: automationRuleCatalog,
    matches
  };
}
