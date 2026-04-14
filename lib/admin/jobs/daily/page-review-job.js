import 'server-only';

import { getAdminPagesSnapshot } from '@/lib/admin/pages-overview';
import { recordPageRecommendation } from '@/lib/admin/page-recommendation-history';

const PAGE_REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    action: { type: 'string' },
    confidence: { type: 'string' }
  },
  required: ['summary', 'action', 'confidence']
};

function buildLocalPageReview(page, reason = '') {
  const leadRate = Number(page?.leadRate || 0);
  const views = Number(page?.views || 0);
  const leads = Number(page?.leads || 0);
  const recommendation = String(page?.decision?.recommendation || '').trim();

  let summary = 'Pagina com leitura inicial';
  let action = recommendation || 'Revisar a proposta principal e o CTA acima da dobra.';
  let confidence = 'media';

  if (views >= 50 && leads === 0) {
    summary = 'Pagina com trafego, mas sem resposta comercial';
    action = recommendation || 'Revisar headline, CTA principal e prova de valor antes de mandar mais trafego.';
    confidence = 'alta';
  } else if (leadRate >= 2) {
    summary = 'Pagina com sinal positivo de conversao';
    action = recommendation || 'Manter a base atual e testar um reforco leve de distribuicao ou copy.';
    confidence = 'media';
  }

  if (reason) {
    action = `${action} (${reason})`;
  }

  return { summary, action, confidence };
}

async function callPageReviewAi(page) {
  const model = 'gpt-5-mini';
  const response = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com'}/v1/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${String(process.env.OPENAI_API_KEY || '').trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: 'low' },
      max_output_tokens: 400,
      text: {
        format: {
          type: 'json_schema',
          name: 'page_review',
          schema: PAGE_REVIEW_SCHEMA,
          strict: true
        }
      },
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'Voce e um analista de conversao. Baseado no resumo abaixo da pagina, gere um resumo, um proximo passo e um nivel de confianca. Retorne apenas JSON.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify({
                pagePath: page.pagePath,
                views: page.views,
                leads: page.leads,
                leadRate: page.leadRate,
                recommendation: page.decision?.recommendation
              })
            }
          ]
        }
      ]
    }),
    cache: 'no-store'
  });

  const raw = await response.json();
  if (!response.ok) {
    throw new Error(raw?.error?.message || 'Falha ao chamar OpenAI para revisão da página.');
  }

  if (raw?.status === 'incomplete') {
    throw new Error('Resposta da IA incompleta.');
  }

  const text = raw?.output?.find((item) => item.type === 'message')?.content?.find((c) => c.type === 'output_text')?.text;
  if (!text) throw new Error('Resposta da IA não retornou texto.');

  const payload = JSON.parse(text);
  return payload;
}

export async function runDailyPageReviewJob() {
  const snapshot = await getAdminPagesSnapshot({ limit: 20 });
  const candidates = snapshot.items
    .filter((item) => Number(item.decision?.scores?.priority || 0) >= 50)
    .slice(0, 3);

  const entries = [];
  for (const page of candidates) {
    try {
      const review = await callPageReviewAi(page);
      const entry = await recordPageRecommendation({
        pagePath: page.pagePath,
        label: review.summary,
        status: 'suggested',
        detail: `${review.action} · confiança ${review.confidence}`,
        actor: 'AI'
      });
      entries.push(entry);
    } catch (error) {
      const fallback = buildLocalPageReview(
        page,
        error instanceof Error ? `fallback local: ${error.message}` : 'fallback local'
      );
      const entry = await recordPageRecommendation({
        pagePath: page.pagePath,
        label: fallback.summary,
        status: 'suggested',
        detail: `${fallback.action} · confianca ${fallback.confidence}`,
        actor: 'AI'
      });
      entries.push(entry);
    }
  }

  return {
    jobKey: 'daily-page-review',
    status: 'completed',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    summary: `IA revisou ${entries.length} páginas.`,
    payload: { entries }
  };
}
