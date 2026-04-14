import 'server-only';

import { logAiUsage } from '@/lib/admin/cost-controller';
import { buildContactSurfaceSummary } from '@/lib/admin/entity-conversion-goals';
import { normalizePagePath } from '@/lib/admin/page-presentation';
import { siteConfig } from '@/lib/site';

export const ENTITY_AI_AUDIT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    salesGoal: { type: 'string' },
    insidePage: {
      type: 'object',
      additionalProperties: false,
      properties: {
        diagnosis: { type: 'string' },
        missing: { type: 'string' },
        action: { type: 'string' }
      },
      required: ['diagnosis', 'missing', 'action']
    },
    outsidePage: {
      type: 'object',
      additionalProperties: false,
      properties: {
        diagnosis: { type: 'string' },
        missing: { type: 'string' },
        action: { type: 'string' }
      },
      required: ['diagnosis', 'missing', 'action']
    },
    acquisition: {
      type: 'object',
      additionalProperties: false,
      properties: {
        diagnosis: { type: 'string' },
        action: { type: 'string' }
      },
      required: ['diagnosis', 'action']
    },
    conversion: {
      type: 'object',
      additionalProperties: false,
      properties: {
        diagnosis: { type: 'string' },
        action: { type: 'string' }
      },
      required: ['diagnosis', 'action']
    },
    nextActions: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 4
    },
    expectedResult: { type: 'string' },
    confidence: { type: 'string' }
  },
  required: ['summary', 'salesGoal', 'insidePage', 'outsidePage', 'acquisition', 'conversion', 'nextActions', 'expectedResult', 'confidence']
};

export function resolveAiModel() {
  if (process.env.OPENAI_ADMIN_MODEL) {
    return String(process.env.OPENAI_ADMIN_MODEL).trim();
  }

  return 'gpt-5-mini';
}

export function hasOpenAiAuditProvider() {
  return Boolean(String(process.env.OPENAI_API_KEY || '').trim());
}

export function buildFallbackSource(reason = 'missing-config') {
  if (reason === 'error') {
    return {
      status: 'fallback',
      label: 'IA em nova leitura',
      model: 'A proxima leitura entra assim que o sinal ficar pronto'
    };
  }

  return {
    status: 'fallback',
    label: 'IA aguardando conexão',
    model: 'Conecte as credenciais para liberar a leitura'
  };
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts = [];
  for (const item of payload?.output || []) {
    if (item?.type !== 'message') continue;
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') {
        parts.push(content.text);
      }
    }
  }

  return parts.join('\n').trim();
}

function extractJsonObject(text) {
  const value = String(text || '').trim();
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('A resposta da IA nao retornou JSON valido.');
  }

  return JSON.parse(value.slice(start, end + 1));
}

function buildStructuredRequest({ payload, model, systemPrompt, schemaName }) {
  return {
    model,
    reasoning: { effort: 'low' },
    max_output_tokens: 2200,
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        schema: ENTITY_AI_AUDIT_SCHEMA,
        strict: true
      }
    },
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: `${systemPrompt}\nSeja extremamente conciso: use no maximo uma frase curta por campo e evite explicacoes longas.`
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: JSON.stringify(payload)
          }
        ]
      }
    ]
  };
}

function buildJsonFallbackRequest({ payload, model, systemPrompt }) {
  return {
    model,
    reasoning: { effort: 'low' },
    max_output_tokens: 2200,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: `${systemPrompt}\nResponda apenas com um JSON valido. Use exatamente estes campos: summary, salesGoal, insidePage { diagnosis, missing, action }, outsidePage { diagnosis, missing, action }, acquisition { diagnosis, action }, conversion { diagnosis, action }, nextActions, expectedResult, confidence. Cada valor deve ser curto, direto e comercial. Use no maximo uma frase curta por campo.`
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: JSON.stringify(payload)
          }
        ]
      }
    ]
  };
}

function normalizeAuditObject(raw) {
  const insidePage = raw?.insidePage || raw?.inside_page || {};
  const outsidePage = raw?.outsidePage || raw?.outside_page || {};
  const acquisition = raw?.acquisition || {};
  const conversion = raw?.conversion || {};
  const nextActionsRaw = Array.isArray(raw?.nextActions || raw?.next_actions) ? (raw.nextActions || raw.next_actions) : [];
  const nextActions = nextActionsRaw.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 4);

  while (nextActions.length < 3) {
    nextActions.push('Revisar promessa, CTA e captura para destravar mais clique e lead.');
  }

  return {
    summary: String(raw?.summary || '').trim() || 'A pagina precisa alinhar frente comercial e base interna para vender mais.',
    salesGoal: String(raw?.salesGoal || raw?.sales_goal || '').trim() || 'Ganhar mais acesso, clique, lead e venda com menos desperdicio.',
    insidePage: {
      diagnosis: String(insidePage?.diagnosis || '').trim() || 'A base interna ainda pode sustentar melhor descoberta, indexacao e captura.',
      missing: String(insidePage?.missing || '').trim() || 'Hoje ainda faltam alguns ajustes internos de SEO, tracking e captura.',
      action: String(insidePage?.action || '').trim() || 'Revisar SEO tecnico, tracking e ponto de captura.'
    },
    outsidePage: {
      diagnosis: String(outsidePage?.diagnosis || '').trim() || 'A camada visivel ainda pode pedir mais acao e gerar mais confianca.',
      missing: String(outsidePage?.missing || '').trim() || 'Hoje ainda faltam promessa clara, prova de valor e CTA mais forte.',
      action: String(outsidePage?.action || '').trim() || 'Revisar hero, CTA, prova e hierarquia visual.'
    },
    acquisition: {
      diagnosis: String(acquisition?.diagnosis || '').trim() || 'A base de descoberta ainda pode trazer mais gente certa.',
      action: String(acquisition?.action || '').trim() || 'Fortalecer SEO e distribuicao da rota principal.'
    },
    conversion: {
      diagnosis: String(conversion?.diagnosis || '').trim() || 'A pagina ainda pode conduzir melhor para clique e lead.',
      action: String(conversion?.action || '').trim() || 'Reduzir friccao e deixar o pedido de contato mais claro.'
    },
    nextActions,
    expectedResult: String(raw?.expectedResult || raw?.expected_result || '').trim() || 'Com os ajustes certos, a pagina tende a gerar mais clique, lead e venda.',
    confidence: String(raw?.confidence || '').trim() || 'media'
  };
}

export function stripHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTagText(html, tagName) {
  const match = String(html || '').match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return stripHtml(match?.[1] || '');
}

function extractMetaDescription(html) {
  const match =
    String(html || '').match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
    String(html || '').match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);

  return stripHtml(match?.[1] || '');
}

function buildCtaSignalSummary(html) {
  const hasDirectPortoLink = /href=["'][^"']*(porto\.vc|portoseguro\.com\.br)[^"']*["']/i.test(String(html || ''));
  const matches = String(html || '').match(
    /(whatsapp|cotar|cotacao|simular|simule|fale com|falar com|solicitar|contratar|quero|comparar|saiba mais)/gi
  );
  const total = matches?.length || 0;

  if (hasDirectPortoLink && total <= 3) {
    return 'O HTML mostra link oficial da Porto; o clique direto de contratacao precisa ser a conversao principal.';
  }

  if (hasDirectPortoLink) {
    return 'O HTML mostra CTA com link oficial da Porto e outros convites visiveis; o clique direto deve seguir como meta principal.';
  }

  if (!total) return 'Nenhum verbo de CTA evidente foi detectado no HTML.';
  if (total <= 3) return 'Poucos sinais de CTA visiveis foram detectados no HTML.';
  return 'O HTML mostra varios verbos de CTA, mas isso ainda precisa virar clique e lead.';
}

function resolveAuditBaseCandidates() {
  const values = [
    process.env.ADMIN_AUDIT_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    'http://127.0.0.1:3001',
    siteConfig.url
  ]
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  return [...new Set(values)];
}

export async function fetchPublicPageSnapshot(pagePath) {
  const normalized = normalizePagePath(pagePath);

  if (!normalized || normalized.startsWith('/dashboard') || normalized.startsWith('/admin')) {
    return {
      pageUrl: '',
      title: '',
      h1: '',
      metaDescription: '',
      hasForm: false,
      hasWhatsapp: false,
      hasDirectPortoLink: false,
      ctaSignalSummary: 'Pagina interna do painel; leitura de HTML publico nao se aplica.',
      wordCount: 0
    };
  }

  for (const baseUrl of resolveAuditBaseCandidates()) {
    try {
      const pageUrl = new URL(normalized, baseUrl).toString();
      const response = await fetch(pageUrl, { cache: 'no-store' });
      if (!response.ok) continue;

      const html = await response.text();
      const bodyText = stripHtml(html);

      return {
        pageUrl,
        title: extractTagText(html, 'title'),
        h1: extractTagText(html, 'h1'),
        metaDescription: extractMetaDescription(html),
        hasForm: /<form\b/i.test(html),
        hasWhatsapp: /whatsapp|wa\.me/i.test(html),
        hasDirectPortoLink: /href=["'][^"']*(porto\.vc|portoseguro\.com\.br)[^"']*["']/i.test(html),
        ctaSignalSummary: buildCtaSignalSummary(html),
        wordCount: bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0
      };
    } catch {
      continue;
    }
  }

  return {
    pageUrl: '',
    title: '',
    h1: '',
    metaDescription: '',
    hasForm: false,
    hasWhatsapp: false,
    hasDirectPortoLink: false,
    ctaSignalSummary: 'Nao foi possivel ler o HTML publico desta pagina agora.',
    wordCount: 0
  };
}

export function findSearchConsoleSignals(pagePath, snapshot) {
  const normalized = normalizePagePath(pagePath);
  const pageOpportunity = (snapshot?.pageOpportunities || []).find((item) => normalizePagePath(item.page) === normalized) || null;
  const topPage = (snapshot?.topPages || []).find((item) => normalizePagePath(item.page) === normalized) || null;
  const signal = pageOpportunity || topPage || null;

  return signal
    ? {
        page: signal.page,
        clicks: Number(signal.clicks || 0),
        impressions: Number(signal.impressions || 0),
        ctr: Number(signal.ctr || 0),
        position: Number(signal.position || 0),
        opportunityScore: Number(signal.opportunityScore || 0)
      }
    : null;
}

export function buildObservedSignals(publicSnapshot, searchSignal, objective = null) {
  return {
    title: publicSnapshot?.title || 'Sem title detectado',
    h1: publicSnapshot?.h1 || 'Sem H1 detectado',
    metaDescription: publicSnapshot?.metaDescription || 'Sem meta description detectada',
    hasForm: Boolean(publicSnapshot?.hasForm),
    hasWhatsapp: Boolean(publicSnapshot?.hasWhatsapp),
    hasDirectPortoLink: Boolean(publicSnapshot?.hasDirectPortoLink),
    contactSignalSummary: buildContactSurfaceSummary({
      objective,
      hasForm: Boolean(publicSnapshot?.hasForm),
      hasWhatsapp: Boolean(publicSnapshot?.hasWhatsapp),
      hasDirectPortoLink: Boolean(publicSnapshot?.hasDirectPortoLink)
    }),
    ctaSignalSummary: publicSnapshot?.ctaSignalSummary || 'Sem leitura estrutural adicional.',
    wordCount: Number(publicSnapshot?.wordCount || 0),
    searchConsole:
      searchSignal
        ? `${searchSignal.impressions} impressoes, CTR ${searchSignal.ctr}%, posicao ${searchSignal.position}.`
        : 'Sem sinal forte do Search Console para esta pagina agora.'
  };
}

function estimateTokens(payload) {
  return Math.ceil(JSON.stringify(payload).length / 4);
}

export async function callOpenAiStructuredAudit({ payload, systemPrompt, workflow, schemaName }) {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('OpenAI nao configurada.');
  }

  const model = resolveAiModel();
  const endpoint = `${process.env.OPENAI_BASE_URL || 'https://api.openai.com'}/v1/responses`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  let lastError = null;

  for (const body of [
    buildStructuredRequest({ payload, model, systemPrompt, schemaName }),
    buildJsonFallbackRequest({ payload, model, systemPrompt })
  ]) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      const raw = await response.json();
      if (!response.ok) {
        throw new Error(raw?.error?.message || 'Falha ao consultar a OpenAI para auditar a entidade.');
      }

      if (raw?.status === 'incomplete') {
        throw new Error('A resposta da OpenAI veio incompleta.');
      }

      const text = extractResponseText(raw);
      const parsed = normalizeAuditObject(extractJsonObject(text));

      await logAiUsage({
        model,
        workflow,
        mode: 'intermediate',
        inputTokens: raw?.usage?.input_tokens || estimateTokens(payload),
        outputTokens: raw?.usage?.output_tokens || estimateTokens(parsed)
      });

      return {
        source: {
          status: 'live',
          label: 'IA ativa',
          model
        },
        ...parsed
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Falha ao consultar a IA para auditar a entidade.');
}
