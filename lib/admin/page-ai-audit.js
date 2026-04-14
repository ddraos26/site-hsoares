import 'server-only';

import crypto from 'node:crypto';
import { getCachedSearchConsoleOpportunitySnapshot } from '@/lib/admin/server-snapshot-cache';
import { applyConversionGoalToAudit, resolveEntityConversionGoal } from '@/lib/admin/entity-conversion-goals';
import { formatPageLabel } from '@/lib/admin/page-presentation';
import { resolveDetailLiveTtlMs, shouldReuseDetailAiCache } from '@/lib/admin/ai-usage-policy';
import { readAdminRuntimeSetting, upsertAdminRuntimeSetting } from '@/lib/admin/runtime-settings-store';
import {
  buildFallbackSource,
  buildObservedSignals,
  callOpenAiStructuredAudit,
  fetchPublicPageSnapshot,
  findSearchConsoleSignals,
  hasOpenAiAuditProvider
} from '@/lib/admin/entity-ai-audit-shared';

const PAGE_AUDIT_SYSTEM_PROMPT =
  'Voce e um analista de crescimento, front-end comercial, SEO e conversao para corretora de seguros. Responda em portugues do Brasil, de forma objetiva e acionavel. Nesta auditoria, "fora da pagina" significa a camada visivel do front-end que o visitante enxerga: hero, promessa, prova, comparativo, CTA, contato, hierarquia e clareza visual. "Dentro da pagina" significa o que sustenta a pagina por tras: SEO, title, meta description, H1, indexacao, tracking, captura de lead, roteamento tecnico e confiabilidade da estrutura. Seu foco e dizer o que falta para gerar mais acessos, mais cliques, mais leads e mais vendas. Se o payload indicar businessGoal.primaryConversion = "porto_direct_click", trate o clique no link oficial da Porto como meta principal da pagina. Nesse caso, WhatsApp e formulario entram apenas como apoio secundario para duvidas e nao devem ser tratados como conversao principal.';

function buildPageAuditCacheKey(pagePath) {
  return `page-ai-audit:${pagePath || 'unknown'}`;
}

function extractCachedAudit(entry) {
  const cachedAudit = entry?.value?.audit;
  return cachedAudit && typeof cachedAudit === 'object' ? cachedAudit : null;
}

function buildPageAuditSignature({ page, behavioralSignals, trafficSources, recentLeads, publicSnapshot, searchSignal, objective }) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        pagePath: page?.pagePath || '',
        views: Number(page?.views || 0),
        clicks: Number(page?.clicks || 0),
        leads: Number(page?.leads || 0),
        clickRate: Number(page?.clickRate || 0),
        leadRate: Number(page?.leadRate || 0),
        primaryClicks: Number(behavioralSignals?.primaryClicks || 0),
        secondaryClicks: Number(behavioralSignals?.secondaryClicks || 0),
        whatsappClicks: Number(behavioralSignals?.whatsappClicks || 0),
        scrollRelevant: Number(behavioralSignals?.scrollRelevant || 0),
        trafficSources: (trafficSources || []).slice(0, 3),
        recentLeads: (recentLeads || []).slice(0, 3).map((item) => ({
          status: item.status,
          productSlug: item.productSlug,
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

function buildInsidePageFallback(context) {
  const { page, publicSnapshot, searchSignal, recentLeads, objective } = context;
  const missingPieces = [];

  if (!publicSnapshot?.title) missingPieces.push('title SEO mais claro');
  if (!publicSnapshot?.metaDescription) missingPieces.push('meta description com promessa comercial');
  if (!publicSnapshot?.h1) missingPieces.push('hierarquia de heading confiavel');
  if (objective?.key === 'porto_direct_click') {
    if (!publicSnapshot?.hasDirectPortoLink) missingPieces.push('botao oficial da Porto bem visivel e rastreado');
  } else if (!publicSnapshot?.hasForm && !publicSnapshot?.hasWhatsapp) {
    missingPieces.push('captura tecnica de lead');
  }
  if (!searchSignal) missingPieces.push('sinal organico consistente');
  if (!recentLeads?.length && Number(page?.views || 0) >= 20) missingPieces.push('tracking e roteamento de conversao mais confiaveis');

  return {
    diagnosis:
      searchSignal?.impressions >= 20
        ? 'Por dentro, a base tecnica e de SEO ainda pode aproveitar melhor a demanda que ja existe para esta pagina.'
        : 'Por dentro, a pagina ainda nao mostra uma base forte de SEO, captura e instrumentacao para crescer com previsibilidade.',
    missing: missingPieces.length
      ? `Hoje parecem faltar principalmente: ${missingPieces.slice(0, 3).join(', ')}.`
      : 'Hoje falta deixar a base tecnica e de SEO mais redonda para a pagina crescer sem desperdicio.',
    action:
      objective?.key === 'porto_direct_click'
        ? 'Revisar SEO tecnico, tracking do clique oficial da Porto e leitura confiavel da rota principal.'
        : 'Revisar title, meta description, heading principal, indexacao, tracking e ponto de captura do lead.'
  };
}

function buildOutsidePageFallback(context) {
  const { page, behavioralSignals, publicSnapshot, objective } = context;
  const views = Number(page?.views || 0);
  const primaryClicks = Number(behavioralSignals?.primaryClicks || 0);
  const lowScroll = Number(behavioralSignals?.scrollRelevant || 0) <= Math.max(1, Math.round(views * 0.05));
  const missingPieces = [];

  if (!publicSnapshot?.h1) missingPieces.push('promessa principal mais clara');
  if (objective?.key === 'porto_direct_click') {
    if (!publicSnapshot?.hasDirectPortoLink) missingPieces.push('link oficial da Porto com mais destaque');
  } else if (!publicSnapshot?.hasForm && !publicSnapshot?.hasWhatsapp) {
    missingPieces.push('contato visivel na tela');
  }
  if (primaryClicks === 0 && views >= 20) missingPieces.push('CTA principal mais forte');
  if (lowScroll) missingPieces.push('organizacao visual mais convincente acima da dobra');
  if (!/varios verbos de CTA/i.test(publicSnapshot?.ctaSignalSummary || '')) missingPieces.push('mais convites visiveis para agir');

  return {
    diagnosis:
      objective?.key === 'porto_direct_click'
        ? 'Na camada visivel, a pagina ainda precisa deixar mais obvio que o proximo passo certo e clicar no link oficial da Porto.'
        : page?.decision?.diagnosis?.summary ||
          'Na camada visivel, a pagina ainda nao deixa tao claro por que clicar, confiar e pedir contato agora.',
    missing: missingPieces.length
      ? `Hoje parecem faltar principalmente: ${missingPieces.slice(0, 3).join(', ')}.`
      : 'Hoje falta deixar a proposta, a prova e o CTA mais evidentes no front-end.',
    action:
      objective?.key === 'porto_direct_click'
        ? 'Reorganizar hero, prova, comparativo e CTA para empurrar o clique no link oficial da Porto como acao principal.'
        : 'Reorganizar hero, prova de valor, comparativo, CTA acima da dobra e contato visivel no front-end.'
  };
}

function buildLocalPageAiAudit(context) {
  const insidePage = buildInsidePageFallback(context);
  const outsidePage = buildOutsidePageFallback(context);
  const objective = context.objective;
  const searchSignal = context.searchSignal;
  const page = context.page;
  const behavioralSignals = context.behavioralSignals || {};
  const leadRate = Number(page?.leadRate || 0);
  const views = Number(page?.views || 0);
  const primaryClicks = Number(behavioralSignals?.primaryClicks || 0);
  const leads = Number(page?.leads || 0);

  let salesGoal = 'Ganhar mais acessos, clique e lead sem desperdiçar trafego.';
  if (objective?.key === 'porto_direct_click') {
    salesGoal = objective.primaryGoal;
  } else if (leadRate >= 10 && views < 120) {
    salesGoal = 'Levar mais gente certa para uma pagina que ja mostra sinal de resposta comercial.';
  } else if (views >= 50 && leads === 0) {
    salesGoal = 'Transformar trafego ja existente em clique, lead e chance real de venda.';
  }

  const acquisition = searchSignal?.impressions >= 20
    ? {
        diagnosis: 'Ja existe procura organica visivel para esta pagina, mas a base de SEO ainda pode capturar mais.',
        action:
          objective?.key === 'porto_direct_click'
            ? 'Melhorar SEO e distribuicao para trazer gente com intencao de contratacao para o clique oficial da Porto.'
            : 'Melhorar title, meta description, interlinking e apoio de conteudo para crescer acesso qualificado.'
      }
    : {
        diagnosis: 'O acesso ainda depende de uma base interna de SEO e discoverability mais forte.',
        action:
          objective?.key === 'porto_direct_click'
            ? 'Arrumar SEO e tracking antes de escalar a rota que leva ao link oficial da Porto.'
            : 'Arrumar a base de SEO e tracking antes de escalar distribuicao para esta pagina.'
      };

  const conversion = objective?.key === 'porto_direct_click'
    ? {
        diagnosis: 'A conversao principal desta rota e o clique no link oficial da Porto, e a pagina ainda pode guiar melhor para esse passo.',
        action: 'Fortalecer o botao oficial da Porto, reduzir distracoes e deixar WhatsApp ou formulario apenas como apoio.'
      }
    : primaryClicks > 0 || leads > 0
      ? {
          diagnosis: 'O front-end ja recebe alguma resposta, mas ainda pode ficar mais persuasivo e direto.',
          action: 'Refinar hero, prova, CTA e organizacao visual para subir clique e lead sem confundir o visitante.'
        }
      : {
          diagnosis: 'A camada visivel ainda nao esta puxando clique e contato na intensidade que deveria.',
          action: 'Fortalecer headline, CTA acima da dobra, contato visivel e prova de valor para a oferta parecer obvia.'
        };

  const summary =
    objective?.key === 'porto_direct_click'
      ? `${formatPageLabel(page?.pagePath)}: esta rota precisa vender pelo clique no link oficial da Porto, com WhatsApp e formulario apenas como apoio.`
      : views >= 50 && leads === 0
      ? `${formatPageLabel(page?.pagePath)}: o front-end precisa pedir a acao com mais clareza e a base de SEO/captura precisa sustentar melhor essa rota.`
      : `${formatPageLabel(page?.pagePath)}: alinhe front-end visivel com SEO e captura para transformar mais visita em lead.`;

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
        ? 'Depois de arrumar a base, mandar mais trafego qualificado para validar escala.'
        : 'Depois de arrumar a base, medir se clique e lead subiram antes de ampliar distribuicao.'
    ],
    expectedResult:
      objective?.key === 'porto_direct_click'
        ? 'Se o CTA oficial da Porto ficar mais claro e melhor medido, a pagina tende a gerar clique mais qualificado e mais contratacao.'
        : leadRate >= 10 && views < 120
        ? 'Se a pagina mantiver resposta depois do ajuste, ela pode escalar com mais seguranca para gerar vendas.'
        : 'Se o front-end ficar mais claro e a base interna mais confiavel, a pagina tende a ganhar mais acesso, clique e lead.',
    confidence: views >= 30 ? 'media' : 'baixa'
  };
}

async function callOpenAiPageAudit(payload) {
  return callOpenAiStructuredAudit({
    payload,
    systemPrompt: PAGE_AUDIT_SYSTEM_PROMPT,
    workflow: 'page-detail-audit',
    schemaName: 'page_ai_audit'
  });
}

export async function buildPageAiAudit({ page, behavioralSignals, trafficSources, recentLeads }) {
  const [publicSnapshot, searchSnapshot] = await Promise.all([
    fetchPublicPageSnapshot(page?.pagePath),
    getCachedSearchConsoleOpportunitySnapshot().catch(() => null)
  ]);

  const searchSignal = findSearchConsoleSignals(page?.pagePath, searchSnapshot);
  const objective = resolveEntityConversionGoal({ pagePath: page?.pagePath });
  const payload = {
    businessGoal: objective,
    page: {
      pagePath: page?.pagePath,
      pageLabel: formatPageLabel(page?.pagePath),
      pageType: page?.pageType,
      views: Number(page?.views || 0),
      clicks: Number(page?.clicks || 0),
      leads: Number(page?.leads || 0),
      clickRate: Number(page?.clickRate || 0),
      leadRate: Number(page?.leadRate || 0),
      headline: page?.decision?.headline || '',
      diagnosis: page?.decision?.diagnosis?.summary || '',
      recommendation: page?.decision?.recommendation?.summary || '',
      impact: page?.decision?.recommendation?.impact || '',
      priority: page?.decision?.recommendation?.priority || ''
    },
    publicPage: publicSnapshot,
    behavioralSignals: {
      primaryClicks: Number(behavioralSignals?.primaryClicks || 0),
      secondaryClicks: Number(behavioralSignals?.secondaryClicks || 0),
      whatsappClicks: Number(behavioralSignals?.whatsappClicks || 0),
      scrollRelevant: Number(behavioralSignals?.scrollRelevant || 0)
    },
    trafficSources: (trafficSources || []).slice(0, 3),
    recentLeads: (recentLeads || []).slice(0, 3).map((item) => ({
      status: item.status,
      productSlug: item.productSlug,
      createdAt: item.createdAt
    })),
    searchConsole: searchSignal
  };

  const fallback = buildLocalPageAiAudit({
    page,
    behavioralSignals,
    trafficSources,
    objective,
    searchSignal,
    publicSnapshot,
    recentLeads
  });
  const observed = buildObservedSignals(publicSnapshot, searchSignal, objective);
  const signature = buildPageAuditSignature({
    page,
    behavioralSignals,
    trafficSources,
    recentLeads,
    publicSnapshot,
    searchSignal,
    objective
  });
  const cachedAuditEntry = await readAdminRuntimeSetting(buildPageAuditCacheKey(page?.pagePath)).catch(() => null);
  const cachedAudit = extractCachedAudit(cachedAuditEntry);
  const liveTtlMs = resolveDetailLiveTtlMs(page?.decision?.scores?.priority || 0);

  if (!hasOpenAiAuditProvider()) {
    if (
      shouldReuseDetailAiCache(
        { ...(cachedAuditEntry?.value || {}), liveTtlMs },
        { hasLiveProvider: false, signature }
      ) &&
      cachedAudit
    ) {
      return {
        ...applyConversionGoalToAudit(cachedAudit, objective),
        observed
      };
    }

    return {
      ...applyConversionGoalToAudit(fallback, objective),
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
      ...applyConversionGoalToAudit(cachedAudit, objective),
      observed
    };
  }

  try {
    const live = await callOpenAiPageAudit(payload);
    const alignedLive = applyConversionGoalToAudit(live, objective);
    await upsertAdminRuntimeSetting({
      settingKey: buildPageAuditCacheKey(page?.pagePath),
      value: {
        audit: alignedLive,
        signature,
        liveTtlMs,
        updatedAt: new Date().toISOString()
      },
      actor: 'page-ai-audit'
    }).catch(() => null);

    return {
      ...alignedLive,
      observed
    };
  } catch (error) {
    if (cachedAudit) {
      return {
        ...applyConversionGoalToAudit(cachedAudit, objective),
        observed
      };
    }

    return {
      ...applyConversionGoalToAudit(fallback, objective),
      source: buildFallbackSource('error'),
      observed
    };
  }
}
