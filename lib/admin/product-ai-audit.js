import 'server-only';

import crypto from 'node:crypto';
import { applyConversionGoalToAudit, resolveEntityConversionGoal } from '@/lib/admin/entity-conversion-goals';
import { resolveDetailLiveTtlMs, shouldReuseDetailAiCache } from '@/lib/admin/ai-usage-policy';
import { getCachedSearchConsoleOpportunitySnapshot } from '@/lib/admin/server-snapshot-cache';
import { readAdminRuntimeSetting, upsertAdminRuntimeSetting } from '@/lib/admin/runtime-settings-store';
import {
  buildFallbackSource,
  buildObservedSignals,
  callOpenAiStructuredAudit,
  fetchPublicPageSnapshot,
  findSearchConsoleSignals,
  hasOpenAiAuditProvider
} from '@/lib/admin/entity-ai-audit-shared';

const PRODUCT_AUDIT_SYSTEM_PROMPT =
  'Voce e um analista de crescimento, front-end comercial, SEO e conversao para corretora de seguros. Responda em portugues do Brasil, de forma objetiva e acionavel. Nesta auditoria de produto, "fora da pagina" significa a camada visivel do front-end que o visitante enxerga nas paginas do produto: hero, promessa, prova, comparativo, CTA, contato, hierarquia e clareza visual. "Dentro da pagina" significa a base interna que sustenta o produto: SEO, title, meta description, H1, indexacao, tracking, captura de lead, roteamento tecnico e confiabilidade da estrutura. Seu foco e dizer o que falta para gerar mais acessos, mais cliques, mais leads e mais vendas para este produto. Se o payload indicar businessGoal.primaryConversion = "porto_direct_click", trate o clique no link oficial da Porto como meta principal das paginas desse produto. Nesse caso, WhatsApp e formulario entram apenas como apoio secundario para duvidas e nao devem ser tratados como conversao principal.';

function buildProductAuditCacheKey(productSlug) {
  return `product-ai-audit:${productSlug || 'unknown'}`;
}

function extractCachedAudit(entry) {
  const cachedAudit = entry?.value?.audit;
  return cachedAudit && typeof cachedAudit === 'object' ? cachedAudit : null;
}

function buildProductAuditSignature({ product, relatedPages, relatedCampaigns, recentLeads, publicSnapshot, searchSignal, objective }) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        slug: product?.slug || '',
        views: Number(product?.views || 0),
        clicks: Number(product?.clicks || 0),
        leads: Number(product?.leads || 0),
        clickRate: Number(product?.clickRate || 0),
        leadRate: Number(product?.leadRate || 0),
        relatedPages: (relatedPages || []).slice(0, 5),
        relatedCampaigns: (relatedCampaigns || []).slice(0, 5),
        recentLeads: (recentLeads || []).slice(0, 5).map((item) => ({
          status: item.status,
          pagePath: item.pagePath,
          createdAt: item.createdAt
        })),
        publicSnapshot: {
          title: publicSnapshot?.title || '',
          h1: publicSnapshot?.h1 || '',
          metaDescription: publicSnapshot?.metaDescription || '',
          hasForm: Boolean(publicSnapshot?.hasForm),
          hasWhatsapp: Boolean(publicSnapshot?.hasWhatsapp),
          hasDirectPortoLink: Boolean(publicSnapshot?.hasDirectPortoLink),
          ctaSignalSummary: publicSnapshot?.ctaSignalSummary || '',
          wordCount: Number(publicSnapshot?.wordCount || 0)
        },
        objective: {
          key: objective?.key || '',
          productSlug: objective?.productSlug || '',
          portoUrl: objective?.portoUrl || ''
        },
        searchSignal
      })
    )
    .digest('hex');
}

function buildInsideProductFallback(context) {
  const { product, publicSnapshot, searchSignal, recentLeads, objective } = context;
  const missingPieces = [];

  if (!publicSnapshot?.title) missingPieces.push('title SEO mais forte para o produto');
  if (!publicSnapshot?.metaDescription) missingPieces.push('meta description com proposta comercial');
  if (!publicSnapshot?.h1) missingPieces.push('heading principal coerente');
  if (objective?.key === 'porto_direct_click') {
    if (!publicSnapshot?.hasDirectPortoLink) missingPieces.push('botao oficial da Porto bem visivel e rastreado');
  } else if (!publicSnapshot?.hasForm && !publicSnapshot?.hasWhatsapp) {
    missingPieces.push('captura tecnica de lead');
  }
  if (!searchSignal) missingPieces.push('sinal organico consistente para a rota principal');
  if (!recentLeads?.length && Number(product?.views || 0) >= 20) missingPieces.push('tracking e roteamento de conversao mais confiaveis');

  return {
    diagnosis:
      searchSignal?.impressions >= 20
        ? 'Por dentro, o produto ja tem base para captar mais demanda, mas a estrutura de SEO e captura ainda pode ser mais forte.'
        : 'Por dentro, o produto ainda nao mostra uma base interna forte de SEO, tracking e captura para crescer com previsibilidade.',
    missing: missingPieces.length
      ? `Hoje parecem faltar principalmente: ${missingPieces.slice(0, 3).join(', ')}.`
      : 'Hoje falta deixar SEO, captura e estrutura tecnica do produto mais confiaveis.',
    action:
      objective?.key === 'porto_direct_click'
        ? 'Revisar SEO, tracking do clique oficial da Porto e leitura confiavel da rota principal do produto.'
        : 'Revisar title, meta description, heading principal, indexacao, tracking e fluxo tecnico de captura do produto.'
  };
}

function buildOutsideProductFallback(context) {
  const { product, publicSnapshot, relatedPages, objective } = context;
  const views = Number(product?.views || 0);
  const clicks = Number(product?.clicks || 0);
  const lowLeadPages = (relatedPages || []).filter((item) => Number(item.views || 0) >= 20 && Number(item.leads || 0) === 0).length;
  const missingPieces = [];

  if (!publicSnapshot?.h1) missingPieces.push('promessa principal mais clara');
  if (objective?.key === 'porto_direct_click') {
    if (!publicSnapshot?.hasDirectPortoLink) missingPieces.push('link oficial da Porto com mais destaque');
  } else if (!publicSnapshot?.hasForm && !publicSnapshot?.hasWhatsapp) {
    missingPieces.push('contato visivel no front-end');
  }
  if (clicks === 0 && views >= 20) missingPieces.push('CTA principal mais forte');
  if (lowLeadPages > 0) missingPieces.push('padrao visual mais convincente nas paginas que falam desse produto');
  if (!/varios verbos de CTA/i.test(publicSnapshot?.ctaSignalSummary || '')) missingPieces.push('mais convites visiveis para agir');

  return {
    diagnosis:
      objective?.key === 'porto_direct_click'
        ? 'Na camada visivel, as paginas do produto ainda precisam deixar mais obvio que o passo principal e clicar no link oficial da Porto.'
        : product?.decision?.diagnosis?.summary ||
          'Na camada visivel, o produto ainda nao deixa tao claro por que clicar, confiar e pedir contato agora.',
    missing: missingPieces.length
      ? `Hoje parecem faltar principalmente: ${missingPieces.slice(0, 3).join(', ')}.`
      : 'Hoje falta deixar a proposta, a prova e o CTA do produto mais evidentes no front-end.',
    action:
      objective?.key === 'porto_direct_click'
        ? 'Reorganizar hero, prova, comparativo e CTA para empurrar o clique no link oficial da Porto como acao principal do produto.'
        : 'Reorganizar hero, prova de valor, comparativo, CTA acima da dobra e contato visivel nas paginas do produto.'
  };
}

function buildLocalProductAiAudit(context) {
  const insidePage = buildInsideProductFallback(context);
  const outsidePage = buildOutsideProductFallback(context);
  const { product, searchSignal, relatedCampaigns, objective } = context;
  const views = Number(product?.views || 0);
  const clicks = Number(product?.clicks || 0);
  const leads = Number(product?.leads || 0);
  const leadRate = Number(product?.leadRate || 0);
  const hasWinningCampaign = (relatedCampaigns || []).some((item) => Number(item.wins || 0) > 0);

  let salesGoal = 'Ganhar mais acesso qualificado e transformar melhor o interesse em lead para este produto.';
  if (objective?.key === 'porto_direct_click') {
    salesGoal = objective.primaryGoal;
  } else if (leadRate >= 10 && views < 120) {
    salesGoal = 'Levar mais gente certa para um produto que ja mostra potencial de conversao.';
  } else if (views >= 50 && leads === 0) {
    salesGoal = 'Transformar a procura atual deste produto em clique, lead e venda.';
  }

  const acquisition = searchSignal?.impressions >= 20 || hasWinningCampaign
    ? {
        diagnosis: 'Ja existe sinal de procura ou de tracao comercial, mas o produto ainda pode captar mais demanda qualificada.',
        action:
          objective?.key === 'porto_direct_click'
            ? 'Melhorar SEO da rota principal e reforcar distribuicao das paginas que levam ao link oficial da Porto.'
            : 'Melhorar SEO da rota principal e reforcar distribuicao das paginas que melhor representam o produto.'
      }
    : {
        diagnosis: 'O produto ainda nao tem uma maquina forte de descoberta sustentando o volume de acesso.',
        action:
          objective?.key === 'porto_direct_click'
            ? 'Arrumar SEO e tracking antes de escalar as paginas que levam ao link oficial da Porto.'
            : 'Arrumar a base de SEO e abrir mais portas de entrada antes de escalar investimento.'
      };

  const conversion = objective?.key === 'porto_direct_click'
    ? {
        diagnosis: 'A conversao principal deste produto e o clique no link oficial da Porto, e as paginas ainda podem conduzir melhor para esse passo.',
        action: 'Fortalecer o botao oficial da Porto, reduzir distracoes e deixar WhatsApp ou formulario apenas como apoio.'
      }
    : clicks > 0 || leads > 0
      ? {
          diagnosis: 'A camada visivel do produto ja recebe alguma resposta, mas ainda pode converter melhor.',
          action: 'Refinar hero, prova, CTA e organizacao visual nas paginas mais importantes do produto.'
        }
      : {
          diagnosis: 'A apresentacao visivel do produto ainda nao esta puxando clique e contato na intensidade que deveria.',
          action: 'Fortalecer headline, CTA acima da dobra, contato visivel e prova de valor do produto.'
        };

  const summary =
    objective?.key === 'porto_direct_click'
      ? `${product?.name}: a meta principal e empurrar o clique no link oficial da Porto; WhatsApp e formulario entram apenas como apoio.`
      : views >= 50 && leads === 0
      ? `${product?.name}: o front-end das paginas do produto precisa pedir a acao com mais clareza e a base de SEO/captura precisa sustentar melhor esse interesse.`
      : `${product?.name}: alinhe front-end visivel com SEO e captura para transformar melhor procura em lead.`;

  return {
    summary,
    salesGoal,
    insidePage,
    outsidePage,
    acquisition,
    conversion,
    nextActions: [
      outsidePage.action,
      insidePage.action,
      objective?.key === 'porto_direct_click'
        ? 'Depois de arrumar a base, medir clique no link oficial da Porto e conclusao da jornada antes de abrir mais apoio no WhatsApp.'
        : leadRate >= 10 && views < 120
        ? 'Depois de arrumar a base, mandar mais trafego qualificado para as paginas mais fortes deste produto.'
        : 'Depois de arrumar a base, medir clique e lead antes de ampliar distribuicao ou verba.'
    ],
    expectedResult:
      objective?.key === 'porto_direct_click'
        ? 'Se o CTA oficial da Porto ficar mais claro e melhor medido, o produto tende a gerar clique mais qualificado e mais contratacao.'
        : leadRate >= 10 && views < 120
        ? 'Se o produto mantiver resposta depois do ajuste, ele pode escalar com mais seguranca para gerar vendas.'
        : 'Se o front-end ficar mais claro e a base interna mais confiavel, o produto tende a ganhar mais acesso, clique e lead.',
    confidence: views >= 30 ? 'media' : 'baixa'
  };
}

async function callOpenAiProductAudit(payload) {
  return callOpenAiStructuredAudit({
    payload,
    systemPrompt: PRODUCT_AUDIT_SYSTEM_PROMPT,
    workflow: 'product-detail-audit',
    schemaName: 'product_ai_audit'
  });
}

export async function buildProductAiAudit({ product, relatedPages, relatedCampaigns, recentLeads }) {
  const mainProductPath = product?.siteUrl || `/produtos/${product?.slug}`;
  const [publicSnapshot, searchSnapshot] = await Promise.all([
    fetchPublicPageSnapshot(mainProductPath),
    getCachedSearchConsoleOpportunitySnapshot().catch(() => null)
  ]);

  const searchSignal = findSearchConsoleSignals(mainProductPath, searchSnapshot);
  const objective = resolveEntityConversionGoal({ productSlug: product?.slug, pagePath: mainProductPath });
  const payload = {
    businessGoal: objective,
    product: {
      slug: product?.slug,
      name: product?.name,
      category: product?.category,
      siteUrl: mainProductPath,
      views: Number(product?.views || 0),
      clicks: Number(product?.clicks || 0),
      leads: Number(product?.leads || 0),
      clickRate: Number(product?.clickRate || 0),
      leadRate: Number(product?.leadRate || 0),
      headline: product?.decision?.headline || '',
      diagnosis: product?.decision?.diagnosis?.summary || '',
      recommendation: product?.decision?.recommendation?.summary || '',
      impact: product?.decision?.recommendation?.impact || '',
      priority: product?.decision?.recommendation?.priority || ''
    },
    publicPage: publicSnapshot,
    relatedPages: (relatedPages || []).slice(0, 5),
    relatedCampaigns: (relatedCampaigns || []).slice(0, 5),
    recentLeads: (recentLeads || []).slice(0, 5).map((item) => ({
      status: item.status,
      pagePath: item.pagePath,
      createdAt: item.createdAt
    })),
    searchConsole: searchSignal
  };

  const fallback = buildLocalProductAiAudit({
    product,
    relatedPages,
    relatedCampaigns,
    recentLeads,
    objective,
    publicSnapshot,
    searchSignal
  });
  const observed = buildObservedSignals(publicSnapshot, searchSignal, objective);
  const signature = buildProductAuditSignature({
    product,
    relatedPages,
    relatedCampaigns,
    recentLeads,
    publicSnapshot,
    searchSignal,
    objective
  });
  const cachedAuditEntry = await readAdminRuntimeSetting(buildProductAuditCacheKey(product?.slug)).catch(() => null);
  const cachedAudit = extractCachedAudit(cachedAuditEntry);
  const liveTtlMs = resolveDetailLiveTtlMs(product?.decision?.scores?.priority || 0);

  if (!hasOpenAiAuditProvider()) {
    if (
      shouldReuseDetailAiCache(
        { ...(cachedAuditEntry?.value || {}), liveTtlMs },
        { hasLiveProvider: false, signature }
      ) &&
      cachedAudit
    ) {
      return {
        ...applyConversionGoalToAudit(cachedAudit, objective, 'produto'),
        observed
      };
    }

    return {
      ...applyConversionGoalToAudit(fallback, objective, 'produto'),
      source: buildFallbackSource('missing-config'),
      observed
    };
  }

  if (
    shouldReuseDetailAiCache(
      { ...(cachedAuditEntry?.value || {}), liveTtlMs },
      { hasLiveProvider: true, signature }
    ) &&
    cachedAudit
  ) {
    return {
      ...applyConversionGoalToAudit(cachedAudit, objective, 'produto'),
      observed
    };
  }

  try {
    const live = await callOpenAiProductAudit(payload);
    const alignedLive = applyConversionGoalToAudit(live, objective, 'produto');
    await upsertAdminRuntimeSetting({
      settingKey: buildProductAuditCacheKey(product?.slug),
      value: {
        audit: alignedLive,
        signature,
        liveTtlMs,
        updatedAt: new Date().toISOString()
      },
      actor: 'product-ai-audit'
    }).catch(() => null);

    return {
      ...alignedLive,
      observed
    };
  } catch (error) {
    if (cachedAudit) {
      return {
        ...applyConversionGoalToAudit(cachedAudit, objective, 'produto'),
        observed
      };
    }

    return {
      ...applyConversionGoalToAudit(fallback, objective, 'produto'),
      source: buildFallbackSource('error'),
      observed
    };
  }
}
