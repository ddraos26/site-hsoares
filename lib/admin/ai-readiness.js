import 'server-only';

import { getAiCostSnapshot } from '@/lib/admin/cost-controller';
import { getExecutionGuardrailsSnapshot } from '@/lib/admin/execution-guardrails';
import { getAdminJobsSnapshot } from '@/lib/admin/job-run-store';
import { getAdminTrackingQualitySnapshot } from '@/lib/admin/tracking-quality';

function resolveModelName() {
  const configured = String(process.env.OPENAI_ADMIN_MODEL || '').trim();
  if (configured) return configured;
  return 'gpt-5-mini';
}

function buildChecklist({ hasApiKey, jobs, cost, guardrails, trackingQuality }) {
  return [
    {
      key: 'api-key',
      title: 'Chave da IA',
      status: hasApiKey ? 'done' : 'pending',
      detail: hasApiKey ? 'A variável OPENAI_API_KEY já está disponível no ambiente.' : 'Falta adicionar OPENAI_API_KEY no ambiente.'
    },
    {
      key: 'model',
      title: 'Modelo operacional',
      status: 'done',
      detail: `Modelo ativo/preferido: ${resolveModelName()}.`
    },
    {
      key: 'budget',
      title: 'Controle de custo',
      status: 'done',
      detail: `Modo atual ${cost.currentModeLabel.toLowerCase()} com teto de ${cost.monthlyBudgetBrl} reais.`
    },
    {
      key: 'guardrails',
      title: 'Guardrails de execução',
      status: 'done',
      detail: guardrails.autonomy.summary
    },
    {
      key: 'tracking',
      title: 'Qualidade de tracking',
      status: trackingQuality.readyForAi ? 'done' : 'pending',
      detail: trackingQuality.summary
    },
    {
      key: 'jobs',
      title: 'Jobs automáticos',
      status: jobs.summary.total > 0 ? 'done' : 'pending',
      detail: jobs.summary.total > 0
        ? `Último ciclo em ${jobs.summary.lastCycleAt || 'registro recente'}`
        : 'Ainda falta rodar o primeiro ciclo automático persistido.'
    },
    {
      key: 'fallback',
      title: 'IA em espera',
      status: 'done',
      detail: 'Mesmo sem a conexão da IA, o sistema continua operando com regras e sinais do proprio painel.'
    }
  ];
}

export async function getAdminAiReadinessSnapshot() {
  const [cost, jobs, guardrails, trackingQuality] = await Promise.all([
    getAiCostSnapshot(),
    getAdminJobsSnapshot(),
    getExecutionGuardrailsSnapshot(),
    getAdminTrackingQualitySnapshot()
  ]);

  const hasApiKey = Boolean(String(process.env.OPENAI_API_KEY || '').trim());
  const baseUrl = String(process.env.OPENAI_BASE_URL || 'https://api.openai.com').trim();
  const model = resolveModelName();
  const checklist = buildChecklist({ hasApiKey, jobs, cost, guardrails, trackingQuality });
  const doneCount = checklist.filter((item) => item.status === 'done').length;

  return {
    checkedAt: new Date().toISOString(),
    provider: {
      configured: hasApiKey,
      status: hasApiKey ? 'ready' : 'missing_key',
      statusLabel: hasApiKey ? 'Pronta para ler' : 'Aguardando chave',
      model,
      baseUrl,
      modeLabel: hasApiKey ? 'IA pronta' : 'IA em espera'
    },
    coverage: {
      modules: [
        'IA / Insights',
        'Aprovações',
        'Missão do Dia',
        'Centro de Decisão'
      ],
      jobsReady: jobs.summary.total > 0,
      trackingReady: trackingQuality.readyForAi
    },
    progress: {
      done: doneCount,
      total: checklist.length,
      percent: Number(((doneCount / checklist.length) * 100).toFixed(1))
    },
    nextAction: hasApiKey
      ? 'A chave já está pronta. O próximo passo é validar no painel se os cards trocaram para IA ativa.'
      : 'Adicionar as credenciais no ambiente e reiniciar o servidor para liberar a leitura da IA.',
    checklist,
    trackingQuality
  };
}
