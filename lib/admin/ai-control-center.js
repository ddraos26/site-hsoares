import 'server-only';

import crypto from 'node:crypto';
import { getAdminDecisionEngineSnapshot } from '@/lib/admin/decision-engine';
import { getAdminDailyChecklistSnapshot } from '@/lib/admin/daily-checklist-store';
import { buildExecutionCenter } from '@/lib/admin/execution-center';
import { getAdminHistorySnapshot } from '@/lib/admin/history-overview';
import { logAiUsage } from '@/lib/admin/cost-controller';
import { shouldReuseDashboardAiCache } from '@/lib/admin/ai-usage-policy';
import { getCachedExecutiveCockpitSnapshot } from '@/lib/admin/server-snapshot-cache';
import {
  readAdminRuntimeSetting,
  upsertAdminRuntimeSetting
} from '@/lib/admin/runtime-settings-store';

const AI_BRIEF_CACHE_KEY = 'ai-control-center:latest';
const AI_COCKPIT_CACHE_KEY = 'ai-control-center:cockpit';

const AI_BRIEF_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    dailyHeadline: { type: 'string' },
    dailyNarrative: { type: 'string' },
    weeklyNarrative: { type: 'string' },
    topActions: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 3
    },
    approvals: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          verdict: { type: 'string' },
          whyNow: { type: 'string' },
          expectedUpside: { type: 'string' }
        },
        required: ['id', 'verdict', 'whyNow', 'expectedUpside']
      },
      maxItems: 4
    }
  },
  required: ['dailyHeadline', 'dailyNarrative', 'weeklyNarrative', 'topActions', 'approvals']
};

const AI_COCKPIT_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    missionHeadline: { type: 'string' },
    missionNarrative: { type: 'string' },
    decisionNarrative: { type: 'string' },
    topActions: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 3
    },
    approvals: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          verdict: { type: 'string' },
          whyNow: { type: 'string' },
          expectedUpside: { type: 'string' }
        },
        required: ['id', 'verdict', 'whyNow', 'expectedUpside']
      },
      maxItems: 4
    }
  },
  required: ['missionHeadline', 'missionNarrative', 'decisionNarrative', 'topActions', 'approvals']
};

function buildApprovalDigest(approvals = []) {
  return approvals.slice(0, 4).map((item) => ({
    id: item.id,
    title: item.title,
    risk: item.risk,
    reason: item.reason,
    recommendation: item.recommendation,
    impact: item.impact
  }));
}

function buildInsightsDigest(insights = []) {
  return insights.slice(0, 6).map((item) => ({
    id: item.id,
    title: item.title,
    diagnosis: item.diagnosis,
    recommendation: item.recommendation,
    priority: item.priority,
    requiresApproval: item.requiresApproval
  }));
}

function buildFallbackNarrative(snapshot) {
  const topActions = (snapshot.insights || []).slice(0, 3).map((item) => item.recommendation).filter(Boolean);
  const approvals = buildApprovalDigest(snapshot.approvals?.pending || []).map((item) => ({
    id: item.id,
    verdict: item.risk === 'Alta' ? 'Revisar com prioridade' : 'Pode avaliar com calma',
    whyNow: item.reason,
    expectedUpside: item.impact || item.recommendation
  }));

  return {
    source: {
      provider: 'fallback',
      status: 'fallback',
      label: 'IA em espera',
      model: 'rules-engine'
    },
    dailyHeadline: snapshot.mission?.topPriority || snapshot.summaries?.topPriority || 'Sem prioridade dominante',
    dailyNarrative: snapshot.summaries?.daily || 'O sistema segue usando regras locais enquanto a API da IA não está conectada.',
    weeklyNarrative: snapshot.summaries?.weekly || 'Sem leitura semanal adicional neste momento.',
    topActions: topActions.length ? topActions : ['Conectar a API da IA para receber narrativas mais ricas.'],
    approvals
  };
}

function buildFallbackCockpitNarrative(cockpit) {
  const approvals = (cockpit.approvals || []).slice(0, 4).map((item) => ({
    id: item.id,
    verdict: item.risk === 'Alta' ? 'Prioridade alta de decisão' : 'Pode avaliar com contexto',
    whyNow: item.reason,
    expectedUpside: item.impact || item.recommendation
  }));

  return {
    source: {
      provider: 'fallback',
      status: 'fallback',
      label: 'IA em espera',
      model: 'rules-engine'
    },
    missionHeadline: cockpit.commandCenter?.title || 'Sem headline de missão',
    missionNarrative: cockpit.commandCenter?.diagnosis || 'A missão do dia segue em espera enquanto a nova leitura da IA não fecha.',
    decisionNarrative: cockpit.commandCenter?.recommendation || 'Sem recomendação estratégica adicional.',
    topActions: (cockpit.actionQueue || []).slice(0, 3).map((item) => item.recommendation).filter(Boolean),
    approvals
  };
}

function buildPromptPayload(snapshot) {
  return {
    date: new Date().toISOString().slice(0, 10),
    business: 'Corretora de seguros focada em marketing, vendas e decisão comercial.',
    role: 'Diretor comercial e marketing de uma corretora de seguros no Brasil.',
    daily_summary: snapshot.summaries?.daily || '',
    weekly_summary: snapshot.summaries?.weekly || '',
    mission: {
      top_priority: snapshot.mission?.topPriority || '',
      actions: (snapshot.mission?.actions || []).slice(0, 5).map((item) => ({
        title: item.title,
        recommendation: item.recommendation,
        priority: item.priority
      }))
    },
    insights: buildInsightsDigest(snapshot.insights || []),
    pending_approvals: buildApprovalDigest(snapshot.approvals?.pending || []),
    ai_mode: snapshot.cost?.currentModeLabel || snapshot.promptBundle?.mode || 'Intermediário',
    guardrails_mode: snapshot.guardrails?.autonomy?.label || 'IA em modo assistido'
  };
}

function resolveAiModel(mode = 'intermediate') {
  if (process.env.OPENAI_ADMIN_MODEL) {
    return String(process.env.OPENAI_ADMIN_MODEL).trim();
  }

  if (mode === 'premium') return 'gpt-5.4';
  return 'gpt-5-mini';
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
    throw new Error('A resposta da IA não retornou JSON válido.');
  }

  return JSON.parse(value.slice(start, end + 1));
}

function buildOpenAiStructuredRequest({ model, systemPrompt, payload, schemaName, schema, maxOutputTokens = 700 }) {
  return {
    model,
    reasoning: {
      effort: 'low'
    },
    max_output_tokens: maxOutputTokens,
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        schema,
        strict: true
      }
    },
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: systemPrompt
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

function normalizeAiNarrative(raw, mode) {
  return {
    source: {
      provider: 'openai',
      status: 'live',
      label: 'IA ativa',
      model: mode
    },
    dailyHeadline: String(raw?.dailyHeadline || raw?.daily_headline || '').trim() || 'Sem manchete definida',
    dailyNarrative: String(raw?.dailyNarrative || raw?.daily_narrative || '').trim() || 'Sem narrativa diária.',
    weeklyNarrative: String(raw?.weeklyNarrative || raw?.weekly_narrative || '').trim() || 'Sem narrativa semanal.',
    topActions: Array.isArray(raw?.topActions || raw?.top_actions)
      ? (raw.topActions || raw.top_actions).map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
      : [],
    approvals: Array.isArray(raw?.approvals)
      ? raw.approvals.map((item) => ({
          id: String(item?.id || '').trim(),
          verdict: String(item?.verdict || '').trim(),
          whyNow: String(item?.whyNow || item?.why_now || '').trim(),
          expectedUpside: String(item?.expectedUpside || item?.expected_upside || '').trim()
        })).filter((item) => item.id)
      : []
  };
}

async function callOpenAiControlCenter(payload, modeKey) {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return null;
  }

  const model = resolveAiModel(modeKey);
  const response = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com'}/v1/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      buildOpenAiStructuredRequest({
        model,
        payload,
        schemaName: 'admin_ai_brief',
        schema: AI_BRIEF_RESPONSE_SCHEMA,
        maxOutputTokens: 700,
        systemPrompt:
          'Voce e o segundo cerebro executivo de uma corretora de seguros. Responda em portugues do Brasil, de forma objetiva, pratica e curta. Preencha apenas os campos do schema com frases claras e sem texto extra.'
      })
    ),
    cache: 'no-store'
  });

  const raw = await response.json();
  if (!response.ok) {
    throw new Error(raw?.error?.message || 'Falha ao consultar a API da OpenAI.');
  }

  if (raw?.status === 'incomplete') {
    throw new Error('A resposta da OpenAI foi interrompida antes de terminar.');
  }

  const text = extractResponseText(raw);
  const parsed = normalizeAiNarrative(extractJsonObject(text), model);

  await logAiUsage({
    model,
    workflow: 'control-center-brief',
    mode: modeKey,
    inputTokens: raw?.usage?.input_tokens || 0,
    outputTokens: raw?.usage?.output_tokens || 0
  });

  return parsed;
}

function buildNarrativeSignature(snapshot) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        mode: snapshot.cost?.currentMode || snapshot.promptBundle?.mode,
        daily: snapshot.summaries?.daily,
        weekly: snapshot.summaries?.weekly,
        topPriority: snapshot.mission?.topPriority,
        approvals: buildApprovalDigest(snapshot.approvals?.pending || []),
        insights: buildInsightsDigest(snapshot.insights || [])
      })
    )
    .digest('hex');
}

function buildCockpitSignature(cockpit) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        commandCenter: cockpit.commandCenter,
        actionQueue: (cockpit.actionQueue || []).slice(0, 5),
        approvals: (cockpit.approvals || []).slice(0, 4),
        opportunities: (cockpit.growthMoves || []).slice(0, 3),
        leaks: (cockpit.moneyLeaks || []).slice(0, 3)
      })
    )
    .digest('hex');
}

async function getAiNarrative(snapshot) {
  const signature = buildNarrativeSignature(snapshot);
  const cached = await readAdminRuntimeSetting(AI_BRIEF_CACHE_KEY);
  const hasLiveProvider = Boolean(String(process.env.OPENAI_API_KEY || '').trim());

  if (shouldReuseDashboardAiCache(cached?.value, { hasLiveProvider, signature })) {
    return cached.value.narrative;
  }

  let narrative = buildFallbackNarrative(snapshot);

  try {
    const live = await callOpenAiControlCenter(buildPromptPayload(snapshot), snapshot.cost?.currentMode || snapshot.promptBundle?.mode || 'intermediate');
    if (live) {
      narrative = live;
    }
  } catch (error) {
    narrative = {
      ...narrative,
      source: {
        provider: 'openai',
        status: 'fallback_after_error',
        label: 'IA em nova leitura',
        model: resolveAiModel(snapshot.cost?.currentMode || 'intermediate'),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    };
  }

  await upsertAdminRuntimeSetting({
    settingKey: AI_BRIEF_CACHE_KEY,
    actor: 'system',
    value: {
      signature,
      narrative,
      updatedAt: new Date().toISOString()
    }
  });

  return narrative;
}

async function getAiCockpitNarrative(cockpit) {
  const signature = buildCockpitSignature(cockpit);
  const cached = await readAdminRuntimeSetting(AI_COCKPIT_CACHE_KEY);
  const hasLiveProvider = Boolean(String(process.env.OPENAI_API_KEY || '').trim());

  if (shouldReuseDashboardAiCache(cached?.value, { hasLiveProvider, signature })) {
    return cached.value.narrative;
  }

  let narrative = buildFallbackCockpitNarrative(cockpit);

  if (hasLiveProvider) {
    try {
      const model = resolveAiModel('intermediate');
      const response = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com'}/v1/responses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${String(process.env.OPENAI_API_KEY || '').trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          buildOpenAiStructuredRequest({
            model,
            schemaName: 'admin_ai_cockpit',
            schema: AI_COCKPIT_RESPONSE_SCHEMA,
            maxOutputTokens: 700,
            systemPrompt:
              'Voce e o centro de comando de uma corretora de seguros. Responda em portugues do Brasil, com tom executivo, pratico e curto. Preencha apenas os campos do schema com frases claras e sem texto extra.',
            payload: {
              command_center: cockpit.commandCenter,
              action_queue: (cockpit.actionQueue || []).slice(0, 5),
              pending_approvals: (cockpit.approvals || []).slice(0, 4),
              money_leaks: (cockpit.moneyLeaks || []).slice(0, 3),
              growth_moves: (cockpit.growthMoves || []).slice(0, 3)
            }
          })
        ),
        cache: 'no-store'
      });

      const raw = await response.json();
      if (!response.ok) {
        throw new Error(raw?.error?.message || 'Falha ao consultar a OpenAI para o cockpit.');
      }

      if (raw?.status === 'incomplete') {
        throw new Error('A resposta da OpenAI para o cockpit foi interrompida antes de terminar.');
      }

      const parsed = extractJsonObject(extractResponseText(raw));
      narrative = {
        source: {
          provider: 'openai',
          status: 'live',
          label: 'IA ativa',
          model
        },
        missionHeadline: String(parsed?.missionHeadline || parsed?.mission_headline || '').trim() || cockpit.commandCenter?.title || 'Sem headline',
        missionNarrative: String(parsed?.missionNarrative || parsed?.mission_narrative || '').trim() || cockpit.commandCenter?.diagnosis || 'Sem narrativa',
        decisionNarrative: String(parsed?.decisionNarrative || parsed?.decision_narrative || '').trim() || cockpit.commandCenter?.recommendation || 'Sem recomendação',
        topActions: Array.isArray(parsed?.topActions || parsed?.top_actions)
          ? (parsed.topActions || parsed.top_actions).map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
          : [],
        approvals: Array.isArray(parsed?.approvals)
          ? parsed.approvals.map((item) => ({
              id: String(item?.id || '').trim(),
              verdict: String(item?.verdict || '').trim(),
              whyNow: String(item?.whyNow || item?.why_now || '').trim(),
              expectedUpside: String(item?.expectedUpside || item?.expected_upside || '').trim()
            })).filter((item) => item.id)
          : []
      };

      await logAiUsage({
        model,
        workflow: 'cockpit-brief',
        mode: 'intermediate',
        inputTokens: raw?.usage?.input_tokens || 0,
        outputTokens: raw?.usage?.output_tokens || 0
      });
    } catch (error) {
      narrative = {
        ...narrative,
        source: {
          provider: 'openai',
          status: 'fallback_after_error',
          label: 'IA em nova leitura',
          model: resolveAiModel('intermediate'),
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      };
    }
  }

  await upsertAdminRuntimeSetting({
    settingKey: AI_COCKPIT_CACHE_KEY,
    actor: 'system',
    value: {
      signature,
      narrative,
      updatedAt: new Date().toISOString()
    }
  });

  return narrative;
}

function attachApprovalGuidance(approvals = {}, narrative) {
  const noteMap = new Map((narrative?.approvals || []).map((item) => [item.id, item]));

  return {
    pending: (approvals.pending || []).map((item) => ({
      ...item,
      aiGuidance: noteMap.get(item.id) || null
    })),
    history: (approvals.history || []).map((item) => ({
      ...item,
      aiGuidance: noteMap.get(item.id) || null
    }))
  };
}

export async function getAdminAiInsightsSnapshot() {
  const [snapshot, history] = await Promise.all([
    getAdminDecisionEngineSnapshot(),
    getAdminHistorySnapshot()
  ]);
  const aiNarrative = await getAiNarrative(snapshot);

  return {
    checkedAt: snapshot.checkedAt,
    summaries: snapshot.summaries,
    mission: snapshot.mission,
    insights: snapshot.insights,
    scores: snapshot.scores,
    promptBundle: snapshot.promptBundle,
    approvals: attachApprovalGuidance(snapshot.approvals, aiNarrative),
    automations: snapshot.automations,
    operations: snapshot.operations,
    executionCenter: buildExecutionCenter(history, snapshot.approvals.pending.length),
    aiNarrative
  };
}

export async function getAdminAiApprovalsSnapshot() {
  const snapshot = await getAdminDecisionEngineSnapshot();
  const aiNarrative = await getAiNarrative(snapshot);

  return {
    checkedAt: snapshot.checkedAt,
    approvals: attachApprovalGuidance(snapshot.approvals, aiNarrative),
    aiNarrative
  };
}

export async function getAdminAiCockpitSnapshot() {
  const cockpit = await getCachedExecutiveCockpitSnapshot();
  const aiNarrative = await getAiCockpitNarrative(cockpit);
  const dailyChecklist = await getAdminDailyChecklistSnapshot({ cockpit });
  const guidanceMap = new Map((aiNarrative?.approvals || []).map((item) => [item.id, item]));

  return {
    ...cockpit,
    approvals: (cockpit.approvals || []).map((item) => ({
      ...item,
      aiGuidance: guidanceMap.get(item.id) || null
    })),
    aiNarrative,
    dailyChecklist
  };
}
