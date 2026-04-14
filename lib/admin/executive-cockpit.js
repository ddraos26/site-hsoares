import 'server-only';

import { getDb } from '@/lib/db';
import { buildExecutionCenter } from '@/lib/admin/execution-center';
import { getAdminHistorySnapshot } from '@/lib/admin/history-overview';
import { getAdminIntegrationSnapshot } from '@/lib/admin/integration-status';
import { getRevenueIntelligenceSnapshot } from '@/lib/admin/revenue-intelligence';
import { getSearchConsoleOpportunitySnapshot } from '@/lib/admin/search-console-intelligence';
import { products as catalogProducts } from '@/lib/products';
import { encodePageDetailId } from '@/lib/admin/detail-route';
import { normalizePagePath } from '@/lib/admin/page-presentation';

const PRODUCT_NAME_MAP = new Map(catalogProducts.map((product) => [product.slug, product.name]));

const CORE_PRODUCTS = [
  {
    slug: 'cartao-credito-porto-bank',
    label: 'Cartão Porto',
    emphasis: 'gold',
    summary: 'Produto financeiro com alta sensibilidade a oferta, prova de valor e comparação.'
  },
  {
    slug: 'seguro-celular',
    label: 'Seguro Celular',
    emphasis: 'blue',
    summary: 'Produto de alta intenção, muito dependente de copy, urgência e contexto de risco.'
  },
  {
    slug: 'seguro-viagem',
    label: 'Seguro Viagem',
    emphasis: 'green',
    summary: 'Produto sazonal que responde bem a timing, SEO e campanhas de intenção.'
  },
  {
    slug: 'seguro-vida-on',
    label: 'Seguro de Vida',
    emphasis: 'purple',
    summary: 'Produto consultivo que exige mais clareza de valor e confiança para converter.'
  }
];

const PRODUCT_PAGE_MAP = CORE_PRODUCTS.reduce((acc, item) => {
  acc[item.slug] = `/produtos/${item.slug}`;
  return acc;
}, {});

function buildDashboardProductHref(slug) {
  return `/dashboard/products/${encodeURIComponent(slug || '')}`;
}

function buildDashboardPageHref(pagePath) {
  const value = String(pagePath || '').trim();
  if (!value) return '/dashboard/pages';
  return `/dashboard/pages/${encodePageDetailId(value)}`;
}

function resolvePrimaryProductAction(primaryProduct) {
  if (!primaryProduct?.slug) {
    return {
      href: '/dashboard/products',
      actionLabel: 'Abrir produto'
    };
  }

  const pagePath = PRODUCT_PAGE_MAP[primaryProduct.slug] || `/produtos/${primaryProduct.slug}`;

  if (primaryProduct?.narrative?.motion === 'fix' || primaryProduct?.narrative?.motion === 'build') {
    return {
      href: buildDashboardPageHref(pagePath),
      actionLabel: 'Abrir sugestao'
    };
  }

  return {
    href: buildDashboardProductHref(primaryProduct.slug),
    actionLabel: 'Abrir produto'
  };
}

function resolvePrimaryProductLanding(primaryProduct) {
  const pagePath = PRODUCT_PAGE_MAP[primaryProduct?.slug] || `/produtos/${primaryProduct?.slug || ''}`;
  return {
    pagePath,
    href: buildDashboardPageHref(pagePath)
  };
}

function resolveSeoOpportunityContext(searchConsole) {
  const topPage = searchConsole?.pageOpportunities?.[0]?.page || searchConsole?.topPages?.[0]?.page;
  const normalizedPage = topPage ? normalizePagePath(topPage) : '';

  if (normalizedPage) {
    return {
      href: buildDashboardPageHref(normalizedPage),
      actionLabel: 'Abrir pagina sugerida'
    };
  }

  return {
    href: '/admin/seo',
    actionLabel: 'Ver SEO'
  };
}

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function scoreRatio(value, target, weight) {
  if (target <= 0) return 0;
  return clamp((value / target) * weight, 0, weight);
}

function daysSince(value) {
  if (!value) return 999;
  const diff = Date.now() - new Date(value).getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function toneFromScore(score) {
  if (score >= 75) return 'success';
  if (score >= 58) return 'warning';
  return 'danger';
}

function statusLabelFromTone(tone) {
  return (
    {
      success: 'Saudável',
      warning: 'Monitorar',
      danger: 'Crítico'
    }[tone] || 'Neutro'
  );
}

function priorityLabel(score) {
  if (score >= 82) return 'Muito alta';
  if (score >= 68) return 'Alta';
  if (score >= 54) return 'Média';
  return 'Baixa';
}

function formatCampaignLabel(source, medium, campaign) {
  const parts = [source, medium, campaign]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => !item.startsWith('sem-'));

  if (!parts.length) {
    return 'Campanha sem nome';
  }

  return parts
    .map((item) =>
      item
        .replace(/[-_/]+/g, ' ')
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    )
    .join(' · ');
}

function formatProductLabel(slug) {
  return CORE_PRODUCTS.find((item) => item.slug === slug)?.label || PRODUCT_NAME_MAP.get(slug) || slug;
}

function buildHealthScore(metrics) {
  const score =
    scoreRatio(metrics.views, 120, 14) +
    scoreRatio(metrics.clicks, 24, 16) +
    scoreRatio(metrics.leads, 6, 18) +
    scoreRatio(metrics.clickRate, 9, 10) +
    scoreRatio(metrics.leadRate, 25, 18) +
    scoreRatio(metrics.ganhos, 3, 10) +
    scoreRatio(Math.max(0, 14 - metrics.daysWithoutLead), 14, 8) +
    clamp(12 - (metrics.staleOpen * 2.5) - (metrics.unassigned * 2), 0, 12);

  return Math.round(clamp(score, 0, 100));
}

function buildMotion(metrics) {
  if (metrics.views >= 25 && metrics.leads === 0) {
    return 'fix';
  }

  if (metrics.leads >= 2 && metrics.leadRate >= 18) {
    return 'scale';
  }

  if (metrics.views < 12 && metrics.clicks < 4) {
    return 'build';
  }

  return 'optimize';
}

function buildNarrative(product, metrics, seoSignal) {
  const motion = buildMotion(metrics);

  if (motion === 'fix') {
    return {
      motion,
      headline: `${product.label} recebe atenção, mas ainda não converte`,
      reason: `${metrics.views} visitas e ${metrics.clicks} cliques sem lead no período indicam gargalo de página, oferta ou CTA.`,
      recommendation: 'Revisar promessa principal, prova de valor, comparativo e CTA acima da dobra.',
      impact: 'Parar de desperdiçar tráfego já conquistado.'
    };
  }

  if (motion === 'scale') {
    return {
      motion,
      headline: `${product.label} já mostra tração para ganhar prioridade`,
      reason: `${metrics.leads} leads com ${metrics.leadRate}% de taxa de lead mostram aderência comercial acima da média.`,
      recommendation: 'Direcionar mais energia para mídia, SEO interno e testes de expansão dessa oferta.',
      impact: 'Acelerar crescimento em cima do que já provou resultado.'
    };
  }

  if (motion === 'build' && seoSignal?.bestOpportunity) {
    return {
      motion,
      headline: `${product.label} precisa de mais tração qualificada`,
      reason: `O volume ainda é baixo, mas a query "${seoSignal.bestOpportunity.query}" mostra uma brecha orgânica promissora.`,
      recommendation: 'Ganhar distribuição com SEO, reforço de interlinking e campanha segmentada de validação.',
      impact: 'Abrir nova frente de captação com menos dependência do acaso.'
    };
  }

  return {
    motion,
    headline: `${product.label} pede refinamento fino, não ruptura`,
    reason: 'O produto já tem sinais úteis, mas ainda pode melhorar clareza de oferta, segmentação e conversão.',
    recommendation: 'Otimizar copy, comparar campanhas e testar variações sem trocar toda a estratégia.',
    impact: 'Ganhar eficiência incremental com menos risco.'
  };
}

function buildDecisionCard(product, metrics, narrative) {
  const focusScore =
    metrics.healthScore +
    (narrative.motion === 'fix' ? 14 : 0) +
    (narrative.motion === 'scale' ? 12 : 0) +
    (metrics.staleOpen > 0 ? 4 : 0);

  return {
    slug: product.slug,
    label: product.label,
    emphasis: product.emphasis,
    summary: product.summary,
    views: metrics.views,
    clicks: metrics.clicks,
    leads: metrics.leads,
    ganhos: metrics.ganhos,
    perdidos: metrics.perdidos,
    clickRate: metrics.clickRate,
    leadRate: metrics.leadRate,
    staleOpen: metrics.staleOpen,
    unassigned: metrics.unassigned,
    lastLeadAt: metrics.lastLeadAt,
    daysWithoutLead: metrics.daysWithoutLead,
    healthScore: metrics.healthScore,
    healthTone: toneFromScore(metrics.healthScore),
    healthLabel: statusLabelFromTone(toneFromScore(metrics.healthScore)),
    priority: priorityLabel(focusScore),
    focusScore,
    narrative
  };
}

function buildRecommendation(primaryProduct, commercialQueue, wasteCampaign, seoOpportunities, integrationSummary) {
  if (commercialQueue.overdue > 0) {
    return {
      title: 'Hoje comece recuperando a base comercial',
      productLabel: null,
      diagnosis: `${commercialQueue.overdue} follow-ups estão vencidos e esfriando oportunidades já captadas.`,
      why: 'Esse é o dinheiro mais próximo, porque a intenção já foi paga ou conquistada.',
      recommendation: 'Distribuir a fila atrasada, responder primeiro os leads sem dono e limpar gargalos antes de comprar mais tráfego.',
      impact: 'Conversão imediata com menor custo incremental.',
      confidence: 'Alta'
    };
  }

  if (primaryProduct) {
    return {
      title: `Hoje priorize ${primaryProduct.label}`,
      productLabel: primaryProduct.label,
      diagnosis: primaryProduct.narrative.headline,
      why: primaryProduct.narrative.reason,
      recommendation: primaryProduct.narrative.recommendation,
      impact: primaryProduct.narrative.impact,
      confidence: primaryProduct.priority === 'Muito alta' ? 'Alta' : 'Boa'
    };
  }

  if (wasteCampaign) {
    return {
      title: `Hoje revise ${wasteCampaign.name}`,
      productLabel: null,
      diagnosis: 'Existe gasto de mídia sem retorno proporcional.',
      why: `${wasteCampaign.sourceTitle} mostra consumo de verba com baixa conversão efetiva.`,
      recommendation: 'Revisar segmentação, criativo, oferta e caminho da landing antes de manter orçamento.',
      impact: 'Evita continuar comprando atenção improdutiva.',
      confidence: 'Boa'
    };
  }

  if (seoOpportunities.length > 0) {
    return {
      title: `Hoje capture a query "${seoOpportunities[0].query}"`,
      productLabel: null,
      diagnosis: 'Existe uma oportunidade orgânica próxima da primeira página ou com CTR abaixo do ideal.',
      why: `A query já tem ${seoOpportunities[0].impressions} impressões e posição média ${seoOpportunities[0].position}.`,
      recommendation: 'Melhorar título, copy e cobertura do tema na landing ou em conteúdo satélite.',
      impact: 'Mais tráfego qualificado sem depender só de mídia paga.',
      confidence: 'Moderada'
    };
  }

  return {
    title: 'Hoje fortaleça a base de dados do cockpit',
    productLabel: null,
    diagnosis: 'Ainda faltam sinais suficientes para uma decisão mais agressiva e segura.',
    why: integrationSummary.stageDescription,
    recommendation: integrationSummary.nextUnlockDescription,
    impact: 'Aumenta a qualidade das próximas recomendações automáticas.',
    confidence: 'Moderada'
  };
}

function buildActionItem(payload) {
  return {
    id: payload.id,
    title: payload.title,
    diagnosis: payload.diagnosis,
    reason: payload.reason,
    recommendation: payload.recommendation,
    priority: payload.priority,
    impact: payload.impact,
    tone: payload.tone,
    href: payload.href,
    actionLabel: payload.actionLabel,
    bucket: payload.bucket
  };
}

async function getOperationalData() {
  const sql = getDb();
  const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    productViewsRows,
    productClicksRows,
    leadRows,
    pageRows,
    campaignRows,
    commercialQueueRow,
    topPagesRows
  ] = await Promise.all([
    sql`
      SELECT
        split_part(replace(page_path, '/produtos/', ''), '/', 1) AS product_slug,
        COUNT(*)::int AS views
      FROM page_views
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND now()
        AND page_path LIKE '/produtos/%'
      GROUP BY 1
    `,
    sql`
      SELECT
        product_slug,
        COUNT(*)::int AS clicks
      FROM conversion_events
      WHERE event_type = 'porto_click'
        AND created_at BETWEEN ${fromDate.toISOString()} AND now()
        AND product_slug IS NOT NULL
      GROUP BY 1
    `,
    sql`
      SELECT
        product_slug,
        COUNT(*)::int AS leads,
        COUNT(*) FILTER (WHERE lead_status = 'novo')::int AS novos,
        COUNT(*) FILTER (WHERE lead_status = 'em_contato')::int AS em_contato,
        COUNT(*) FILTER (WHERE lead_status = 'ganho')::int AS ganhos,
        COUNT(*) FILTER (WHERE lead_status = 'perdido')::int AS perdidos,
        COUNT(*) FILTER (
          WHERE lead_status IN ('novo', 'em_contato')
            AND (
              (next_contact_at IS NOT NULL AND next_contact_at <= now())
              OR (next_contact_at IS NULL AND updated_at <= now() - interval '12 hours')
            )
        )::int AS stale_open,
        COUNT(*) FILTER (WHERE COALESCE(NULLIF(TRIM(owner_name), ''), '') = '')::int AS unassigned,
        MAX(created_at) AS last_lead_at
      FROM leads
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND now()
        AND product_slug IS NOT NULL
      GROUP BY 1
    `,
    sql`
      WITH views AS (
        SELECT page_path, COUNT(*)::int AS views
        FROM page_views
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND now()
          AND page_path LIKE '/produtos/%'
        GROUP BY 1
      ),
      clicks AS (
        SELECT page_path, COUNT(*)::int AS clicks
        FROM conversion_events
        WHERE event_type = 'porto_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND now()
          AND page_path LIKE '/produtos/%'
        GROUP BY 1
      ),
      leads_by_page AS (
        SELECT page_path, COUNT(*)::int AS leads
        FROM leads
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND now()
          AND page_path LIKE '/produtos/%'
        GROUP BY 1
      )
      SELECT
        COALESCE(v.page_path, c.page_path, l.page_path) AS page_path,
        COALESCE(v.views, 0) AS views,
        COALESCE(c.clicks, 0) AS clicks,
        COALESCE(l.leads, 0) AS leads,
        ROUND(((COALESCE(c.clicks, 0)::numeric / NULLIF(COALESCE(v.views, 0), 0)) * 100), 2) AS click_rate,
        ROUND(((COALESCE(l.leads, 0)::numeric / NULLIF(COALESCE(c.clicks, 0), 0)) * 100), 2) AS lead_rate
      FROM views v
      FULL OUTER JOIN clicks c ON c.page_path = v.page_path
      FULL OUTER JOIN leads_by_page l ON l.page_path = COALESCE(v.page_path, c.page_path)
      WHERE COALESCE(v.page_path, c.page_path, l.page_path) IS NOT NULL
      ORDER BY COALESCE(v.views, 0) DESC
    `,
    sql`
      WITH clicks AS (
        SELECT
          product_slug,
          COALESCE(utm_source, '') AS utm_source,
          COALESCE(utm_medium, '') AS utm_medium,
          COALESCE(utm_campaign, '') AS utm_campaign,
          COUNT(*)::int AS clicks
        FROM conversion_events
        WHERE event_type = 'porto_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND now()
          AND product_slug IS NOT NULL
        GROUP BY 1, 2, 3, 4
      ),
      leads_by_campaign AS (
        SELECT
          product_slug,
          COALESCE(utm_source, '') AS utm_source,
          COALESCE(utm_medium, '') AS utm_medium,
          COALESCE(utm_campaign, '') AS utm_campaign,
          COUNT(*)::int AS leads,
          COUNT(*) FILTER (WHERE lead_status = 'ganho')::int AS ganhos
        FROM leads
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND now()
          AND product_slug IS NOT NULL
        GROUP BY 1, 2, 3, 4
      )
      SELECT
        COALESCE(c.product_slug, l.product_slug) AS product_slug,
        COALESCE(c.utm_source, l.utm_source) AS utm_source,
        COALESCE(c.utm_medium, l.utm_medium) AS utm_medium,
        COALESCE(c.utm_campaign, l.utm_campaign) AS utm_campaign,
        COALESCE(c.clicks, 0) AS clicks,
        COALESCE(l.leads, 0) AS leads,
        COALESCE(l.ganhos, 0) AS ganhos
      FROM clicks c
      FULL OUTER JOIN leads_by_campaign l
        ON l.product_slug = c.product_slug
        AND l.utm_source = c.utm_source
        AND l.utm_medium = c.utm_medium
        AND l.utm_campaign = c.utm_campaign
      ORDER BY COALESCE(l.leads, 0) DESC, COALESCE(c.clicks, 0) DESC
    `,
    sql`
      SELECT
        COUNT(*) FILTER (
          WHERE lead_status IN ('novo', 'em_contato')
            AND (
              (next_contact_at IS NOT NULL AND next_contact_at <= now())
              OR (next_contact_at IS NULL AND updated_at <= now() - interval '12 hours')
            )
        )::int AS overdue,
        COUNT(*) FILTER (WHERE COALESCE(NULLIF(TRIM(owner_name), ''), '') = '')::int AS unassigned,
        COUNT(*) FILTER (WHERE lead_status IN ('novo', 'em_contato'))::int AS open_pipeline
      FROM leads
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND now()
    `,
    sql`
      SELECT page_path, COUNT(*)::int AS views
      FROM page_views
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND now()
      GROUP BY 1
      ORDER BY views DESC
      LIMIT 10
    `
  ]);

  return {
    productViewsRows,
    productClicksRows,
    leadRows,
    pageRows,
    campaignRows,
    commercialQueueRow: commercialQueueRow[0] || { overdue: 0, unassigned: 0, open_pipeline: 0 },
    topPagesRows
  };
}

function buildAutomationLane({ coreProducts, revenueSummary, integrationSummary, searchConsole }) {
  return [
    {
      key: 'tracking',
      title: 'Rastreamento de visitas e cliques',
      status: coreProducts.some((item) => item.views > 0 || item.clicks > 0) ? 'active' : 'blocked',
      statusLabel: coreProducts.some((item) => item.views > 0 || item.clicks > 0) ? 'Ativo' : 'Sem dados',
      description: 'O sistema já lê tráfego, cliques e conversão por produto para alimentar o cockpit.',
      effect: 'Mantém o radar do funil sempre atualizado.'
    },
    {
      key: 'lead-triage',
      title: 'Priorização automática da fila comercial',
      status: 'active',
      statusLabel: 'Ativo',
      description: 'Leads vencidos, sem dono ou com mais risco de esfriar entram automaticamente no topo da agenda do dia.',
      effect: 'Reduz desperdício de intenção já captada.'
    },
    {
      key: 'seo-watch',
      title: 'Radar orgânico e de queries',
      status: searchConsole.status === 'connected' ? 'active' : searchConsole.status === 'partial' ? 'ready' : 'blocked',
      statusLabel: searchConsole.status === 'connected' ? 'Ativo' : searchConsole.status === 'partial' ? 'Quase pronto' : 'Bloqueado',
      description: searchConsole.reason,
      effect: 'Mostra temas e páginas com oportunidade de ganhar tráfego sem aumentar custo.'
    },
    {
      key: 'media-watch',
      title: 'Leitura automática de custo de mídia',
      status: revenueSummary.connectedMediaSources > 0 ? 'active' : integrationSummary.connected > 2 ? 'ready' : 'blocked',
      statusLabel: revenueSummary.connectedMediaSources > 0 ? 'Ativo' : integrationSummary.connected > 2 ? 'Pronto para ativar' : 'Bloqueado',
      description:
        revenueSummary.connectedMediaSources > 0
          ? 'Meta Ads ou Google Ads já estão ligados ao cockpit com leitura de gasto.'
          : integrationSummary.nextUnlockDescription,
      effect: 'Aproxima o sistema de decisões de verba em reais.'
    }
  ];
}

function buildApprovalQueue({ primaryProduct, bestCampaign, worstCampaign, integrationSummary, searchConsole, products }) {
  const approvals = [];
  const primaryLanding = resolvePrimaryProductLanding(primaryProduct);

  if (primaryProduct?.narrative.motion === 'scale') {
    approvals.push({
      id: `scale-${primaryProduct.slug}`,
      title: `Aprovar escala de ${primaryProduct.label}`,
      reason: primaryProduct.narrative.reason,
      recommendation: 'Aumentar distribuição da página e reforçar tráfego qualificado nesse produto.',
      impact: 'Ganho potencial de leads com risco controlado.',
      risk: 'Baixo',
      href: buildDashboardProductHref(primaryProduct.slug),
      actionLabel: 'Abrir produto',
      sourceType: 'product',
      execution: {
        sourceType: 'product',
        sourceId: primaryProduct.slug,
        category: 'distribution-scale',
        executionMode: 'operator_handoff',
        operationStatus: 'ready',
        taskKey: `product-scale:${primaryProduct.slug}`,
        reviewTaskKey: `review:scale-product:${primaryProduct.slug}`,
        contextHref: buildDashboardProductHref(primaryProduct.slug),
        queueHref: `/admin/leads?product=${encodeURIComponent(primaryProduct.slug)}`,
        operationHref: buildDashboardProductHref(primaryProduct.slug),
        siteHref: `/produtos/${primaryProduct.slug}`,
        summary: `Ao aprovar, o sistema abre a frente de escala desse produto, registra o plano e deixa a operação pronta para distribuir tráfego e acompanhamento.`,
        steps: [
          `Registrar ${primaryProduct.label} como frente aprovada para ganhar distribuição.`,
          'Abrir fila operacional com contexto comercial, leads e destino do produto.',
          'Criar revisão curta para medir se a escala realmente devolveu mais resposta.'
        ]
      }
    });
  }

  if (primaryProduct?.narrative.motion === 'fix') {
    approvals.push({
      id: `fix-${primaryProduct.slug}`,
      title: `Aprovar revisão da landing de ${primaryProduct.label}`,
      reason: primaryProduct.narrative.reason,
      recommendation: 'Refazer hero, prova de valor, comparativo e CTA antes de ampliar tráfego.',
      impact: 'Recupera parte do tráfego já conquistado.',
      risk: 'Baixo',
      href: primaryLanding.href,
      actionLabel: 'Abrir pagina',
      sourceType: 'page',
      execution: {
        sourceType: 'page',
        sourceId: primaryLanding.pagePath,
        category: 'landing-fix',
        executionMode: 'operator_handoff',
        operationStatus: 'ready',
        taskKey: `page-fix:${primaryLanding.pagePath}`,
        reviewTaskKey: `review:fix-page:${primaryProduct.slug}`,
        contextHref: primaryLanding.href,
        queueHref: `/admin/leads?product=${encodeURIComponent(primaryProduct.slug)}`,
        operationHref: primaryLanding.href,
        siteHref: primaryLanding.pagePath,
        summary: `Ao aprovar, a IA transforma essa revisão em uma operação de melhoria da landing, com contexto, destino e acompanhamento pós-ajuste.`,
        steps: [
          `Abrir a landing de ${primaryProduct.label} como prioridade de revisão.`,
          'Levar o contexto da perda de conversão para a operação, sem depender de interpretação manual.',
          'Medir depois se CTA, copy e prova de valor responderam melhor.'
        ]
      }
    });
  }

  if (worstCampaign) {
    approvals.push({
      id: 'review-paid-campaign',
      title: `Aprovar revisão ou pausa de ${worstCampaign.name}`,
      reason: `${worstCampaign.sourceTitle} apresenta gasto sem retorno compatível.`,
      recommendation: 'Rever público, criativo, promessa e destino da campanha antes de manter orçamento.',
      impact: 'Evita continuar queimando verba.',
      risk: 'Médio',
      href: `/admin/campanhas?q=${encodeURIComponent(worstCampaign.name)}`,
      actionLabel: 'Ver campanhas',
      sourceType: 'campaign',
      execution: {
        sourceType: 'campaign',
        sourceId: worstCampaign.name,
        category: 'campaign-review',
        executionMode: 'operator_handoff',
        operationStatus: 'ready',
        taskKey: `campaign-review:${worstCampaign.name}`,
        reviewTaskKey: `review:campaign:${worstCampaign.name}`,
        contextHref: `/admin/campanhas?q=${encodeURIComponent(worstCampaign.name)}`,
        operationHref: `/admin/campanhas?q=${encodeURIComponent(worstCampaign.name)}`,
        summary: `Ao aprovar, a campanha entra numa fila real de revisão de mídia com plano, contexto e retorno esperado.`,
        steps: [
          `Registrar ${worstCampaign.name} como campanha com risco de desperdício.`,
          'Preparar a frente de revisão com criativo, segmentação e landing no mesmo contexto.',
          'Abrir acompanhamento para validar se a correção reduziu gasto improdutivo.'
        ]
      }
    });
  }

  if (bestCampaign) {
    approvals.push({
      id: 'scale-paid-campaign',
      title: `Aprovar reforço de ${bestCampaign.name}`,
      reason: `${bestCampaign.sourceTitle} já mostra sinal melhor que a média em custo e conversão.`,
      recommendation: 'Subir verba com acompanhamento diário e sem perder controle de CPL.',
      impact: 'Expande aquisição em cima de um canal já validado.',
      risk: 'Médio',
      href: `/admin/campanhas?q=${encodeURIComponent(bestCampaign.name)}`,
      actionLabel: 'Abrir mídia',
      sourceType: 'campaign',
      execution: {
        sourceType: 'campaign',
        sourceId: bestCampaign.name,
        category: 'campaign-scale',
        executionMode: 'operator_handoff',
        operationStatus: 'ready',
        taskKey: `campaign-scale:${bestCampaign.name}`,
        reviewTaskKey: `review:campaign:${bestCampaign.name}`,
        contextHref: `/admin/campanhas?q=${encodeURIComponent(bestCampaign.name)}`,
        operationHref: `/admin/campanhas?q=${encodeURIComponent(bestCampaign.name)}`,
        summary: `Ao aprovar, a frente de escala de mídia fica pronta com trilha operacional e revisão curta de impacto.`,
        steps: [
          `Registrar ${bestCampaign.name} como campanha aprovada para ganhar reforço.`,
          'Organizar o contexto de escala sem perder rastreio de CPL e resposta comercial.',
          'Abrir revisão rápida para medir se o reforço segurou eficiência.'
        ]
      }
    });
  }

  if (searchConsole.status === 'connected' && searchConsole.opportunities[0]) {
    const seoContext = resolveSeoOpportunityContext(searchConsole);
    approvals.push({
      id: 'seo-opportunity',
      title: `Aprovar captura da query "${searchConsole.opportunities[0].query}"`,
      reason: `A consulta já tem ${searchConsole.opportunities[0].impressions} impressões e posição ${searchConsole.opportunities[0].position}.`,
      recommendation: 'Ajustar landing ou conteúdo satélite para aumentar CTR e relevância nesse tema.',
      impact: 'Mais demanda orgânica para um interesse já comprovado.',
      risk: 'Baixo',
      href: seoContext.href,
      actionLabel: seoContext.actionLabel,
      sourceType: 'seo',
      execution: {
        sourceType: 'seo',
        sourceId: searchConsole.opportunities[0].query,
        category: 'seo-opportunity',
        executionMode: 'operator_handoff',
        operationStatus: 'ready',
        taskKey: `seo-opportunity:${searchConsole.opportunities[0].query}`,
        reviewTaskKey: `review:seo:${searchConsole.opportunities[0].query}`,
        contextHref: seoContext.href,
        operationHref: seoContext.href,
        summary: `Ao aprovar, a oportunidade orgânica vira uma ação operacional de atualização de página ou conteúdo satélite.`,
        steps: [
          `Registrar a query "${searchConsole.opportunities[0].query}" como frente priorizada.`,
          'Levar a oportunidade para a fila de SEO com justificativa, impacto e contexto da SERP.',
          'Abrir revisão para acompanhar CTR, posição e resposta da página.'
        ]
      }
    });
  }

  if (integrationSummary.connected < 4) {
    approvals.push({
      id: 'unlock-next-integration',
      title: `Aprovar próximo desbloqueio do cockpit`,
      reason: integrationSummary.nextUnlockTitle,
      recommendation: integrationSummary.nextUnlockDescription,
      impact: 'Aumenta a precisão das recomendações automáticas.',
      risk: 'Baixo',
      href: '/admin/configuracoes',
      actionLabel: 'Ver integrações',
      sourceType: 'integration',
      execution: {
        sourceType: 'integration',
        sourceId: integrationSummary.nextUnlockKey || integrationSummary.nextUnlockTitle,
        category: 'integration-unlock',
        executionMode: 'operator_handoff',
        operationStatus: 'ready',
        taskKey: `integration-unlock:${integrationSummary.nextUnlockTitle}`,
        reviewTaskKey: `review:integration:${integrationSummary.nextUnlockTitle}`,
        contextHref: '/admin/configuracoes',
        operationHref: '/admin/configuracoes',
        summary: `Ao aprovar, o sistema abre o proximo desbloqueio estrutural do cockpit com status, contexto e memoria operacional.`,
        steps: [
          `Registrar ${integrationSummary.nextUnlockTitle} como frente estrutural aprovada.`,
          'Levar o desbloqueio para a fila operacional de integrações.',
          'Abrir revisão para confirmar se o cockpit ganhou nova camada de leitura.'
        ]
      }
    });
  }

  return approvals.slice(0, 5);
}

function buildMoneyLeaks({ commercialQueue, products, worstCampaign }) {
  const items = [];

  if (commercialQueue.overdue > 0) {
    items.push({
      title: 'Follow-ups atrasados estão esfriando o caixa',
      description: `${commercialQueue.overdue} oportunidades já captadas estão sem avanço no tempo ideal.`,
      impact: 'Perda direta de conversão',
      href: '/admin/leads',
      actionLabel: 'Abrir leads'
    });
  }

  const fixProduct = products
    .filter((item) => item.narrative.motion === 'fix')
    .sort((a, b) => b.views - a.views)[0];

  if (fixProduct) {
    const landing = resolvePrimaryProductLanding(fixProduct);

    items.push({
      title: `${fixProduct.label} desperdiça tráfego`,
      description: `${fixProduct.views} visitas e ${fixProduct.clicks} cliques sem lead no período observável.`,
      impact: 'Custo invisível de aquisição e SEO',
      href: landing.href,
      actionLabel: 'Abrir pagina'
    });
  }

  if (commercialQueue.unassigned > 0) {
    items.push({
      title: 'Leads sem responsável',
      description: `${commercialQueue.unassigned} leads continuam sem dono definido.`,
      impact: 'Tempo de resposta pior e mais abandono',
      href: '/admin/leads',
      actionLabel: 'Abrir leads'
    });
  }

  if (worstCampaign) {
    items.push({
      title: `${worstCampaign.name} consome orçamento`,
      description: `${worstCampaign.sourceTitle} gastou sem mostrar conversão compatível.`,
      impact: 'Queima de verba em mídia',
      href: `/admin/campanhas?q=${encodeURIComponent(worstCampaign.name)}`,
      actionLabel: 'Abrir campanha'
    });
  }

  return items.slice(0, 4);
}

function buildOpportunityCards({ primaryProduct, products, bestCampaign, searchConsole }) {
  const items = [];

  if (primaryProduct?.narrative.motion === 'scale') {
    items.push({
      title: `${primaryProduct.label} merece mais energia`,
      description: primaryProduct.narrative.reason,
      value: `${primaryProduct.leadRate}% de taxa de lead`,
      href: buildDashboardProductHref(primaryProduct.slug),
      actionLabel: 'Abrir produto'
    });
  }

  if (bestCampaign) {
    items.push({
      title: `Campanha com chance de escala`,
      description: `${bestCampaign.name} é a frente paga mais promissora neste momento.`,
      value: `${bestCampaign.sourceTitle}`,
      href: `/admin/campanhas?q=${encodeURIComponent(bestCampaign.name)}`,
      actionLabel: 'Abrir campanha'
    });
  }

  const healthiestProduct = [...products].sort((a, b) => b.healthScore - a.healthScore)[0];
  if (healthiestProduct && healthiestProduct !== primaryProduct) {
    items.push({
      title: `${healthiestProduct.label} pode virar alavanca`,
      description: healthiestProduct.narrative.reason,
      value: `Score ${healthiestProduct.healthScore}`,
      href: buildDashboardProductHref(healthiestProduct.slug),
      actionLabel: 'Abrir produto'
    });
  }

  if (searchConsole.opportunities[0]) {
    const seoContext = resolveSeoOpportunityContext(searchConsole);

    items.push({
      title: `Existe brecha orgânica em "${searchConsole.opportunities[0].query}"`,
      description: `Posição ${searchConsole.opportunities[0].position} com ${searchConsole.opportunities[0].impressions} impressões no período.`,
      value: 'SEO com intenção comprovada',
      href: seoContext.href,
      actionLabel: seoContext.actionLabel
    });
  }

  return items.slice(0, 4);
}

export async function getExecutiveCockpitSnapshot() {
  const [operationalData, integrationSnapshot, revenueSnapshot, searchConsoleSnapshot, historySnapshot] = await Promise.all([
    getOperationalData(),
    getAdminIntegrationSnapshot(),
    getRevenueIntelligenceSnapshot(),
    getSearchConsoleOpportunitySnapshot(CORE_PRODUCTS),
    getAdminHistorySnapshot()
  ]);

  const viewsMap = new Map(operationalData.productViewsRows.map((row) => [row.product_slug, toNumber(row.views)]));
  const clicksMap = new Map(operationalData.productClicksRows.map((row) => [row.product_slug, toNumber(row.clicks)]));
  const leadsMap = new Map(
    operationalData.leadRows.map((row) => [
      row.product_slug,
      {
        leads: toNumber(row.leads),
        novos: toNumber(row.novos),
        emContato: toNumber(row.em_contato),
        ganhos: toNumber(row.ganhos),
        perdidos: toNumber(row.perdidos),
        staleOpen: toNumber(row.stale_open),
        unassigned: toNumber(row.unassigned),
        lastLeadAt: row.last_lead_at || null
      }
    ])
  );
  const pageMap = new Map(operationalData.pageRows.map((row) => [row.page_path, row]));
  const seoMap = new Map(searchConsoleSnapshot.productOpportunities.map((row) => [row.slug, row]));

  const products = CORE_PRODUCTS.map((product) => {
    const views = viewsMap.get(product.slug) || 0;
    const clicks = clicksMap.get(product.slug) || 0;
    const leadMetrics =
      leadsMap.get(product.slug) || {
        leads: 0,
        novos: 0,
        emContato: 0,
        ganhos: 0,
        perdidos: 0,
        staleOpen: 0,
        unassigned: 0,
        lastLeadAt: null
      };
    const pageMetrics = pageMap.get(PRODUCT_PAGE_MAP[product.slug]) || {};

    const metrics = {
      views,
      clicks,
      leads: leadMetrics.leads,
      ganhos: leadMetrics.ganhos,
      perdidos: leadMetrics.perdidos,
      staleOpen: leadMetrics.staleOpen,
      unassigned: leadMetrics.unassigned,
      lastLeadAt: leadMetrics.lastLeadAt,
      clickRate: toNumber(pageMetrics.click_rate ?? pageMetrics.clickRate ?? (views ? (clicks / views) * 100 : 0)),
      leadRate: toNumber(pageMetrics.lead_rate ?? pageMetrics.leadRate ?? (clicks ? (leadMetrics.leads / clicks) * 100 : 0)),
      daysWithoutLead: daysSince(leadMetrics.lastLeadAt)
    };

    metrics.healthScore = buildHealthScore(metrics);

    const narrative = buildNarrative(product, metrics, seoMap.get(product.slug));
    return buildDecisionCard(product, metrics, narrative);
  }).sort((a, b) => b.focusScore - a.focusScore || b.healthScore - a.healthScore || b.views - a.views);

  const campaignRows = operationalData.campaignRows
    .filter((row) => CORE_PRODUCTS.some((product) => product.slug === row.product_slug))
    .map((row) => ({
      productSlug: row.product_slug,
      label: formatCampaignLabel(row.utm_source, row.utm_medium, row.utm_campaign),
      source: row.utm_source || '',
      medium: row.utm_medium || '',
      campaign: row.utm_campaign || '',
      clicks: toNumber(row.clicks),
      leads: toNumber(row.leads),
      ganhos: toNumber(row.ganhos)
    }));

  const bestCampaignToScale =
    [...campaignRows]
      .filter((row) => row.clicks >= 6 && row.leads >= 1)
      .sort((a, b) => (b.leads / Math.max(b.clicks, 1)) - (a.leads / Math.max(a.clicks, 1)) || b.leads - a.leads || b.clicks - a.clicks)[0] || null;

  const campaignToReview =
    [...campaignRows]
      .filter((row) => row.clicks >= 10 && row.leads === 0)
      .sort((a, b) => b.clicks - a.clicks)[0] || null;

  const primaryProduct = products[0] || null;
  const commercialQueue = {
    overdue: toNumber(operationalData.commercialQueueRow.overdue),
    unassigned: toNumber(operationalData.commercialQueueRow.unassigned),
    openPipeline: toNumber(operationalData.commercialQueueRow.open_pipeline)
  };

  const dailyRecommendation = buildRecommendation(
    primaryProduct,
    commercialQueue,
    revenueSnapshot.biggestWasteCampaign,
    searchConsoleSnapshot.opportunities,
    integrationSnapshot.summary
  );
  const primaryProductAction = resolvePrimaryProductAction(primaryProduct);
  const seoOpportunityContext = resolveSeoOpportunityContext(searchConsoleSnapshot);

  const actionQueue = [
    commercialQueue.overdue > 0
      ? buildActionItem({
          id: 'recover-leads',
          title: 'Recuperar base comercial primeiro',
          diagnosis: `${commercialQueue.overdue} follow-ups estão vencidos.`,
          reason: 'Há intenção já conquistada esfriando dentro da operação.',
          recommendation: 'Responder primeiro leads vencidos e redistribuir os sem dono.',
          priority: 'Urgente',
          impact: 'Maior chance de receita no curto prazo.',
          tone: 'danger',
          href: '/admin/leads',
          actionLabel: 'Abrir leads',
          bucket: 'Hoje'
        })
      : null,
    primaryProduct
      ? buildActionItem({
          id: `focus-${primaryProduct.slug}`,
          title: dailyRecommendation.title,
          diagnosis: dailyRecommendation.diagnosis,
          reason: dailyRecommendation.why,
          recommendation: dailyRecommendation.recommendation,
          priority: primaryProduct.priority,
          impact: dailyRecommendation.impact,
          tone: primaryProduct.healthTone === 'danger' ? 'warning' : 'success',
          href: primaryProductAction.href,
          actionLabel: primaryProductAction.actionLabel,
          bucket: 'Produto'
        })
      : null,
    campaignToReview
      ? buildActionItem({
          id: 'review-campaign',
          title: `Revisar ${campaignToReview.label}`,
          diagnosis: `${campaignToReview.clicks} cliques sem lead relevante.`,
          reason: 'A campanha está puxando atenção, mas ainda não virou oportunidade comercial.',
          recommendation: 'Revisar segmentação, criativo e destino antes de escalar.',
          priority: 'Alta',
          impact: 'Reduz desperdício de tráfego.',
          tone: 'danger',
          href: `/admin/campanhas?q=${encodeURIComponent(campaignToReview.label)}`,
          actionLabel: 'Abrir campanha',
          bucket: 'Campanha'
        })
      : null,
    bestCampaignToScale
      ? buildActionItem({
          id: 'scale-campaign',
          title: `Avaliar escala de ${bestCampaignToScale.label}`,
          diagnosis: `${bestCampaignToScale.leads} leads a partir de ${bestCampaignToScale.clicks} cliques.`,
          reason: 'Há sinal de aderência maior do que a média observável.',
          recommendation: 'Reforçar a campanha com acompanhamento curto de custo por lead.',
          priority: 'Alta',
          impact: 'Acelera crescimento com base em dado, não em feeling.',
          tone: 'success',
          href: `/admin/campanhas?q=${encodeURIComponent(bestCampaignToScale.label)}`,
          actionLabel: 'Abrir campanha',
          bucket: 'Campanha'
        })
      : null,
    searchConsoleSnapshot.opportunities[0]
      ? buildActionItem({
          id: 'organic-opportunity',
          title: `Explorar "${searchConsoleSnapshot.opportunities[0].query}"`,
          diagnosis: `A query já aparece com posição ${searchConsoleSnapshot.opportunities[0].position}.`,
          reason: 'Existe oportunidade orgânica próxima de capturar mais clique qualificado.',
          recommendation: 'Reforçar a landing e criar conteúdo satélite com esse tema.',
          priority: 'Média',
          impact: 'Mais tráfego orgânico com intenção comprovada.',
          tone: 'premium',
          href: seoOpportunityContext.href,
          actionLabel: seoOpportunityContext.actionLabel,
          bucket: 'SEO'
        })
      : null
  ]
    .filter(Boolean)
    .slice(0, 6);

  const approvals = buildApprovalQueue({
    primaryProduct,
    bestCampaign: revenueSnapshot.bestInvestmentCampaign,
    worstCampaign: revenueSnapshot.biggestWasteCampaign,
    integrationSummary: integrationSnapshot.summary,
    searchConsole: searchConsoleSnapshot,
    products
  });

  const automations = buildAutomationLane({
    coreProducts: products,
    revenueSummary: revenueSnapshot.summary,
    integrationSummary: integrationSnapshot.summary,
    searchConsole: searchConsoleSnapshot
  });

  const organicOpportunities = searchConsoleSnapshot.opportunities.slice(0, 4).map((item) => ({
    query: item.query,
    clicks: item.clicks,
    impressions: item.impressions,
    position: item.position,
    ctr: item.ctr,
    productLabel:
      seoMap.get(primaryProduct?.slug || '')?.bestOpportunity?.query === item.query && primaryProduct
        ? primaryProduct.label
        : null
  }));

  const summary = {
    totalCoreViews: products.reduce((sum, item) => sum + item.views, 0),
    totalCoreClicks: products.reduce((sum, item) => sum + item.clicks, 0),
    totalCoreLeads: products.reduce((sum, item) => sum + item.leads, 0),
    averageHealthScore: Math.round(
      products.reduce((sum, item) => sum + item.healthScore, 0) / Math.max(products.length, 1)
    ),
    approvalsWaiting: approvals.length,
    automationCoverage: automations.filter((item) => item.status === 'active').length,
    organicOpportunities: organicOpportunities.length,
    readyOperations: historySnapshot.operations?.summary?.ready || 0
  };

  const executionCenter = buildExecutionCenter(historySnapshot, approvals.length);

  const commandCenter = {
    title: dailyRecommendation.title,
    diagnosis: dailyRecommendation.diagnosis,
    why: dailyRecommendation.why,
    recommendation: dailyRecommendation.recommendation,
    impact: dailyRecommendation.impact,
    confidence: dailyRecommendation.confidence
  };

  return {
    checkedAt: new Date().toISOString(),
    summary,
    commandCenter,
    executionCenter,
    operations: historySnapshot.operations,
    products,
    actionQueue,
    approvals,
    automations,
    moneyLeaks: buildMoneyLeaks({
      commercialQueue,
      products,
      worstCampaign: revenueSnapshot.biggestWasteCampaign
    }),
    growthMoves: buildOpportunityCards({
      primaryProduct,
      products,
      bestCampaign: bestCampaignToScale,
      searchConsole: searchConsoleSnapshot
    }),
    seo: {
      status: searchConsoleSnapshot.status,
      statusLabel: searchConsoleSnapshot.statusLabel,
      reason: searchConsoleSnapshot.reason,
      opportunities: organicOpportunities,
      topQueries: searchConsoleSnapshot.topQueries.slice(0, 6)
    },
    media: {
      summary: revenueSnapshot.summary,
      bestCampaign: revenueSnapshot.bestInvestmentCampaign,
      worstCampaign: revenueSnapshot.biggestWasteCampaign
    },
    integrations: {
      summary: integrationSnapshot.summary,
      items: integrationSnapshot.items
    },
    topPages: operationalData.topPagesRows.map((row) => ({
      pagePath: row.page_path,
      views: toNumber(row.views)
    }))
  };
}
