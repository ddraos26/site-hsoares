import 'server-only';

import { appendJsonlFile, readJsonlFile } from '@/lib/admin/file-log-store';

const AI_USAGE_LOG_FILE = 'ai-usage.jsonl';

export const aiBudgetTiers = {
  economic: { key: 'economic', label: 'Econômico', monthlyBudgetBrl: 50 },
  intermediate: { key: 'intermediate', label: 'Intermediário', monthlyBudgetBrl: 70 },
  premium: { key: 'premium', label: 'Premium controlado', monthlyBudgetBrl: 100 }
};

const modelCatalog = {
  'gpt-5-mini': {
    label: 'GPT-5 Mini',
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.002
  },
  'gpt-5.4': {
    label: 'GPT-5.4',
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.015
  },
  'rules-engine': {
    label: 'Rules Engine',
    inputCostPer1k: 0,
    outputCostPer1k: 0
  }
};

const workflowCatalog = [
  {
    key: 'daily-summary',
    title: 'Resumo diário automático',
    importance: 'Essencial',
    model: 'gpt-5-mini',
    avgInputTokens: 2400,
    avgOutputTokens: 650,
    monthlyRuns: {
      economic: 15,
      intermediate: 30,
      premium: 30
    }
  },
  {
    key: 'weekly-summary',
    title: 'Resumo semanal automático',
    importance: 'Essencial',
    model: 'gpt-5-mini',
    avgInputTokens: 3600,
    avgOutputTokens: 900,
    monthlyRuns: {
      economic: 4,
      intermediate: 4,
      premium: 4
    }
  },
  {
    key: 'priority-ranking',
    title: 'Ranqueamento de prioridades',
    importance: 'Alta',
    model: 'gpt-5-mini',
    avgInputTokens: 2800,
    avgOutputTokens: 700,
    monthlyRuns: {
      economic: 12,
      intermediate: 20,
      premium: 30
    }
  },
  {
    key: 'campaign-decisioning',
    title: 'Revisão estratégica de campanhas',
    importance: 'Opcional',
    model: 'gpt-5.4',
    avgInputTokens: 4200,
    avgOutputTokens: 1100,
    monthlyRuns: {
      economic: 0,
      intermediate: 6,
      premium: 12
    }
  },
  {
    key: 'copy-audit',
    title: 'Análise de copy e landing',
    importance: 'Opcional',
    model: 'gpt-5.4',
    avgInputTokens: 3800,
    avgOutputTokens: 900,
    monthlyRuns: {
      economic: 0,
      intermediate: 4,
      premium: 10
    }
  }
];

function roundCurrency(value) {
  return Number(Number(value || 0).toFixed(2));
}

function sameMonth(dateLike) {
  const date = new Date(dateLike);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export function estimateAiCallCost({ model = 'gpt-5-mini', inputTokens = 0, outputTokens = 0 }) {
  const pricing = modelCatalog[model] || modelCatalog['gpt-5-mini'];
  const inputCost = (Number(inputTokens || 0) / 1000) * pricing.inputCostPer1k;
  const outputCost = (Number(outputTokens || 0) / 1000) * pricing.outputCostPer1k;
  return roundCurrency(inputCost + outputCost);
}

function buildProjectedWorkflows() {
  return workflowCatalog.map((workflow) => {
    const byMode = Object.keys(aiBudgetTiers).reduce((acc, mode) => {
      const monthlyRuns = workflow.monthlyRuns[mode] || 0;
      const estimatedCostPerRun = estimateAiCallCost({
        model: workflow.model,
        inputTokens: workflow.avgInputTokens,
        outputTokens: workflow.avgOutputTokens
      });

      acc[mode] = {
        monthlyRuns,
        estimatedCostPerRun,
        estimatedMonthlyCost: roundCurrency(monthlyRuns * estimatedCostPerRun)
      };
      return acc;
    }, {});

    return {
      ...workflow,
      projected: byMode
    };
  });
}

export async function logAiUsage(entry) {
  const payload = {
    model: entry.model || 'gpt-5-mini',
    workflow: entry.workflow || 'manual',
    mode: entry.mode || 'intermediate',
    inputTokens: Number(entry.inputTokens || 0),
    outputTokens: Number(entry.outputTokens || 0),
    estimatedCost: entry.estimatedCost != null
      ? roundCurrency(entry.estimatedCost)
      : estimateAiCallCost(entry),
    createdAt: entry.createdAt || new Date().toISOString()
  };

  await appendJsonlFile(AI_USAGE_LOG_FILE, payload);
  return payload;
}

function decideSuggestedMode(totalSpent) {
  if (totalSpent >= aiBudgetTiers.intermediate.monthlyBudgetBrl) {
    return 'economic';
  }

  if (totalSpent >= aiBudgetTiers.economic.monthlyBudgetBrl * 0.8) {
    return 'intermediate';
  }

  return 'premium';
}

export async function getAiCostSnapshot() {
  const rows = await readJsonlFile(AI_USAGE_LOG_FILE);
  const monthlyRows = rows.filter((row) => sameMonth(row.createdAt));
  const totalSpent = roundCurrency(monthlyRows.reduce((sum, row) => sum + Number(row.estimatedCost || 0), 0));
  const totalInputTokens = monthlyRows.reduce((sum, row) => sum + Number(row.inputTokens || 0), 0);
  const totalOutputTokens = monthlyRows.reduce((sum, row) => sum + Number(row.outputTokens || 0), 0);
  const projectedWorkflows = buildProjectedWorkflows();
  const suggestedMode = decideSuggestedMode(totalSpent);
  const currentTier = aiBudgetTiers[suggestedMode];

  const projectedByMode = Object.keys(aiBudgetTiers).reduce((acc, mode) => {
    acc[mode] = roundCurrency(
      projectedWorkflows.reduce((sum, workflow) => sum + workflow.projected[mode].estimatedMonthlyCost, 0)
    );
    return acc;
  }, {});

  const groupedByWorkflow = monthlyRows.reduce((acc, row) => {
    const key = row.workflow || 'manual';
    if (!acc[key]) {
      acc[key] = {
        workflow: key,
        calls: 0,
        estimatedCost: 0
      };
    }

    acc[key].calls += 1;
    acc[key].estimatedCost = roundCurrency(acc[key].estimatedCost + Number(row.estimatedCost || 0));
    return acc;
  }, {});

  const recentLogs = [...monthlyRows]
    .sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''))
    .slice(0, 12);

  return {
    checkedAt: new Date().toISOString(),
    budgets: aiBudgetTiers,
    currentMode: suggestedMode,
    currentModeLabel: currentTier.label,
    monthlyBudgetBrl: currentTier.monthlyBudgetBrl,
    totalSpent,
    usagePercent: currentTier.monthlyBudgetBrl
      ? Number(((totalSpent / currentTier.monthlyBudgetBrl) * 100).toFixed(1))
      : 0,
    totalInputTokens,
    totalOutputTokens,
    projectedByMode,
    workflowCatalog: projectedWorkflows,
    workflowUsage: Object.values(groupedByWorkflow).sort((a, b) => b.estimatedCost - a.estimatedCost),
    recentLogs,
    policy: {
      reduceFrequency: suggestedMode === 'economic',
      useEconomicMode: suggestedMode === 'economic',
      promptCompression: suggestedMode !== 'premium',
      stopNonEssential: totalSpent >= aiBudgetTiers.intermediate.monthlyBudgetBrl
    }
  };
}
